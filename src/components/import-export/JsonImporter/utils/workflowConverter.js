import { v4 as uuidv4 } from 'uuid';
import { calculateNodePositions } from './nodePositioning';

// Convert serverless workflow JSON to React Flow nodes and edges
export function convertWorkflowToReactFlow(workflowData, retryPolicyNameToId = {}) {
  const nodes = [];
  const edges = [];
  const nodePositions = calculateNodePositions(workflowData.states);

  // Helper function to get next state from transition (handles both string and object formats)
  const getNextState = (transition) => {
    if (typeof transition === 'string') {
      return transition;
    }
    return transition?.nextState || transition?.to || null;
  };

  // Helper function to get start state name (handles both string and object formats)
  const getStartStateName = (start) => {
    if (typeof start === 'string') {
      return start;
    }
    return start?.stateName || start?.name || null;
  };

  // Convert states to nodes
  workflowData.states.forEach((state, index) => {
    const position = nodePositions[state.name] || {
      x: 100 + (index * 250),
      y: 100
    };

    const nodeData = convertStateToNodeData(state, retryPolicyNameToId);
    const nodeId = `${state.name}-${Date.now()}-${index}`;

    const node = {
      id: nodeId,
      type: getNodeType(state.type),
      position,
      data: nodeData,
    };

    nodes.push(node);
  });

  // Create start node and connect it to the first state
  const startStateName = getStartStateName(workflowData.start);
  if (startStateName) {
    const startStateNode = nodes.find((n) => n.data.name === startStateName);
    if (startStateNode) {
      const startNode = {
        id: `start-${Date.now()}`,
        type: 'start',
        position: {
          x: startStateNode.position.x - 200,
          y: startStateNode.position.y
        },
        data: { label: 'Start' },
      };
      nodes.unshift(startNode);

      // Connect start node to first state
      edges.push({
        id: `start-to-${startStateNode.id}`,
        source: startNode.id,
        target: startStateNode.id,
        type: 'default',
        className: 'edge-simple edge-animated',
        label: `→ ${startStateName}`,
        style: { strokeWidth: 2 },
        data: { type: 'simple' },
        labelStyle: { fill: '#10b981', fontWeight: 500, fontSize: '12px' },
        labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: 'arrowclosed',
          width: 20,
          height: 20,
        },
      });
    }
  }

  // Create edges based on transitions
  workflowData.states.forEach((state, index) => {
    const sourceNodeId = `${state.name}-${Date.now()}-${index}`;

    // Handle regular transitions
    if (state.transition && !state.end) {
      const nextState = getNextState(state.transition);
      if (nextState) {
        const targetState = workflowData.states.find(s => s.name === nextState);
        if (targetState) {
          const targetIndex = workflowData.states.indexOf(targetState);
          const targetNodeId = `${targetState.name}-${Date.now()}-${targetIndex}`;

          edges.push({
            id: `${sourceNodeId}-to-${targetNodeId}`,
            source: sourceNodeId,
            target: targetNodeId,
            type: 'default',
            className: 'edge-simple edge-animated',
            label: `→ ${nextState}`,
            style: { strokeWidth: 2 },
            data: { type: 'simple' },
            labelStyle: { fill: '#10b981', fontWeight: 500, fontSize: '12px' },
            labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
            labelBgPadding: [6, 3],
            labelBgBorderRadius: 4,
            markerEnd: {
              type: 'arrowclosed',
              width: 20,
              height: 20,
            },
          });
        }
      }
    }

    // Handle error transitions for operation states
    if (state.type === 'operation' && state.onErrors) {
      state.onErrors.forEach((errorHandler, errorIndex) => {
        if (errorHandler.transition) {
          const errorNextState = getNextState(errorHandler.transition);
          if (errorNextState) {
            const targetState = workflowData.states.find(s => s.name === errorNextState);
            if (targetState) {
              const targetIndex = workflowData.states.indexOf(targetState);
              const targetNodeId = `${targetState.name}-${Date.now()}-${targetIndex}`;

              edges.push({
                id: `${sourceNodeId}-error-${errorIndex}-to-${targetNodeId}`,
                source: sourceNodeId,
                target: targetNodeId,
                sourceHandle: `error-${errorIndex}`,
                type: 'default',
                className: 'edge-error',
                label: `⚠ ${errorHandler.errorRef || 'error'}`,
                labelStyle: { fill: 'rgba(239, 68, 68, 0.6)', fontWeight: 500, fontSize: '12px' },
                style: { strokeWidth: 2, strokeDasharray: '5,5', stroke: 'rgba(239, 68, 68, 0.4)' },
              });
            }
          }
        }
      });
    }

    // Handle switch conditions
    if (state.type === 'switch') {
      // Data conditions
      if (state.dataConditions) {
        state.dataConditions.forEach((condition, conditionIndex) => {
          if (condition.transition) {
            const conditionNextState = getNextState(condition.transition);
            if (conditionNextState) {
              const targetState = workflowData.states.find(s => s.name === conditionNextState);
              if (targetState) {
                const targetIndex = workflowData.states.indexOf(targetState);
                const targetNodeId = `${targetState.name}-${Date.now()}-${targetIndex}`;

                edges.push({
                  id: `${sourceNodeId}-condition-${conditionIndex}-to-${targetNodeId}`,
                  source: sourceNodeId,
                  target: targetNodeId,
                  sourceHandle: `condition-${conditionIndex}`,
                  type: 'default',
                  className: 'edge-condition',
                  label: condition.name || condition.condition || `condition${conditionIndex + 1}`,
                  style: { strokeWidth: 2 },
                  data: { type: 'condition' },
                  labelStyle: { fill: '#f59e0b', fontWeight: 500, fontSize: '12px' },
                  labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
                  labelBgPadding: [6, 3],
                  labelBgBorderRadius: 4,
                  markerEnd: {
                    type: 'arrowclosed',
                    width: 20,
                    height: 20,
                  },
                });
              }
            }
          }
        });
      }

      // Event conditions
      if (state.eventConditions) {
        state.eventConditions.forEach((condition, conditionIndex) => {
          if (condition.transition) {
            const eventConditionNextState = getNextState(condition.transition);
            if (eventConditionNextState) {
              const targetState = workflowData.states.find(s => s.name === eventConditionNextState);
              if (targetState) {
                const targetIndex = workflowData.states.indexOf(targetState);
                const targetNodeId = `${targetState.name}-${Date.now()}-${targetIndex}`;

                edges.push({
                  id: `${sourceNodeId}-event-condition-${conditionIndex}-to-${targetNodeId}`,
                  source: sourceNodeId,
                  target: targetNodeId,
                  sourceHandle: `condition-${conditionIndex}`,
                  type: 'default',
                  className: 'edge-condition',
                  label: condition.name || condition.eventRef || `event${conditionIndex + 1}`,
                  style: { strokeWidth: 2 },
                  data: { type: 'condition' },
                  labelStyle: { fill: '#8b5cf6', fontWeight: 500, fontSize: '12px' },
                  labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
                  labelBgPadding: [6, 3],
                  labelBgBorderRadius: 4,
                  markerEnd: {
                    type: 'arrowclosed',
                    width: 20,
                    height: 20,
                  },
                });
              }
            }
          }
        });
      }

      // Default condition
      if (state.defaultCondition && state.defaultCondition.transition) {
        const defaultNextState = getNextState(state.defaultCondition.transition);
        if (defaultNextState) {
          const targetState = workflowData.states.find(s => s.name === defaultNextState);
          if (targetState) {
            const targetIndex = workflowData.states.indexOf(targetState);
            const targetNodeId = `${targetState.name}-${Date.now()}-${targetIndex}`;

            edges.push({
              id: `${sourceNodeId}-default-to-${targetNodeId}`,
              source: sourceNodeId,
              target: targetNodeId,
              sourceHandle: 'default',
              type: 'default',
              className: 'edge-default',
              label: 'default',
              style: { strokeWidth: 2 },
              data: { type: 'default' },
              labelStyle: { fill: '#6b7280', fontWeight: 500, fontSize: '12px' },
              labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
              labelBgPadding: [6, 3],
              labelBgBorderRadius: 4,
              markerEnd: {
                type: 'arrowclosed',
                width: 20,
                height: 20,
              },
            });
          }
        }
      }
    }
  });

  return { nodes, edges };
}

// Convert a serverless workflow state to React Flow node data
function convertStateToNodeData(state, retryPolicyNameToId = {}) {
  const baseData = {
    label: state.name,
    name: state.name,
    metadata: state.metadata || {},
  };

  switch (state.type) {
    case 'operation':
      return {
        ...baseData,
        actions: state.actions?.map(action => ({
          ...action,
          retryRef: action.retryRef && retryPolicyNameToId[action.retryRef]
            ? retryPolicyNameToId[action.retryRef]
            : action.retryRef
        })) || [],
        onErrors: state.onErrors || [],
        stateDataFilter: state.stateDataFilter,
      };

    case 'switch':
      return {
        ...baseData,
        conditionType: state.dataConditions ? 'data' : 'event',
        dataConditions: state.dataConditions || [],
        eventConditions: state.eventConditions || [],
        defaultCondition: !!state.defaultCondition,
      };

    case 'event':
      return {
        ...baseData,
        events: state.onEvents?.map(event => ({
          eventRefs: event.eventRefs || [],
          actions: event.actions || [],
        })) || [],
        timeouts: state.timeouts || {},
      };

    case 'sleep':
      return {
        ...baseData,
        duration: state.duration || 'PT30M',
      };

    case 'parallel':
      return {
        ...baseData,
        branches: state.branches || [],
      };

    default:
      return baseData;
  }
}

// Map serverless workflow state types to React Flow node types
function getNodeType(stateType) {
  const typeMap = {
    'operation': 'operation',
    'switch': 'switch',
    'event': 'event',
    'sleep': 'sleep',
    'parallel': 'operation', // Use operation for now
    'inject': 'operation',
    'foreach': 'operation',
    'callback': 'operation'
  };

  return typeMap[stateType] || 'operation';
}
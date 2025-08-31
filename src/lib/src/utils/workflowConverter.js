export function getNodeStateName(node) {
 return node.data.name || node.id.replace(/-\d+$/, '');
}

export function convertNodeToState(node, edges, allNodes, workflowMetadata) {
 const stateName = getNodeStateName(node);

 // Find outgoing edges from this node
 const outgoingEdges = edges.filter((edge) => edge.source === node.id);

 // Base state with metadata
 const baseState = {
  name: stateName,
  type: node.type,
 };

 // Add metadata if it exists and has content
 if (node.data.metadata && Object.keys(node.data.metadata).length > 0) {
  baseState.metadata = node.data.metadata;
 }

 switch (node.type) {
  case 'operation':
   const isOperationEnd =
    outgoingEdges.length === 0 || hasEndNodeTarget(outgoingEdges, allNodes);
   // Process actions and add retry policy references at action level
   const processedActions = (node.data.actions || []).map(action => {
    const processedAction = { ...action };

    // Add retry policy reference if action has one and it's valid
    if (action.retryRef && workflowMetadata?.retryPolicies) {
     const retryPolicy = workflowMetadata.retryPolicies.find(policy => policy.id === action.retryRef);
     if (retryPolicy) {
      processedAction.retryRef = retryPolicy.name;
     }
     // Note: If retryPolicy is not found, we intentionally don't include retryRef in the export
    }

    // Include actionDataFilter if it exists and has meaningful values
    if (action.actionDataFilter) {
     const filter = action.actionDataFilter;
     const hasValues = filter.useResults || filter.results || filter.toStateData;

     if (hasValues) {
      processedAction.actionDataFilter = {};

      // Only include useResults if it's true
      if (filter.useResults) {
       processedAction.actionDataFilter.useResults = filter.useResults;
      }

      // Only include results if it has a value
      if (filter.results && filter.results.trim()) {
       processedAction.actionDataFilter.results = filter.results;
      }

      // Only include toStateData if it has a value
      if (filter.toStateData && filter.toStateData.trim()) {
       processedAction.actionDataFilter.toStateData = filter.toStateData;
      }
     }
    }

    return processedAction;
   });

   const operationState = {
    ...baseState,
    actions: processedActions,
   };

   if (isOperationEnd) {
    operationState.end = true;
   } else {
    operationState.transition = getTransition(node, outgoingEdges, allNodes);
   }

   return operationState;

  case 'event':
   const isEventEnd = outgoingEdges.length === 0 || hasEndNodeTarget(outgoingEdges, allNodes);
   const eventState = {
    ...baseState,
    onEvents: node.data.events || [],
    timeouts: node.data.timeouts || {},
   };

   if (isEventEnd) {
    eventState.end = true;
   } else {
    eventState.transition = getTransition(node, outgoingEdges, allNodes);
   }

   return eventState;

  case 'sleep':
   const isSleepEnd = outgoingEdges.length === 0 || hasEndNodeTarget(outgoingEdges, allNodes);
   const sleepState = {
    ...baseState,
    duration: node.data.duration || 'PT30M',
   };

   if (isSleepEnd) {
    sleepState.end = true;
   } else {
    sleepState.transition = getTransition(node, outgoingEdges, allNodes);
   }

   return sleepState;

  case 'switch':
   const switchState = {
    ...baseState,
    defaultCondition: node.data.defaultCondition || { transition: { nextState: '' } },
   };


   // Determine condition type and handle accordingly
   const conditionType = node.data.conditionType || 'data';
   const dataConditions = node.data.dataConditions || [];
   const eventConditions = node.data.eventConditions || [];
   const conditions = conditionType === 'data' ? dataConditions : eventConditions;

   // Add timeouts for event conditions
   if (conditionType === 'event' && node.data.timeouts && node.data.timeouts.eventTimeout) {
    switchState.timeouts = node.data.timeouts;
   }

   if (conditionType === 'data') {
    switchState.dataConditions = [];
    conditions.forEach((condition, index) => {
     const conditionEdge = outgoingEdges.find(
      (edge) => edge.sourceHandle === `condition-${index}`
     );

     const conditionData = { ...condition };

     // Add condition metadata if it exists
     if (condition.metadata && Object.keys(condition.metadata).length > 0) {
      conditionData.metadata = condition.metadata;
     }

     if (conditionEdge) {
      const targetNode = allNodes.find((n) => n.id === conditionEdge.target);
      if (targetNode && targetNode.type === 'end') {
       conditionData.end = true;
       // Remove transition property when ending
       delete conditionData.transition;
      } else {
       conditionData.transition = {
        nextState: getTargetStateName(conditionEdge.target, allNodes),
       };
      }
     } else {
      // No edge found, use existing transition if available
      const nextState = condition.transition?.nextState || '';
      if (nextState) {
       conditionData.transition = { nextState };
      }
     }

     switchState.dataConditions.push(conditionData);
    });
   } else {
    switchState.eventConditions = [];
    conditions.forEach((condition, index) => {
     const conditionEdge = outgoingEdges.find(
      (edge) => edge.sourceHandle === `condition-${index}`
     );

     const conditionData = { ...condition };

     // Add condition metadata if it exists
     if (condition.metadata && Object.keys(condition.metadata).length > 0) {
      conditionData.metadata = condition.metadata;
     }

     if (conditionEdge) {
      const targetNode = allNodes.find((n) => n.id === conditionEdge.target);
      if (targetNode && targetNode.type === 'end') {
       conditionData.end = true;
       // Remove transition property when ending
       delete conditionData.transition;
      } else {
       conditionData.transition = {
        nextState: getTargetStateName(conditionEdge.target, allNodes),
       };
      }
     } else {
      // No edge found, use existing transition if available
      const nextState = condition.transition?.nextState || '';
      if (nextState) {
       conditionData.transition = { nextState };
      }
     }

     switchState.eventConditions.push(conditionData);
    });
   }

   // Handle default condition
   const defaultEdge = outgoingEdges.find((edge) => edge.sourceHandle === 'default');
   if (defaultEdge) {
    const targetNode = allNodes.find((n) => n.id === defaultEdge.target);
    if (targetNode && targetNode.type === 'end') {
     switchState.defaultCondition = { end: true };
    } else {
     switchState.defaultCondition = {
      transition: { nextState: getTargetStateName(defaultEdge.target, allNodes) },
     };
    }
   }

   return switchState;

  case 'end':
   return null; // End nodes don't become states, they're handled by the end property

  default:
   return null;
 }
}

export function getTransition(node, outgoingEdges, allNodes) {
 if (outgoingEdges.length === 0) {
  return undefined;
 }

 const targetNodeId = outgoingEdges[0].target;
 const targetNode = allNodes.find((n) => n.id === targetNodeId);

 if (targetNode && targetNode.type === 'end') {
  return undefined; // No transition needed for end nodes
 }

 return {
  nextState: getTargetStateName(targetNodeId, allNodes),
 };
}

export function getTargetStateName(targetNodeId, allNodes) {
 const targetNode = allNodes.find((n) => n.id === targetNodeId);
 if (targetNode && targetNode.type === 'end') {
  return ''; // End nodes don't have state names
 }
 return targetNode ? getNodeStateName(targetNode) : targetNodeId.replace(/-\d+$/, '');
}

export function hasEndNodeTarget(outgoingEdges, allNodes) {
 return outgoingEdges.some((edge) => {
  const targetNode = allNodes.find((n) => n.id === edge.target);
  return targetNode && targetNode.type === 'end';
 });
}

export function createServerlessWorkflow(nodes, edges, workflowMetadata, workflowInfo) {
 // Find the start node and its first connected state
 const startNode = nodes.find((node) => node.type === 'start');
 let startStateName = 'start';

 if (startNode) {
  const startEdge = edges.find((edge) => edge.source === startNode.id);
  if (startEdge) {
   const firstState = nodes.find((node) => node.id === startEdge.target);
   if (firstState && firstState.type !== 'end') {
    startStateName = getNodeStateName(firstState);
   }
  }
 }

 // Convert nodes to states, excluding start nodes as they're not states
 const states = nodes
  .filter((node) => node.type !== 'start')
  .map((node) => convertNodeToState(node, edges, nodes, workflowMetadata));

 // Build the complete serverless workflow
 const workflow = {
  id: workflowInfo.id,
  version: workflowInfo.version,
  specVersion: "0.8.0",
  name: workflowInfo.name,
  description: workflowInfo.description,
  start: startStateName,
  states: states.filter((state) => state !== null),
 };

 // Add retry policies if they exist
 if (workflowMetadata?.retryPolicies && workflowMetadata.retryPolicies.length > 0) {
  workflow.retries = workflowMetadata.retryPolicies.map(policy => {
   // Convert policy to Serverless Workflow format (exclude internal ID)
   const { id, ...exportPolicy } = policy;
   return exportPolicy;
  });
 }

 return workflow;
}

export function createReactFlowData(nodes, edges, workflowMetadata, workflowInfo) {
 return {
  format: 'react-flow-workflow',
  version: '1.0',
  metadata: {
   createdAt: new Date().toISOString(),
   name: workflowInfo.name,
   description: workflowInfo.description,
  },
  nodes,
  edges,
  workflowMetadata,
 };
}

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
        data: {
          name: 'Start',
          metadata: {}
        },
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

// Calculate positions for workflow nodes using different layouts
function calculateNodePositions(states) {
  const positions = {};
  const totalNodes = states.length + 1; // +1 for potential start node

  // Helper function to determine layout type based on workflow structure
  const getLayoutType = () => {
    const hasComplexBranching = states.some(state =>
      state.type === 'switch' && (
        (state.dataConditions && state.dataConditions.length > 2) ||
        (state.eventConditions && state.eventConditions.length > 2)
      )
    );

    const hasParallelPaths = states.some(state =>
      state.type === 'parallel' ||
      (state.type === 'switch' && state.dataConditions && state.dataConditions.length > 1)
    );

    if (hasComplexBranching || totalNodes > 10) return 'hierarchical';
    if (hasParallelPaths) return 'branching';
    return 'sequential';
  };

  const layoutType = getLayoutType();
  const baseSpacing = { x: 300, y: 150 };

  states.forEach((state, index) => {
    let x, y;

    switch (layoutType) {
      case 'sequential':
        // Simple left-to-right layout
        x = 100 + (index * baseSpacing.x);
        y = 100;
        break;

      case 'branching':
        // Grid layout with staggered positioning for branches
        const columns = Math.min(3, Math.ceil(Math.sqrt(totalNodes)));
        const horizontalSpacing = baseSpacing.x;
        const verticalSpacing = baseSpacing.y;
        const row = Math.floor(index / columns);
        const col = index % columns;
        x = 100 + (col * horizontalSpacing);
        y = 100 + (row * verticalSpacing);
        break;

      case 'hierarchical':
        // More spread out layout for complex workflows
        const columns2 = Math.min(3, Math.ceil(Math.sqrt(totalNodes * 1.2)));
        const horizontalSpacing2 = baseSpacing.x * 1.2;
        const verticalSpacing2 = baseSpacing.y * 1.1;
        const row2 = Math.floor(index / columns2);
        const col2 = index % columns2;
        x = 100 + (col2 * horizontalSpacing2);
        y = 100 + (row2 * verticalSpacing2);
        // Add staggering to reduce visual clutter
        const staggerOffset = (row2 % 2) * (horizontalSpacing2 * 0.3);
        x += staggerOffset;
        break;

      default:
        x = 100 + (index * baseSpacing.x);
        y = 100;
    }

    positions[state.name] = { x, y };
  });

  return positions;
}
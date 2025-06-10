import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import './JsonImporter.css';

const JsonImporter = ({ onImport, onClose }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [importMode, setImportMode] = useState('paste'); // 'paste' or 'file'
  const modalRef = useRef(null);

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonInput);

      // Check if this is a React Flow format
      if (data.format === 'react-flow-workflow') {
        // Direct import of React Flow format
        if (!data.nodes || !data.edges) {
          throw new Error('Invalid React Flow format: missing nodes or edges');
        }

        onImport(data.nodes, data.edges, data.workflowMetadata || null);
        onClose();
        return;
      }

      // Handle serverless workflow format
      const workflowData = data;

      // Basic validation for serverless workflow
      if (!workflowData.states || !Array.isArray(workflowData.states)) {
        throw new Error('Invalid workflow format: missing or invalid states array');
      }

      // Create retry policies with IDs first
      const retryPolicyNameToId = {};
      const retryPolicies = (workflowData.retries || workflowData.retryPolicies || []).map(policy => {
        const id = uuidv4();
        retryPolicyNameToId[policy.name] = id;
        return {
          ...policy,
          id
        };
      });

      // Convert serverless workflow to nodes and edges
      const { nodes, edges } = convertWorkflowToReactFlow(workflowData, retryPolicyNameToId);

      // Create workflow metadata
      const metadata = {
        retryPolicies
      };

      onImport(nodes, edges, metadata);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid JSON format');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setJsonInput(e.target.result);
        setError('');
      };
      reader.readAsText(file);
    }
  };

  // Handle escape key and outside click
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const loadExampleWorkflow = () => {
    const exampleWorkflow = {
      id: 'example-workflow',
      version: '1.0',
      name: 'Example Workflow',
      description: 'A simple example workflow',
      start: 'assessUrgency',
      retryPolicies: [
        {
          name: 'simpleRetry',
          delay: 'PT2S',
          maxAttempts: 3,
          increment: 'PT1S',
          multiplier: 2.0,
          maxDelay: 'PT30S',
          jitter: {
            from: 'PT0S',
            to: 'PT1S'
          }
        }
      ],
      states: [
        {
          name: 'assessUrgency',
          type: 'operation',
          retryRef: 'simpleRetry',
          actions: [
            {
              name: 'assess',
              functionRef: {
                refName: 'assessFunction',
                arguments: {
                  input: '${.input}',
                },
              },
              actionDataFilter: {
                useResults: true,
                results: '${.assessmentResult}',
                toStateData: '${.urgencyLevel}'
              }
            },
          ],
          transition: {
            nextState: 'makeDecision',
          },
        },
        {
          name: 'makeDecision',
          type: 'switch',
          dataConditions: [
            {
              name: 'highUrgency',
              condition: ".urgency == 'high'",
              transition: {
                nextState: 'processUrgent',
              },
            },
            {
              name: 'lowUrgency',
              condition: ".urgency == 'low'",
              transition: {
                nextState: 'processNormal',
              },
            },
          ],
          defaultCondition: {
            transition: {
              nextState: 'processNormal',
            },
          },
        },
        {
          name: 'processUrgent',
          type: 'operation',
          actions: [
            {
              name: 'urgentAction',
              functionRef: {
                refName: 'urgentProcessor',
                arguments: {},
              },
            },
          ],
          end: true,
        },
        {
          name: 'processNormal',
          type: 'operation',
          actions: [
            {
              name: 'normalAction',
              functionRef: {
                refName: 'normalProcessor',
                arguments: {},
              },
            },
          ],
          end: true,
        },
      ],
    };

    setJsonInput(JSON.stringify(exampleWorkflow, null, 2));
    setError('');
  };

  return (
    <div className="json-importer-overlay">
      <div className="json-importer" ref={modalRef}>
        <div className="importer-header">
          <h2>Import Workflow</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="import-mode-selector">
          <button
            className={`mode-btn ${importMode === 'paste' ? 'active' : ''}`}
            onClick={() => setImportMode('paste')}
          >
            <FileText size={16} />
            Paste JSON
          </button>
          <button
            className={`mode-btn ${importMode === 'file' ? 'active' : ''}`}
            onClick={() => setImportMode('file')}
          >
            <Upload size={16} />
            Upload File
          </button>
        </div>

        {importMode === 'file' && (
          <div className="file-upload-section">
            <input type="file" accept=".json" onChange={handleFileUpload} className="file-input" />
            <p className="file-help">Select a .json file containing a serverless workflow</p>
          </div>
        )}

        <div className="json-input-section">
          <div className="input-header">
            <label>Workflow JSON</label>
            <button className="example-btn" onClick={loadExampleWorkflow}>
              Load Example
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setError('');
            }}
            placeholder="Paste your workflow JSON here (Serverless Workflow or React Flow format)..."
            rows="15"
            className="json-textarea"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="importer-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="import-btn" onClick={handleImport} disabled={!jsonInput.trim()}>
            Import Workflow
          </button>
        </div>
      </div>
    </div>
  );
};

// Convert serverless workflow JSON to React Flow nodes and edges
function convertWorkflowToReactFlow(workflowData, retryPolicyNameToId = {}) {
  const nodes = [];
  const edges = [];
  const nodePositions = calculateNodePositions(workflowData.states);

  // Helper function to get next state from transition (handles both string and object formats)
  const getNextState = (transition) => {
    if (typeof transition === 'string') {
      return transition;
    }
    if (transition && typeof transition === 'object' && transition.nextState) {
      return transition.nextState;
    }
    return null;
  };

  // Create start node positioned above the workflow
  const startNode = {
    id: 'start-1',
    type: 'start',
    position: { x: 50, y: 0 }, // Position above the main workflow
    data: { label: 'Start' },
  };
  nodes.push(startNode);

  // Create nodes for each state
  workflowData.states.forEach((state, index) => {
    const nodeId = `${state.name}-${Date.now()}-${index}`;
    const position = nodePositions[state.name] || { x: 200 + index * 250, y: 100 };

    const nodeData = {
      label: state.name,
      name: state.name,
      ...convertStateToNodeData(state, retryPolicyNameToId),
    };

    const node = {
      id: nodeId,
      type: state.type, // Keep the original type, including 'event'
      position,
      data: nodeData,
    };

    nodes.push(node);
  });

  // Create edges based on transitions
  const stateNodeMap = {};
  nodes.forEach((node) => {
    if (node.data.name) {
      stateNodeMap[node.data.name] = node.id;
    }
  });

  // Connect start node to the first state
  if (workflowData.start) {
    const startStateNode = nodes.find((n) => n.data.name === workflowData.start);
    if (startStateNode) {
      edges.push({
        id: `start-to-${workflowData.start}`,
        source: startNode.id,
        target: startStateNode.id,
        label: `→ ${workflowData.start}`,
        type: 'default',
        animated: true,
        className: 'edge-simple',
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

  // Create edges for each state's transitions
  workflowData.states.forEach((state) => {
    const sourceNodeId = stateNodeMap[state.name];
    if (!sourceNodeId) return;

    // Get the processed node data (which has IDs for error handlers)
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;

    // Handle operation, event, and sleep states with simple transitions
    const nextState = getNextState(state.transition);
    if ((state.type === 'operation' || state.type === 'event' || state.type === 'sleep') && nextState) {
      const targetNodeId = stateNodeMap[nextState];
      if (targetNodeId) {
        edges.push({
          id: `${state.name}-to-${nextState}`,
          source: sourceNodeId,
          target: targetNodeId,
          label: `→ ${nextState}`,
          type: 'default',
          animated: true,
          className: 'edge-simple',
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

    // Handle onErrors transitions for operation states
    if (state.type === 'operation' && sourceNode.data.onErrors && Array.isArray(sourceNode.data.onErrors)) {
      sourceNode.data.onErrors.forEach((errorHandler, index) => {
        const errorNextState = getNextState(errorHandler.transition);
        if (errorNextState) {
          const targetNodeId = stateNodeMap[errorNextState];
          if (targetNodeId) {
            edges.push({
              id: `${state.name}-error-${errorHandler.id}-to-${errorNextState}`,
              source: sourceNodeId,
              sourceHandle: errorHandler.id,
              target: targetNodeId,
              label: `⚠ ${errorHandler.errorRef || 'error'}`,
              type: 'default',
              className: 'edge-error',
              style: {
                strokeWidth: 2,
                strokeDasharray: '5,5',
                stroke: 'rgba(239, 68, 68, 0.4)'
              },
              data: { type: 'error' },
              labelStyle: { fill: 'rgba(239, 68, 68, 0.6)', fontWeight: 500, fontSize: '12px' },
              labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
              labelBgPadding: [6, 3],
              labelBgBorderRadius: 4,
              markerEnd: {
                type: 'arrowclosed',
                width: 20,
                height: 20,
                color: 'rgba(239, 68, 68, 0.4)',
              },
            });
          }
        }
      });
    } else if (state.type === 'switch') {
      // Handle data conditions
      if (state.dataConditions) {
        state.dataConditions.forEach((condition, index) => {
          const conditionNextState = getNextState(condition.transition);
          if (conditionNextState) {
            const targetNodeId = stateNodeMap[conditionNextState];
            if (targetNodeId) {
              edges.push({
                id: `${state.name}-${condition.name || index}-to-${conditionNextState}`,
                source: sourceNodeId,
                sourceHandle: `condition-${index}`,
                target: targetNodeId,
                label: condition.name || condition.condition || `Condition ${index + 1}`,
                type: 'default',
                className: 'edge-condition',
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
        });
      }

      // Handle event conditions
      if (state.eventConditions) {
        state.eventConditions.forEach((condition, index) => {
          const eventConditionNextState = getNextState(condition.transition);
          if (eventConditionNextState) {
            const targetNodeId = stateNodeMap[eventConditionNextState];
            if (targetNodeId) {
              edges.push({
                id: `${state.name}-${condition.name || index}-to-${eventConditionNextState}`,
                source: sourceNodeId,
                sourceHandle: `condition-${index}`,
                target: targetNodeId,
                label: condition.name || condition.eventRef || `Event ${index + 1}`,
                type: 'default',
                className: 'edge-condition',
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
        });
      }

      // Handle default condition
      const defaultNextState = getNextState(state.defaultCondition?.transition);
      if (defaultNextState) {
        const targetNodeId = stateNodeMap[defaultNextState];
        if (targetNodeId) {
          edges.push({
            id: `${state.name}-default-to-${defaultNextState}`,
            source: sourceNodeId,
            sourceHandle: 'default',
            target: targetNodeId,
            label: 'default',
            type: 'default',
            className: 'edge-default',
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

    // Create end nodes for states marked as end
    if (state.end) {
      const endNodeId = `end-${state.name}-${Date.now()}`;
      const sourceNode = nodes.find((n) => n.id === sourceNodeId);
      const sourcePosition = sourceNode ? sourceNode.position : { x: 0, y: 0 };

      const endNode = {
        id: endNodeId,
        type: 'end',
        position: {
          x: sourcePosition.x + 450, // More spacing to the right
          y: sourcePosition.y + 50,   // Slight offset down for visual clarity
        },
        data: { label: 'End' },
      };
      nodes.push(endNode);

      edges.push({
        id: `${state.name}-to-end`,
        source: sourceNodeId,
        target: endNodeId,
        label: 'end',
        type: 'default',
        className: 'edge-end',
        style: { strokeWidth: 3 },
        data: { type: 'end' },
        labelStyle: { fill: 'rgba(239, 68, 68, 0.8)', fontWeight: 500, fontSize: '12px' },
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
  });

  return { nodes, edges };
}

function convertStateToNodeData(state, retryPolicyNameToId = {}) {
  switch (state.type) {
    case 'operation':
      const operationData = {
        actions: state.actions || [],
        onErrors: (state.onErrors || []).map(errorHandler => ({
          ...errorHandler,
          id: errorHandler.id || uuidv4(), // Always add ID for imported error handlers
        })),
      };

      // Convert retry policy name reference to ID reference (can be at state level or action level)
      if (state.retryRef && retryPolicyNameToId[state.retryRef]) {
        operationData.retryRef = retryPolicyNameToId[state.retryRef];
        operationData.retryRefName = state.retryRef;
      }

      // Also check for retry references in actions and preserve actionDataFilter
      if (operationData.actions) {
        operationData.actions = operationData.actions.map(action => {
          const updatedAction = { ...action };
          if (action.retryRef && retryPolicyNameToId[action.retryRef]) {
            updatedAction.retryRef = retryPolicyNameToId[action.retryRef];
          }

          // Preserve actionDataFilter if it exists
          if (action.actionDataFilter) {
            updatedAction.actionDataFilter = { ...action.actionDataFilter };
          }

          return updatedAction;
        });
      }

      // If no state-level retry policy but actions have retry policies, 
      // promote the first action's retry policy to state level for UI compatibility
      if (!operationData.retryRef && operationData.actions && operationData.actions.length > 0) {
        const firstAction = operationData.actions[0];
        const firstActionRetryRefName = state.actions && state.actions[0] && state.actions[0].retryRef;
        if (firstAction.retryRef && firstActionRetryRefName) {
          operationData.retryRef = firstAction.retryRef;
          operationData.retryRefName = firstActionRetryRefName;
        }
      }

      return operationData;
    case 'switch':
      const hasDataConditions = state.dataConditions && state.dataConditions.length > 0;
      const hasEventConditions = state.eventConditions && state.eventConditions.length > 0;

      const switchData = {
        conditionType: hasDataConditions ? 'data' : 'event',
        dataConditions: state.dataConditions || [],
        eventConditions: state.eventConditions || [],
        defaultCondition: state.defaultCondition || true,
      };

      // Convert retry policy name reference to ID reference
      if (state.retryRef && retryPolicyNameToId[state.retryRef]) {
        switchData.retryRef = retryPolicyNameToId[state.retryRef];
      }

      return switchData;
    case 'event':
      return {
        events: state.onEvents || [],
        timeouts: state.timeouts || {},
      };
    case 'sleep':
      return {
        duration: state.duration || 'PT30M',
      };
    default:
      return {};
  }
}

function calculateNodePositions(states) {
  const positions = {};

  // Improved spacing configuration
  const nodeWidth = 280;
  const nodeHeight = 180;
  const horizontalSpacing = 400; // More horizontal space between nodes
  const verticalSpacing = 250;   // More vertical space between rows
  const startX = 50;
  const startY = 50;

  // Calculate better grid layout
  const totalNodes = states.length;

  // For better visual distribution, use different strategies based on node count
  if (totalNodes <= 4) {
    // Small workflows: arrange horizontally
    states.forEach((state, index) => {
      positions[state.name] = {
        x: startX + index * horizontalSpacing,
        y: startY + 100,
      };
    });
  } else if (totalNodes <= 9) {
    // Medium workflows: use a balanced grid
    const columns = Math.min(3, Math.ceil(Math.sqrt(totalNodes)));
    states.forEach((state, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      positions[state.name] = {
        x: startX + col * horizontalSpacing,
        y: startY + row * verticalSpacing,
      };
    });
  } else {
    // Large workflows: use a wider grid with more columns
    const columns = Math.min(3, Math.ceil(Math.sqrt(totalNodes * 1.2)));
    states.forEach((state, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;

      // Add some staggering for visual appeal
      const staggerOffset = (row % 2) * (horizontalSpacing * 0.3);

      positions[state.name] = {
        x: startX + col * horizontalSpacing + staggerOffset,
        y: startY + row * verticalSpacing,
      };
    });
  }

  return positions;
}

export default JsonImporter;

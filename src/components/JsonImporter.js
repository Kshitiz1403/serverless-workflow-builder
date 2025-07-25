import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import './JsonImporter.css';

// Helper function to get start state name (handles both string and object formats)  
function getStartStateName(start) {
  if (typeof start === 'string') {
    return start;
  }
  if (start && typeof start === 'object' && start.stateName) {
    return start.stateName;
  }
  return null;
}


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
  const nodePositions = calculateNodePositions(workflowData.states, workflowData);

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

  // Use the standalone getStartStateName helper function defined below

  // Create start node positioned to the left of the workflow
  const startNode = {
    id: 'start-1',
    type: 'start',
    position: { x: 20, y: 400 }, // Left side at center height
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
    const startStateName = getStartStateName(workflowData.start);
    if (startStateName) {
      const startStateNode = nodes.find((n) => n.data.name === startStateName);
      if (startStateNode) {
        edges.push({
          id: `start-to-${startStateName}`,
          source: startNode.id,
          target: startStateNode.id,
          label: `→ ${startStateName}`,
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
  }

  // Create edges for each state's transitions
  workflowData.states.forEach((state) => {
    const sourceNodeId = stateNodeMap[state.name];
    if (!sourceNodeId) return;

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
    if (state.type === 'operation' && state.onErrors && Array.isArray(state.onErrors)) {
      state.onErrors.forEach((errorHandler, index) => {
        const errorNextState = getNextState(errorHandler.transition);
        if (errorNextState) {
          const targetNodeId = stateNodeMap[errorNextState];
          if (targetNodeId) {
            edges.push({
              id: `${state.name}-error-${index}-to-${errorNextState}`,
              source: sourceNodeId,
              sourceHandle: `error-${index}`,
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
          x: sourcePosition.x + 400, // Consistent spacing to the right
          y: sourcePosition.y + 40,   // Slight offset down for visual clarity
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
  const baseData = {
    metadata: state.metadata || {},
  };

  switch (state.type) {
    case 'operation':
      const operationData = {
        ...baseData,
        actions: state.actions || [],
        onErrors: state.onErrors || [],
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
        ...baseData,
        conditionType: hasDataConditions ? 'data' : 'event',
        dataConditions: (state.dataConditions || []).map(condition => ({
          ...condition,
          metadata: condition.metadata || {},
        })),
        eventConditions: (state.eventConditions || []).map(condition => ({
          ...condition,
          metadata: condition.metadata || {},
        })),
        defaultCondition: state.defaultCondition || true,
      };

      // Add timeouts for event conditions
      if (hasEventConditions && state.timeouts) {
        switchData.timeouts = state.timeouts;
      }

      // Convert retry policy name reference to ID reference
      if (state.retryRef && retryPolicyNameToId[state.retryRef]) {
        switchData.retryRef = retryPolicyNameToId[state.retryRef];
      }

      return switchData;
    case 'event':
      return {
        ...baseData,
        events: state.onEvents || [],
        timeouts: state.timeouts || {},
      };
    case 'sleep':
      return {
        ...baseData,
        duration: state.duration || 'PT30M',
      };
    default:
      return baseData;
  }
}

function calculateNodePositions(states, workflowData = null) {
  // Use advanced layered layout algorithm inspired by Mermaid/Dagre
  return calculateLayeredLayout(states, workflowData);
}

// Tree-based hierarchical layout for maximum readability
function calculateLayeredLayout(states, workflowData = null) {
  if (!states || states.length === 0) return {};

  const config = {
    nodeWidth: 220,
    nodeHeight: 100,
    mainFlowSpacing: 800,     // Much larger spacing for main flow
    branchSpacing: 600,      // Large spacing for branches  
    verticalSpacing: 400,    // Generous vertical spacing
    startX: 300,             // More left margin
    startY: 300,             // More top margin
    errorOffset: 1000,       // Separate area for error paths
    switchBranchOffset: 500, // Offset for switch branches
  };

  try {
    // Step 1: Build directed graph with flow analysis
    const { graph, nodeTypes } = buildDirectedGraph(states, workflowData);

    // Step 2: Identify main flow path (most important path through workflow)
    const mainFlow = identifyMainFlowPath(graph, workflowData);

    // Step 3: Create tree-based layout with clear separation
    const positions = createTreeBasedLayout(graph, nodeTypes, mainFlow, config);

    return positions;

  } catch (error) {
    console.warn('Tree layout failed, using improved fallback:', error);
    return createTreeFallbackLayout(states, workflowData, config);
  }
}

// Build comprehensive directed graph representation
function buildDirectedGraph(states, workflowData) {
  const graph = {};
  const nodeTypes = {};
  const reverseGraph = {}; // For finding incoming connections

  // Initialize graph structure
  states.forEach(state => {
    graph[state.name] = {
      type: state.type,
      outgoing: [],
      incoming: [],
      branches: [],
      errors: [],
      isEnd: !!state.end
    };
    nodeTypes[state.name] = state.type;
    reverseGraph[state.name] = [];
  });

  const getNextState = (transition) => {
    if (typeof transition === 'string') return transition;
    return transition?.nextState || null;
  };

  // Build connections
  states.forEach(state => {
    const node = graph[state.name];

    // Main transitions
    if (state.transition) {
      const next = getNextState(state.transition);
      if (next && graph[next]) {
        node.outgoing.push({ target: next, type: 'main', weight: 1 });
        graph[next].incoming.push({ source: state.name, type: 'main', weight: 1 });
        reverseGraph[next].push(state.name);
      }
    }

    // Switch conditions (branches)
    if (state.type === 'switch') {
      let branchWeight = 0.8; // Slightly less weight than main transitions

      if (state.dataConditions) {
        state.dataConditions.forEach((condition, index) => {
          const next = getNextState(condition.transition);
          if (next && graph[next]) {
            const branch = {
              target: next,
              type: 'condition',
              name: condition.name || `condition-${index}`,
              weight: branchWeight
            };
            node.branches.push(branch);
            node.outgoing.push(branch);
            graph[next].incoming.push({ source: state.name, type: 'condition', weight: branchWeight });
            reverseGraph[next].push(state.name);
          }
        });
      }

      if (state.eventConditions) {
        state.eventConditions.forEach((condition, index) => {
          const next = getNextState(condition.transition);
          if (next && graph[next]) {
            const branch = {
              target: next,
              type: 'event',
              name: condition.name || `event-${index}`,
              weight: branchWeight
            };
            node.branches.push(branch);
            node.outgoing.push(branch);
            graph[next].incoming.push({ source: state.name, type: 'event', weight: branchWeight });
            reverseGraph[next].push(state.name);
          }
        });
      }

      if (state.defaultCondition?.transition) {
        const next = getNextState(state.defaultCondition.transition);
        if (next && graph[next]) {
          const branch = {
            target: next,
            type: 'default',
            name: 'default',
            weight: 0.9
          };
          node.branches.push(branch);
          node.outgoing.push(branch);
          graph[next].incoming.push({ source: state.name, type: 'default', weight: 0.9 });
          reverseGraph[next].push(state.name);
        }
      }
    }

    // Error transitions
    if (state.onErrors) {
      state.onErrors.forEach((errorHandler, index) => {
        const next = getNextState(errorHandler.transition);
        if (next && graph[next]) {
          const error = {
            target: next,
            type: 'error',
            name: errorHandler.errorRef || `error-${index}`,
            weight: 0.3
          };
          node.errors.push(error);
          node.outgoing.push(error);
          graph[next].incoming.push({ source: state.name, type: 'error', weight: 0.3 });
          reverseGraph[next].push(state.name);
        }
      });
    }
  });

  return { graph, nodeTypes, reverseGraph };
}

// Identify the main flow path through the workflow
function identifyMainFlowPath(graph, workflowData) {
  const startStateName = findStartState(Object.keys(graph), workflowData);
  if (!startStateName) return [];

  const mainPath = [];
  const visited = new Set();
  let current = startStateName;

  // Follow the main path using priority rules
  while (current && !visited.has(current)) {
    visited.add(current);
    mainPath.push(current);

    const node = graph[current];
    if (!node || node.isEnd) break;

    // Priority: 1) Direct transition, 2) Default branch, 3) First branch
    let nextNode = null;

    // Look for direct main transition first
    const mainTransition = node.outgoing.find(edge => edge.type === 'main');
    if (mainTransition) {
      nextNode = mainTransition.target;
    }
    // For switch nodes, prefer default or first branch
    else if (node.branches && node.branches.length > 0) {
      const defaultBranch = node.branches.find(b => b.type === 'default');
      const preferredBranch = defaultBranch || node.branches[0];
      nextNode = preferredBranch.target;
    }

    current = nextNode;
  }

  return mainPath;
}

// Create tree-based layout with clear visual separation
function createTreeBasedLayout(graph, nodeTypes, mainFlow, config) {
  const positions = {};
  const positioned = new Set();

  // Step 1: Position main flow vertically down the center
  mainFlow.forEach((nodeName, index) => {
    positions[nodeName] = {
      x: config.startX + config.mainFlowSpacing,
      y: config.startY + index * config.mainFlowSpacing
    };
    positioned.add(nodeName);
  });

  // Step 2: Position switch branches to the right of their parent switch nodes
  mainFlow.forEach((nodeName, index) => {
    const node = graph[nodeName];
    if (nodeTypes[nodeName] === 'switch' && node?.branches) {
      const switchPos = positions[nodeName];

      node.branches.forEach((branch, branchIndex) => {
        if (!positioned.has(branch.target)) {
          positions[branch.target] = {
            x: switchPos.x + config.switchBranchOffset + (branchIndex * 300),
            y: switchPos.y + (branchIndex - Math.floor(node.branches.length / 2)) * config.verticalSpacing
          };
          positioned.add(branch.target);

          // Position any nodes that follow this branch
          positionBranchSubtree(branch.target, graph, positions, positioned, config, switchPos.x + config.switchBranchOffset + 300);
        }
      });
    }
  });

  // Step 3: Position error handling nodes to the left
  Object.keys(graph).forEach(nodeName => {
    const node = graph[nodeName];
    if (node?.errors && node.errors.length > 0) {
      const sourcePos = positions[nodeName];
      if (sourcePos) {
        node.errors.forEach((errorTarget, errorIndex) => {
          if (!positioned.has(errorTarget)) {
            positions[errorTarget] = {
              x: config.startX - config.errorOffset,
              y: sourcePos.y + errorIndex * config.verticalSpacing
            };
            positioned.add(errorTarget);
          }
        });
      }
    }
  });

  // Step 4: Position any remaining unpositioned nodes
  const unpositioned = Object.keys(graph).filter(name => !positioned.has(name));
  unpositioned.forEach((nodeName, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    positions[nodeName] = {
      x: config.startX + config.mainFlowSpacing * 2 + col * 400,
      y: config.startY + row * config.verticalSpacing
    };
  });

  return positions;
}

// Position nodes in a branch subtree
function positionBranchSubtree(rootNode, graph, positions, positioned, config, baseX) {
  const node = graph[rootNode];
  if (!node) return;

  let currentY = positions[rootNode]?.y || config.startY;
  let depth = 0;

  // Position direct children of this branch
  node.outgoing.forEach((edge, index) => {
    if (!positioned.has(edge.target)) {
      positions[edge.target] = {
        x: baseX + depth * 400,
        y: currentY + index * config.verticalSpacing
      };
      positioned.add(edge.target);

      // Recursively position children
      positionBranchSubtree(edge.target, graph, positions, positioned, config, baseX + 400);
    }
  });
}



// Tree-based fallback layout for error cases
function createTreeFallbackLayout(states, workflowData, config) {
  const positions = {};
  const startStateName = findStartState(states.map(s => s.name), workflowData);

  // Position start state
  if (startStateName) {
    positions[startStateName] = { x: config.startX, y: config.startY };
  }

  // Group remaining states by type
  const stateGroups = {
    operation: [],
    switch: [],
    event: [],
    sleep: [],
    end: []
  };

  states.forEach(state => {
    if (state.name === startStateName) return; // Skip start state

    const type = state.end ? 'end' : state.type;
    if (stateGroups[type]) {
      stateGroups[type].push(state.name);
    } else {
      stateGroups.operation.push(state.name);
    }
  });

  // Position groups in vertical columns with massive spacing
  let currentX = config.startX + config.mainFlowSpacing;

  Object.entries(stateGroups).forEach(([groupType, group]) => {
    if (group.length === 0) return;

    group.forEach((stateName, index) => {
      positions[stateName] = {
        x: currentX,
        y: config.startY + config.mainFlowSpacing + index * config.verticalSpacing
      };
    });

    currentX += config.branchSpacing;
  });

  return positions;
}

// Find the start state
function findStartState(stateNames, workflowData) {
  // According to serverless workflow spec, start property is required
  if (workflowData?.start) {
    // Use the same helper function as used in edge creation for consistency  
    const startName = getStartStateName(workflowData.start);

    if (startName) {
      // Validate that the start state actually exists in the states array
      const startStateExists = stateNames.includes(startName);
      if (startStateExists) {
        return startName;
      } else {
        console.warn(`Start state "${startName}" not found in workflow states. Using first state as fallback.`);
      }
    }
  } else {
    console.warn('No start state defined in workflow. Using first state as fallback.');
  }

  // Fallback only if start state is not defined or invalid
  return stateNames[0];
}



export default JsonImporter;

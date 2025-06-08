import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import './JsonImporter.css';

const JsonImporter = ({ onImport, onClose }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [importMode, setImportMode] = useState('paste'); // 'paste' or 'file'
  const modalRef = useRef(null);

  const handleImport = () => {
    try {
      const workflowData = JSON.parse(jsonInput);

      // Basic validation
      if (!workflowData.states || !Array.isArray(workflowData.states)) {
        throw new Error('Invalid workflow format: missing or invalid states array');
      }

      // Convert serverless workflow to nodes and edges
      const { nodes, edges } = convertWorkflowToReactFlow(workflowData);

      onImport(nodes, edges, workflowData);
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
      states: [
        {
          name: 'assessUrgency',
          type: 'operation',
          actions: [
            {
              name: 'assess',
              functionRef: {
                refName: 'assessFunction',
                arguments: {
                  input: '${.input}',
                },
              },
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
          <h2>Import Serverless Workflow</h2>
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
            <label>Serverless Workflow JSON</label>
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
            placeholder="Paste your serverless workflow JSON here..."
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
function convertWorkflowToReactFlow(workflowData) {
  const nodes = [];
  const edges = [];
  const nodePositions = calculateNodePositions(workflowData.states);

  // Create start node
  const startNode = {
    id: 'start-1',
    type: 'start',
    position: { x: 50, y: 50 },
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
      ...convertStateToNodeData(state),
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
        type: 'smoothstep',
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

    // Handle operation and event states with simple transitions
    if ((state.type === 'operation' || state.type === 'event') && state.transition?.nextState) {
      const targetNodeId = stateNodeMap[state.transition.nextState];
      if (targetNodeId) {
        edges.push({
          id: `${state.name}-to-${state.transition.nextState}`,
          source: sourceNodeId,
          target: targetNodeId,
          label: `→ ${state.transition.nextState}`,
          type: 'smoothstep',
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
    } else if (state.type === 'switch') {
      // Handle data conditions
      if (state.dataConditions) {
        state.dataConditions.forEach((condition, index) => {
          if (condition.transition?.nextState) {
            const targetNodeId = stateNodeMap[condition.transition.nextState];
            if (targetNodeId) {
              edges.push({
                id: `${state.name}-${condition.name}-to-${condition.transition.nextState}`,
                source: sourceNodeId,
                sourceHandle: `condition-${index}`,
                target: targetNodeId,
                label: condition.name,
                type: 'smoothstep',
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
          if (condition.transition?.nextState) {
            const targetNodeId = stateNodeMap[condition.transition.nextState];
            if (targetNodeId) {
              edges.push({
                id: `${state.name}-${condition.name}-to-${condition.transition.nextState}`,
                source: sourceNodeId,
                sourceHandle: `condition-${index}`,
                target: targetNodeId,
                label: condition.name,
                type: 'smoothstep',
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
      if (state.defaultCondition?.transition?.nextState) {
        const targetNodeId = stateNodeMap[state.defaultCondition.transition.nextState];
        if (targetNodeId) {
          edges.push({
            id: `${state.name}-default-to-${state.defaultCondition.transition.nextState}`,
            source: sourceNodeId,
            sourceHandle: 'default',
            target: targetNodeId,
            label: 'default',
            type: 'smoothstep',
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
      const endNode = {
        id: endNodeId,
        type: 'end',
        position: {
          x:
            (stateNodeMap[state.name]
              ? nodes.find((n) => n.id === stateNodeMap[state.name])?.position.x
              : 0) + 300,
          y: stateNodeMap[state.name]
            ? nodes.find((n) => n.id === stateNodeMap[state.name])?.position.y
            : 0,
        },
        data: { label: 'End' },
      };
      nodes.push(endNode);

      edges.push({
        id: `${state.name}-to-end`,
        source: sourceNodeId,
        target: endNodeId,
        label: 'end',
        type: 'smoothstep',
        className: 'edge-end',
        style: { strokeWidth: 3 },
        data: { type: 'end' },
        labelStyle: { fill: '#ef4444', fontWeight: 500, fontSize: '12px' },
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

function convertStateToNodeData(state) {
  switch (state.type) {
    case 'operation':
      return {
        actions: state.actions || [],
      };
    case 'switch':
      const hasDataConditions = state.dataConditions && state.dataConditions.length > 0;
      const hasEventConditions = state.eventConditions && state.eventConditions.length > 0;

      return {
        conditionType: hasDataConditions ? 'data' : 'event',
        dataConditions: state.dataConditions || [],
        eventConditions: state.eventConditions || [],
        defaultCondition: state.defaultCondition || true,
      };
    case 'event':
      return {
        events: state.onEvents || [],
        timeouts: state.timeouts || {},
      };
    default:
      return {};
  }
}

function calculateNodePositions(states) {
  const positions = {};
  const columns = Math.ceil(Math.sqrt(states.length));

  states.forEach((state, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    positions[state.name] = {
      x: 200 + col * 300,
      y: 100 + row * 200,
    };
  });

  return positions;
}

export default JsonImporter;

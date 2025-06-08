import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import OperationNode from './nodes/OperationNode';
import SwitchNode from './nodes/SwitchNode';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import EventNode from './nodes/EventNode';
import JsonExporter from './JsonExporter';
import JsonImporter from './JsonImporter';
import './WorkflowEditor.css';

const nodeTypes = {
  operation: OperationNode,
  switch: SwitchNode,
  start: StartNode,
  end: EndNode,
  event: EventNode,
};

const STORAGE_KEY = 'serverless-workflow-editor-state';

const defaultInitialNodes = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 100, y: 100 },
    data: { label: 'Start' },
  },
];

const defaultInitialEdges = [];

// Load saved state from localStorage
function loadSavedState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return {
        nodes: parsed.nodes || defaultInitialNodes,
        edges: parsed.edges || defaultInitialEdges,
        workflowMetadata: parsed.workflowMetadata || null,
      };
    }
  } catch (error) {
    console.error('Error loading saved state:', error);
  }

  return {
    nodes: defaultInitialNodes,
    edges: defaultInitialEdges,
    workflowMetadata: null,
  };
}

function WorkflowEditor() {
  const savedState = loadSavedState();
  const [nodes, setNodes, onNodesChange] = useNodesState(savedState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(savedState.edges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showJsonExporter, setShowJsonExporter] = useState(false);
  const [showJsonImporter, setShowJsonImporter] = useState(false);
  const [workflowMetadata, setWorkflowMetadata] = useState(savedState.workflowMetadata);

  // Save state to localStorage whenever nodes or edges change
  useEffect(() => {
    const saveState = {
      nodes,
      edges,
      workflowMetadata,
      lastSaved: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveState));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }, [nodes, edges, workflowMetadata]);

  const onConnect = useCallback(
    (params) => {
      // Find the source and target nodes to get transition information
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);

      let edgeLabel = '';
      let edgeType = 'simple';
      let labelStyle = { fill: '#10b981', fontWeight: 500, fontSize: '12px' };

      if (sourceNode && sourceNode.type === 'switch' && params.sourceHandle) {
        if (params.sourceHandle === 'default') {
          edgeLabel = 'default';
          edgeType = 'default';
          labelStyle = { fill: '#6b7280', fontWeight: 500, fontSize: '12px' };
        } else if (params.sourceHandle.startsWith('condition-')) {
          const conditionIndex = parseInt(params.sourceHandle.replace('condition-', ''));
          const condition = sourceNode.data.dataConditions?.[conditionIndex];
          edgeLabel = condition?.name || `condition${conditionIndex + 1}`;
          edgeType = 'condition';
          labelStyle = { fill: '#f59e0b', fontWeight: 500, fontSize: '12px' };
        }
      } else {
        // Simple transition - add a label showing source to target
        if (targetNode?.type === 'end') {
          edgeLabel = 'end';
          edgeType = 'end';
          labelStyle = { fill: '#ef4444', fontWeight: 500, fontSize: '12px' };
        } else {
          edgeLabel = `→ ${targetNode?.data?.name || targetNode?.data?.label || 'next'}`;
          edgeType = 'simple';
        }
      }

      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}-${edgeType}`,
        label: edgeLabel,
        type: 'smoothstep',
        animated: edgeType === 'simple',
        className: `edge-${edgeType}`,
        style: { strokeWidth: edgeType === 'end' ? 3 : 2 },
        data: { type: edgeType },
        labelStyle,
        labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: 'arrowclosed',
          width: 20,
          height: 20,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, nodes]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedNodes([]);
  }, []);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    setSelectedNodes(selectedNodes);
    // If only one node is selected, also set it as the single selected node for the properties panel
    if (selectedNodes.length === 1) {
      setSelectedNodeId(selectedNodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  const addNode = useCallback(
    (type, position) => {
      const nodeId = `${type}-${Date.now()}`;
      const newNode = {
        id: nodeId,
        type,
        position,
        data: getDefaultNodeData(type),
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const updateNodeData = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
        )
      );

      // Update edge labels if this is a switch node
      const updatedNode = nodes.find((n) => n.id === nodeId);
      if (updatedNode && updatedNode.type === 'switch') {
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.source === nodeId && edge.sourceHandle) {
              let newLabel = '';
              if (edge.sourceHandle === 'default') {
                newLabel = 'default';
              } else if (edge.sourceHandle.startsWith('condition-')) {
                const conditionIndex = parseInt(edge.sourceHandle.replace('condition-', ''));
                const condition = newData.dataConditions?.[conditionIndex];
                newLabel = condition?.name || `condition${conditionIndex + 1}`;
              }
              return { ...edge, label: newLabel };
            }
            return edge;
          })
        );
      }
    },
    [setNodes, setEdges, nodes]
  );

  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNodeId(null);
    },
    [setNodes, setEdges]
  );

  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length > 0) {
      const nodeIdsToDelete = selectedNodes.map(node => node.id);
      setNodes((nds) => nds.filter((node) => !nodeIdsToDelete.includes(node.id)));
      setEdges((eds) => eds.filter((edge) =>
        !nodeIdsToDelete.includes(edge.source) && !nodeIdsToDelete.includes(edge.target)
      ));
      setSelectedNodeId(null);
      setSelectedNodes([]);
    }
  }, [selectedNodes, setNodes, setEdges]);

  // Handle keyboard events for deleting selected nodes
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodes.length > 0) {
        // Prevent deletion if we're editing text in an input field
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        event.preventDefault();
        deleteSelectedNodes();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodes, deleteSelectedNodes]);

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  const clearWorkflow = useCallback(() => {
    setNodes(defaultInitialNodes);
    setEdges(defaultInitialEdges);
    setSelectedNodeId(null);
    setSelectedNodes([]);
    setWorkflowMetadata(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [setNodes, setEdges]);

  const getSavedTimestamp = useCallback(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        return parsed.lastSaved;
      }
    } catch (error) {
      console.error('Error reading saved timestamp:', error);
    }
    return null;
  }, []);

  const handleImportWorkflow = useCallback(
    (nodes, edges, metadata) => {
      setNodes(nodes);
      setEdges(edges);
      setWorkflowMetadata(metadata);
      setSelectedNodeId(null);
      setSelectedNodes([]);
    },
    [setNodes, setEdges]
  );

  return (
    <div className="workflow-editor">
      <div className="workflow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode={null}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <Sidebar
        onAddNode={addNode}
        selectedNode={selectedNode}
        selectedNodes={selectedNodes}
        onUpdateNodeData={updateNodeData}
        onDeleteNode={deleteNode}
        onDeleteSelectedNodes={deleteSelectedNodes}
        onExportJson={() => setShowJsonExporter(true)}
        onImportJson={() => setShowJsonImporter(true)}
        onClearWorkflow={clearWorkflow}
        getSavedTimestamp={getSavedTimestamp}
      />

      {showJsonExporter && (
        <JsonExporter nodes={nodes} edges={edges} onClose={() => setShowJsonExporter(false)} />
      )}

      {showJsonImporter && (
        <JsonImporter onImport={handleImportWorkflow} onClose={() => setShowJsonImporter(false)} />
      )}
    </div>
  );
}

function getDefaultNodeData(type) {
  switch (type) {
    case 'operation':
      return {
        label: 'Operation',
        name: 'newOperation',
        actions: [
          {
            name: 'action1',
            functionRef: {
              refName: 'functionName',
              arguments: {},
            },
          },
        ],
      };
    case 'switch':
      return {
        label: 'Switch',
        name: 'newSwitch',
        conditionType: 'data', // 'data' or 'event'
        dataConditions: [
          {
            name: 'condition1',
            condition: '.data == true',
          },
        ],
        eventConditions: [],
        defaultCondition: true,
      };
    case 'event':
      return {
        label: 'Event',
        name: 'newEvent',
        events: [
          {
            eventRefs: ['example_event'],
            actions: [],
          },
        ],
        timeouts: {
          eventTimeout: 'PT30M',
        },
      };
    case 'start':
      return { label: 'Start' };
    case 'end':
      return { label: 'End' };
    default:
      return { label: type };
  }
}

export default function WorkflowEditorWrapper() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}

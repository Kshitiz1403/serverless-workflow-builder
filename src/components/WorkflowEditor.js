import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  SelectionMode,
  useReactFlow,
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
import { useHistory } from '../hooks/useHistory';
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
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef(null);
  const [reactFlowBounds, setReactFlowBounds] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // History management for undo/redo
  const {
    state: historyState,
    setState: setHistoryState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useHistory({
    nodes: savedState.nodes,
    edges: savedState.edges,
    workflowMetadata: savedState.workflowMetadata,
  });

  // Helper function to update history state
  const updateHistoryState = useCallback((newNodes, newEdges, newMetadata = workflowMetadata) => {
    setHistoryState({
      nodes: newNodes,
      edges: newEdges,
      workflowMetadata: newMetadata,
    });
  }, [setHistoryState, workflowMetadata]);

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

  // Handle undo/redo operations
  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setWorkflowMetadata(previousState.workflowMetadata);
      setSelectedNodeId(null);
      setSelectedNodes([]);
    }
  }, [undo, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setWorkflowMetadata(nextState.workflowMetadata);
      setSelectedNodeId(null);
      setSelectedNodes([]);
    }
  }, [redo, setNodes, setEdges]);

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

      setEdges((eds) => {
        const newEdges = addEdge(newEdge, eds);
        updateHistoryState(nodes, newEdges);
        return newEdges;
      });
    },
    [setEdges, nodes, updateHistoryState]
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
      setNodes((nds) => {
        const newNodes = nds.concat(newNode);
        updateHistoryState(newNodes, edges);
        return newNodes;
      });
    },
    [setNodes, edges, updateHistoryState]
  );

  const updateNodeData = useCallback(
    (nodeId, newData) => {
      setNodes((nds) => {
        const newNodes = nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
        );
        updateHistoryState(newNodes, edges);
        return newNodes;
      });

      // Update edge labels if this is a switch node
      const updatedNode = nodes.find((n) => n.id === nodeId);
      if (updatedNode && updatedNode.type === 'switch') {
        setEdges((eds) => {
          const newEdges = eds.map((edge) => {
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
          });
          // Update history with the new nodes and edges
          setHistoryState((prev) => ({
            ...prev,
            nodes: prev.nodes.map((node) =>
              node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
            ),
            edges: newEdges,
          }));
          return newEdges;
        });
      }
    },
    [setNodes, setEdges, nodes, edges, updateHistoryState, setHistoryState]
  );

  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => {
        const newNodes = nds.filter((node) => node.id !== nodeId);
        setEdges((eds) => {
          const newEdges = eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
          updateHistoryState(newNodes, newEdges);
          return newEdges;
        });
        return newNodes;
      });
      setSelectedNodeId(null);
    },
    [setNodes, setEdges, updateHistoryState]
  );

  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length > 0) {
      const nodeIdsToDelete = selectedNodes.map(node => node.id);
      setNodes((nds) => {
        const newNodes = nds.filter((node) => !nodeIdsToDelete.includes(node.id));
        setEdges((eds) => {
          const newEdges = eds.filter((edge) =>
            !nodeIdsToDelete.includes(edge.source) && !nodeIdsToDelete.includes(edge.target)
          );
          updateHistoryState(newNodes, newEdges);
          return newEdges;
        });
        return newNodes;
      });
      setSelectedNodeId(null);
      setSelectedNodes([]);
    }
  }, [selectedNodes, setNodes, setEdges, updateHistoryState]);

  // Handle keyboard events for deleting selected nodes and undo/redo
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent actions if we're editing text in an input field
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodes.length > 0) {
        event.preventDefault();
        deleteSelectedNodes();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodes, deleteSelectedNodes, handleUndo, handleRedo]);

  // Handle 2-finger trackpad panning
  useEffect(() => {
    const reactFlowElement = reactFlowWrapper.current;
    if (!reactFlowElement || !reactFlowInstance) return;

    let isPanning = false;
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (event) => {
      // Only handle 2-finger touches for panning
      if (event.touches.length === 2) {
        isPanning = true;
        event.preventDefault();

        // Calculate center point between two fingers
        const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

        startX = centerX;
        startY = centerY;
      }
    };

    const handleTouchMove = (event) => {
      if (isPanning && event.touches.length === 2) {
        event.preventDefault();

        // Calculate center point between two fingers
        const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

        const deltaX = centerX - startX;
        const deltaY = centerY - startY;

        // Get current viewport
        const viewport = reactFlowInstance.getViewport();

        // Apply panning
        reactFlowInstance.setViewport({
          x: viewport.x + deltaX,
          y: viewport.y + deltaY,
          zoom: viewport.zoom,
        });

        startX = centerX;
        startY = centerY;
      }
    };

    const handleTouchEnd = (event) => {
      if (event.touches.length < 2) {
        isPanning = false;
      }
    };

    // Handle trackpad gestures (wheel events with ctrlKey indicate pinch/pan on trackpad)
    const handleWheel = (event) => {
      // On Mac trackpads, 2-finger scrolling triggers wheel events
      // We want to allow natural 2-finger panning behavior
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
        // This is likely a 2-finger scroll gesture on trackpad
        const viewport = reactFlowInstance.getViewport();

        // Apply panning with inverted delta for natural feel
        reactFlowInstance.setViewport({
          x: viewport.x - event.deltaX,
          y: viewport.y - event.deltaY,
          zoom: viewport.zoom,
        });

        event.preventDefault();
      }
    };

    // Add event listeners
    reactFlowElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    reactFlowElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    reactFlowElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    reactFlowElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      // Cleanup event listeners
      reactFlowElement.removeEventListener('touchstart', handleTouchStart);
      reactFlowElement.removeEventListener('touchmove', handleTouchMove);
      reactFlowElement.removeEventListener('touchend', handleTouchEnd);
      reactFlowElement.removeEventListener('wheel', handleWheel);
    };
  }, [reactFlowInstance]);

  // Handle drag and drop functionality
  useEffect(() => {
    const reactFlowElement = reactFlowWrapper.current;
    if (!reactFlowElement || !reactFlowInstance) return;

    // Update bounds when ReactFlow instance changes
    setReactFlowBounds(reactFlowElement.getBoundingClientRect());

    const handleDragOver = (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (event) => {
      event.preventDefault();
      setIsDragOver(false);

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      // Update bounds to get current position
      const bounds = reactFlowElement.getBoundingClientRect();

      // Calculate position relative to ReactFlow canvas
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      // Create new node
      const newNode = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: getDefaultNodeData(nodeType),
      };

      setNodes((nds) => {
        const newNodes = nds.concat(newNode);
        updateHistoryState(newNodes, edges);
        return newNodes;
      });
    };

    const handleDragEnter = (event) => {
      event.preventDefault();
      // Check if the drag contains our expected data type
      if (event.dataTransfer.types.includes('application/reactflow')) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (event) => {
      event.preventDefault();
      // Only set drag over to false if we're leaving the entire ReactFlow area
      if (!reactFlowElement.contains(event.relatedTarget)) {
        setIsDragOver(false);
      }
    };

    // Add drag and drop event listeners
    reactFlowElement.addEventListener('dragover', handleDragOver);
    reactFlowElement.addEventListener('drop', handleDrop);
    reactFlowElement.addEventListener('dragenter', handleDragEnter);
    reactFlowElement.addEventListener('dragleave', handleDragLeave);

    return () => {
      // Cleanup event listeners
      reactFlowElement.removeEventListener('dragover', handleDragOver);
      reactFlowElement.removeEventListener('drop', handleDrop);
      reactFlowElement.removeEventListener('dragenter', handleDragEnter);
      reactFlowElement.removeEventListener('dragleave', handleDragLeave);
    };
  }, [reactFlowInstance, setNodes, edges, updateHistoryState]);

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  const clearWorkflow = useCallback(() => {
    setNodes(defaultInitialNodes);
    setEdges(defaultInitialEdges);
    setSelectedNodeId(null);
    setSelectedNodes([]);
    setWorkflowMetadata(null);
    resetHistory({
      nodes: defaultInitialNodes,
      edges: defaultInitialEdges,
      workflowMetadata: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  }, [setNodes, setEdges, resetHistory]);

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
      resetHistory({
        nodes,
        edges,
        workflowMetadata: metadata,
      });
    },
    [setNodes, setEdges, resetHistory]
  );

  return (
    <div className="workflow-editor">
      <div className={`workflow-canvas ${isDragOver ? 'drag-over' : ''}`} ref={reactFlowWrapper}>
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
          panOnDrag={true}
          panOnScroll={false}
          preventScrolling={false}
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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        workflowMetadata={workflowMetadata}
        onUpdateWorkflowMetadata={setWorkflowMetadata}
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
        retryRef: '', // Reference to retry policy
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
      return {};
    case 'end':
      return {};
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

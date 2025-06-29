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
import SleepNode from './nodes/SleepNode';
import JsonExporter from './JsonExporter';
import JsonImporter from './JsonImporter';
import ProjectManager, { ProjectStorage } from './ProjectManager';
import ProjectSidebar from './ProjectSidebar';
import { useHistory } from '../hooks/useHistory';
import { useProjectMigration } from '../hooks/useProjectMigration';
import './WorkflowEditor.css';

const nodeTypes = {
  operation: OperationNode,
  switch: SwitchNode,
  start: StartNode,
  end: EndNode,
  event: EventNode,
  sleep: SleepNode,
};

const defaultInitialNodes = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 100, y: 100 },
    data: { label: 'Start' },
  },
];

const defaultInitialEdges = [];

// Load project state from localStorage
function loadProjectState(projectId) {
  if (!projectId) {
    return {
      nodes: defaultInitialNodes,
      edges: defaultInitialEdges,
      workflowMetadata: null,
    };
  }

  const projectData = ProjectStorage.getProjectData(projectId);
  if (projectData) {
    return {
      nodes: projectData.nodes || defaultInitialNodes,
      edges: projectData.edges || defaultInitialEdges,
      workflowMetadata: projectData.workflowMetadata || null,
    };
  }

  return {
    nodes: defaultInitialNodes,
    edges: defaultInitialEdges,
    workflowMetadata: null,
  };
}

function WorkflowEditor() {
  // Run migration hook
  useProjectMigration();

  // Project management state
  const [currentProjectId, setCurrentProjectId] = useState(ProjectStorage.getCurrentProjectId());
  const [currentProject, setCurrentProject] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [isProjectSidebarCollapsed, setIsProjectSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('project-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Load initial project state
  const initialState = loadProjectState(currentProjectId);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialState.edges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showJsonExporter, setShowJsonExporter] = useState(false);
  const [showJsonImporter, setShowJsonImporter] = useState(false);
  const [workflowMetadata, setWorkflowMetadata] = useState(initialState.workflowMetadata);
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
    nodes: initialState.nodes,
    edges: initialState.edges,
    workflowMetadata: initialState.workflowMetadata,
  });

  // Load current project info
  useEffect(() => {
    if (currentProjectId) {
      const projects = ProjectStorage.getAllProjects();
      const project = projects.find(p => p.id === currentProjectId);
      setCurrentProject(project || null);
    } else {
      setCurrentProject(null);
    }
  }, [currentProjectId]);

  // Auto-select first project if none selected
  useEffect(() => {
    if (!currentProjectId && !showProjectManager) {
      const projects = ProjectStorage.getAllProjects();
      if (projects.length > 0) {
        const firstProject = projects[0];
        const projectState = loadProjectState(firstProject.id);
        setNodes(projectState.nodes);
        setEdges(projectState.edges);
        setWorkflowMetadata(projectState.workflowMetadata);
        setCurrentProjectId(firstProject.id);
        ProjectStorage.setCurrentProjectId(firstProject.id);
        resetHistory({
          nodes: projectState.nodes,
          edges: projectState.edges,
          workflowMetadata: projectState.workflowMetadata,
        });
      }
    }
  }, [currentProjectId, showProjectManager, setNodes, setEdges, resetHistory]);

  // Helper function to update history state
  const updateHistoryState = useCallback((newNodes, newEdges, newMetadata = workflowMetadata) => {
    setHistoryState({
      nodes: newNodes,
      edges: newEdges,
      workflowMetadata: newMetadata,
    });
  }, [setHistoryState, workflowMetadata]);

  // Mark changes as unsaved when data changes
  useEffect(() => {
    if (currentProjectId) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges, workflowMetadata, currentProjectId]);

  // Auto-save project state periodically
  useEffect(() => {
    if (!currentProjectId || !hasUnsavedChanges) return;

    const autoSaveInterval = setInterval(() => {
      saveCurrentProject();
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentProjectId, hasUnsavedChanges, nodes, edges, workflowMetadata]);

  // Project management functions
  const saveCurrentProject = useCallback(() => {
    if (!currentProjectId) return;

    const saveData = {
      nodes,
      edges,
      workflowMetadata,
      lastSaved: new Date().toISOString(),
    };

    try {
      ProjectStorage.saveProjectData(currentProjectId, saveData);
      setHasUnsavedChanges(false);

      // Update project's lastModified timestamp
      ProjectStorage.updateProject(currentProjectId, {});
    } catch (error) {
      console.error('Error saving project:', error);
    }
  }, [currentProjectId, nodes, edges, workflowMetadata]);

  const handleProjectSwitch = useCallback((projectId) => {
    // Save current project before switching
    if (currentProjectId && hasUnsavedChanges) {
      saveCurrentProject();
    }

    // Load new project
    const projectState = loadProjectState(projectId);
    setNodes(projectState.nodes);
    setEdges(projectState.edges);
    setWorkflowMetadata(projectState.workflowMetadata);
    setCurrentProjectId(projectId);
    setSelectedNodeId(null);
    setSelectedNodes([]);
    setHasUnsavedChanges(false);

    // Update current project tracker
    ProjectStorage.setCurrentProjectId(projectId);

    // Reset history
    resetHistory({
      nodes: projectState.nodes,
      edges: projectState.edges,
      workflowMetadata: projectState.workflowMetadata,
    });
  }, [currentProjectId, hasUnsavedChanges, saveCurrentProject, setNodes, setEdges, resetHistory]);

  const handleToggleProjectSidebar = useCallback(() => {
    const newCollapsed = !isProjectSidebarCollapsed;
    setIsProjectSidebarCollapsed(newCollapsed);
    localStorage.setItem('project-sidebar-collapsed', JSON.stringify(newCollapsed));
  }, [isProjectSidebarCollapsed]);

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
      } else if (sourceNode && sourceNode.type === 'operation' && params.sourceHandle && params.sourceHandle.startsWith('error-')) {
        const errorIndex = parseInt(params.sourceHandle.replace('error-', ''));
        const errorHandler = sourceNode.data.onErrors?.[errorIndex];
        edgeLabel = `⚠ ${errorHandler?.errorRef || 'error'}`;
        edgeType = 'error';
        labelStyle = { fill: 'rgba(239, 68, 68, 0.6)', fontWeight: 500, fontSize: '12px' };
      } else {
        // Simple transition - add a label showing source to target
        if (targetNode?.type === 'end') {
          edgeLabel = 'end';
          edgeType = 'end';
          labelStyle = { fill: 'rgba(239, 68, 68, 0.8)', fontWeight: 500, fontSize: '12px' };
        } else {
          edgeLabel = `→ ${targetNode?.data?.name || targetNode?.data?.label || 'next'}`;
          edgeType = 'simple';
        }
      }

      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}-${edgeType}`,
        label: edgeLabel,
        type: 'default',
        animated: edgeType === 'simple',
        className: `edge-${edgeType}`,
        style: edgeType === 'error'
          ? { strokeWidth: 2, strokeDasharray: '5,5', stroke: 'rgba(239, 68, 68, 0.4)' }
          : { strokeWidth: edgeType === 'end' ? 3 : 2 },
        data: { type: edgeType },
        labelStyle,
        labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: 'arrowclosed',
          width: 20,
          height: 20,
          color: edgeType === 'error' ? 'rgba(239, 68, 68, 0.4)' : undefined,
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
    (type, position, operationData = null) => {
      const nodeId = `${type}-${Date.now()}`;
      const newNode = {
        id: nodeId,
        type,
        position,
        data: getDefaultNodeData(type, operationData),
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

  // Handle keyboard events for deleting selected nodes, undo/redo, and save
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
      } else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (currentProjectId && hasUnsavedChanges) {
          saveCurrentProject();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodes, deleteSelectedNodes, handleUndo, handleRedo, currentProjectId, hasUnsavedChanges, saveCurrentProject]);

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

      const dragData = event.dataTransfer.getData('application/reactflow');
      if (!dragData) return;

      // Parse drag data - could be just a string (node type) or JSON (operation data)
      let nodeType, operationData;
      try {
        const parsedData = JSON.parse(dragData);
        nodeType = parsedData.type;
        operationData = parsedData.operationData;
      } catch {
        // It's a simple string node type
        nodeType = dragData;
        operationData = null;
      }

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
        data: getDefaultNodeData(nodeType, operationData),
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
    if (currentProjectId) {
      setNodes(defaultInitialNodes);
      setEdges(defaultInitialEdges);
      setSelectedNodeId(null);
      setSelectedNodes([]);
      setWorkflowMetadata({
        name: currentProject?.name || 'New Workflow',
        description: currentProject?.description || 'A new serverless workflow',
        version: '1.0.0',
      });
      setHasUnsavedChanges(true);
      resetHistory({
        nodes: defaultInitialNodes,
        edges: defaultInitialEdges,
        workflowMetadata: {
          name: currentProject?.name || 'New Workflow',
          description: currentProject?.description || 'A new serverless workflow',
          version: '1.0.0',
        },
      });
    } else {
      // No project selected, show project manager
      setShowProjectManager(true);
    }
  }, [currentProjectId, currentProject, setNodes, setEdges, resetHistory]);

  const getSavedTimestamp = useCallback(() => {
    if (!currentProjectId) return null;

    try {
      const projectData = ProjectStorage.getProjectData(currentProjectId);
      return projectData?.lastSaved || null;
    } catch (error) {
      console.error('Error reading saved timestamp:', error);
    }
    return null;
  }, [currentProjectId]);

  const handleImportWorkflow = useCallback(
    (nodes, edges, metadata) => {
      setNodes(nodes);
      setEdges(edges);
      setWorkflowMetadata(metadata);
      setSelectedNodeId(null);
      setSelectedNodes([]);
      if (currentProjectId) {
        setHasUnsavedChanges(true);
      }
      resetHistory({
        nodes,
        edges,
        workflowMetadata: metadata,
      });
    },
    [setNodes, setEdges, resetHistory, currentProjectId]
  );

  return (
    <div className="workflow-editor">
      <ProjectSidebar
        currentProject={currentProject}
        onProjectSwitch={handleProjectSwitch}
        onProjectSave={saveCurrentProject}
        hasUnsavedChanges={hasUnsavedChanges}
        isCollapsed={isProjectSidebarCollapsed}
        onToggleCollapse={handleToggleProjectSidebar}
      />

      <div className={`workflow-canvas ${isDragOver ? 'drag-over' : ''} ${isProjectSidebarCollapsed ? 'sidebar-collapsed' : ''}`} ref={reactFlowWrapper}>
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
          minZoom={0.1}
          maxZoom={4}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap
            maskColor="rgba(79, 70, 229, 0.08)"
            position="bottom-right"
            zoomable={true}
            pannable={true}
          />
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
        onSaveProject={saveCurrentProject}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {showProjectManager && (
        <div className="project-manager-overlay">
          <div className="project-manager-modal">
            <ProjectManager
              currentProject={currentProject}
              onProjectSwitch={handleProjectSwitch}
              onProjectSave={saveCurrentProject}
              hasUnsavedChanges={hasUnsavedChanges}
            />
            <button
              className="close-project-manager"
              onClick={() => setShowProjectManager(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showJsonExporter && (
        <JsonExporter
          nodes={nodes}
          edges={edges}
          workflowMetadata={workflowMetadata}
          onClose={() => setShowJsonExporter(false)}
        />
      )}

      {showJsonImporter && (
        <JsonImporter onImport={handleImportWorkflow} onClose={() => setShowJsonImporter(false)} />
      )}
    </div>
  );
}

function getDefaultNodeData(type, operationData = null) {
  const baseData = {
    metadata: {},
  };

  switch (type) {
    case 'operation':
      // If operation data is provided (from API), use it as template
      if (operationData && operationData.template) {
        const template = operationData.template;
        return {
          ...baseData,
          label: operationData.name || 'Operation',
          name: operationData.name?.toLowerCase().replace(/\s+/g, '_') || 'newOperation',
          actions: template.actions || [
            {
              name: 'action1',
              functionRef: {
                refName: 'functionName',
                arguments: {},
              },
            },
          ],
          onErrors: operationData.errorHandling || [],
          operationId: operationData.id, // Keep reference to the original operation
          operationMetadata: {
            description: operationData.description,
            category: operationData.category,
            tags: operationData.tags,
            version: operationData.version,
          },
          // Include default parameters from template if any
          parameters: template.parameters ?
            template.parameters.reduce((acc, param) => {
              acc[param.name] = param.default !== undefined ? param.default : '';
              return acc;
            }, {}) : {},
          // Include state data filter if provided
          stateDataFilter: template.stateDataFilter || undefined,
        };
      }

      // Default operation node data
      return {
        ...baseData,
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
        onErrors: [],
      };
    case 'switch':
      return {
        ...baseData,
        label: 'Switch',
        name: 'newSwitch',
        conditionType: 'data', // 'data' or 'event'
        dataConditions: [
          {
            name: 'condition1',
            condition: '.data == true',
            metadata: {},
          },
        ],
        eventConditions: [],
        defaultCondition: true,
      };
    case 'event':
      return {
        ...baseData,
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
    case 'sleep':
      return {
        ...baseData,
        label: 'Sleep',
        name: 'newSleep',
        duration: 'PT30M', // ISO 8601 duration format (30 minutes)
      };
    case 'start':
      return {};
    case 'end':
      return {};
    default:
      return { ...baseData, label: type };
  }
}

export default function WorkflowEditorWrapper() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}

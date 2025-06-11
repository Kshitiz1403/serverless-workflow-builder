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

  // Function to clean up orphaned edges that reference non-existent handles
  const cleanupOrphanedEdges = useCallback((nodes, edges) => {
    console.log(`Checking ${edges.length} edges for orphaned handles...`);

    return edges.filter(edge => {
      // Find the source node
      const sourceNode = nodes.find(node => node.id === edge.source);
      if (!sourceNode) {
        console.warn(`Removing orphaned edge: source node "${edge.source}" not found`);
        return false;
      }

      // If the edge has a sourceHandle, check if it exists on the node
      if (edge.sourceHandle) {
        // For operation nodes with error handlers
        if (sourceNode.type === 'operation') {
          if (!sourceNode.data.onErrors || !Array.isArray(sourceNode.data.onErrors)) {
            console.warn(`Removing orphaned edge: operation node "${sourceNode.id}" has no error handlers but edge references handle "${edge.sourceHandle}"`);
            return false;
          }

          const hasErrorHandle = sourceNode.data.onErrors.some(errorHandler => errorHandler.id === edge.sourceHandle);
          if (!hasErrorHandle) {
            console.warn(`Removing orphaned edge: operation node "${sourceNode.id}" has no error handler with ID "${edge.sourceHandle}"`);
            return false;
          }
        }
        // For switch nodes with condition handles
        else if (sourceNode.type === 'switch') {
          if (edge.sourceHandle === 'default') {
            return true; // Default handle should always exist
          } else if (edge.sourceHandle.startsWith('condition-')) {
            const conditionIndex = parseInt(edge.sourceHandle.replace('condition-', ''));
            const conditionType = sourceNode.data.conditionType || 'data';
            const conditions = conditionType === 'data' ? sourceNode.data.dataConditions : sourceNode.data.eventConditions;
            if (!conditions || conditionIndex >= conditions.length) {
              console.warn(`Removing orphaned edge: switch node "${sourceNode.id}" has no condition at index ${conditionIndex}`);
              return false;
            }
          } else {
            console.warn(`Removing orphaned edge: unknown source handle "${edge.sourceHandle}" on switch node "${sourceNode.id}"`);
            return false;
          }
        }
        // For other node types with handles that shouldn't exist
        else {
          console.warn(`Removing orphaned edge: node type "${sourceNode.type}" should not have source handle "${edge.sourceHandle}"`);
          return false;
        }
      }

      return true;
    });
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(() => {
    // Clean up orphaned edges on initial load
    const cleanedEdges = cleanupOrphanedEdges(initialState.nodes, initialState.edges);
    if (cleanedEdges.length !== initialState.edges.length) {
      console.log(`Cleaned up ${initialState.edges.length - cleanedEdges.length} orphaned edges`);
    }
    return cleanedEdges;
  });
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

        // Clean up orphaned edges in the loaded project
        const cleanedEdges = cleanupOrphanedEdges(projectState.nodes, projectState.edges);
        if (cleanedEdges.length !== projectState.edges.length) {
          console.log(`Cleaned up ${projectState.edges.length - cleanedEdges.length} orphaned edges in auto-selected project ${firstProject.id}`);
        }

        setNodes(projectState.nodes);
        setEdges(cleanedEdges);
        setWorkflowMetadata(projectState.workflowMetadata);
        setCurrentProjectId(firstProject.id);
        ProjectStorage.setCurrentProjectId(firstProject.id);
        resetHistory({
          nodes: projectState.nodes,
          edges: cleanedEdges,
          workflowMetadata: projectState.workflowMetadata,
        });
      }
    }
  }, [currentProjectId, showProjectManager, setNodes, setEdges, resetHistory, cleanupOrphanedEdges]);

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
    }, 30000); // Auto-save every 30 seconds

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

    // Clean up orphaned edges in the loaded project
    const cleanedEdges = cleanupOrphanedEdges(projectState.nodes, projectState.edges);
    if (cleanedEdges.length !== projectState.edges.length) {
      console.log(`Cleaned up ${projectState.edges.length - cleanedEdges.length} orphaned edges in project ${projectId}`);
    }

    setNodes(projectState.nodes);
    setEdges(cleanedEdges);
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
      edges: cleanedEdges,
      workflowMetadata: projectState.workflowMetadata,
    });
  }, [currentProjectId, hasUnsavedChanges, saveCurrentProject, setNodes, setEdges, resetHistory, cleanupOrphanedEdges]);

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

      // Validate that the source handle exists if specified
      if (params.sourceHandle) {
        if (sourceNode?.type === 'operation') {
          // For operation nodes, validate error handles
          const hasValidErrorHandle = sourceNode.data.onErrors?.some(eh => eh.id === params.sourceHandle);
          if (!hasValidErrorHandle) {
            console.warn(`Cannot create edge: Invalid error handle "${params.sourceHandle}" on operation node "${sourceNode.id}"`);
            return;
          }
        } else if (sourceNode?.type === 'switch') {
          // For switch nodes, validate condition handles
          if (params.sourceHandle !== 'default' && params.sourceHandle.startsWith('condition-')) {
            const conditionIndex = parseInt(params.sourceHandle.replace('condition-', ''));
            const conditionType = sourceNode.data.conditionType || 'data';
            const conditions = conditionType === 'data' ? sourceNode.data.dataConditions : sourceNode.data.eventConditions;
            if (!conditions || conditionIndex >= conditions.length) {
              console.warn(`Cannot create edge: Invalid condition handle "${params.sourceHandle}" on switch node "${sourceNode.id}"`);
              return;
            }
          }
        }
      }

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
      } else if (sourceNode && sourceNode.type === 'operation' && params.sourceHandle && sourceNode.data.onErrors?.some(eh => eh.id === params.sourceHandle)) {
        // ID-based error handle
        const errorHandler = sourceNode.data.onErrors?.find(eh => eh.id === params.sourceHandle);
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

      console.log(`Creating edge: ${newEdge.id} with sourceHandle: ${params.sourceHandle}`);

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

        // Find the updated node for further processing
        const updatedNode = newNodes.find((n) => n.id === nodeId);

        // Update edge labels if this is a switch node
        if (updatedNode && updatedNode.type === 'switch') {
          setEdges((eds) => {
            const newEdges = eds.map((edge) => {
              if (edge.source === nodeId && edge.sourceHandle) {
                let newLabel = '';
                if (edge.sourceHandle === 'default') {
                  newLabel = 'default';
                } else if (edge.sourceHandle.startsWith('condition-')) {
                  const conditionIndex = parseInt(edge.sourceHandle.replace('condition-', ''));
                  const condition = updatedNode.data.dataConditions?.[conditionIndex];
                  newLabel = condition?.name || `condition${conditionIndex + 1}`;
                }
                return { ...edge, label: newLabel };
              }
              return edge;
            });
            // Update history with the new nodes and edges
            setHistoryState((prev) => ({
              ...prev,
              nodes: newNodes,
              edges: newEdges,
            }));
            return newEdges;
          });
        } else {
          // For non-switch nodes, just update history with the new nodes
          updateHistoryState(newNodes, edges);
        }

        return newNodes;
      });
    },
    [setNodes, setEdges, edges, updateHistoryState, setHistoryState]
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
      // Clean up orphaned edges in the imported workflow
      const cleanedEdges = cleanupOrphanedEdges(nodes, edges);
      if (cleanedEdges.length !== edges.length) {
        console.log(`Cleaned up ${edges.length - cleanedEdges.length} orphaned edges in imported workflow`);
      }

      setNodes(nodes);
      setEdges(cleanedEdges);
      setWorkflowMetadata(metadata);
      setSelectedNodeId(null);
      setSelectedNodes([]);
      if (currentProjectId) {
        setHasUnsavedChanges(true);
      }
      resetHistory({
        nodes,
        edges: cleanedEdges,
        workflowMetadata: metadata,
      });
    },
    [setNodes, setEdges, resetHistory, currentProjectId, cleanupOrphanedEdges]
  );

  // Continuous validation of edges to prevent orphaned edge errors
  useEffect(() => {
    if (nodes.length === 0 || edges.length === 0) return;

    const validEdges = cleanupOrphanedEdges(nodes, edges);
    if (validEdges.length !== edges.length) {
      console.log(`Found and cleaning up ${edges.length - validEdges.length} orphaned edges during runtime`);
      setEdges(validEdges);
    }
  }, [nodes, edges, cleanupOrphanedEdges, setEdges]);

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
        nodes={nodes}
        edges={edges}
        onCleanupEdges={(nodeId, removedHandleIds) => {
          setEdges((eds) => {
            const newEdges = eds.filter((edge) => {
              // Remove edges that reference the removed error handler handles
              if (edge.source === nodeId && removedHandleIds.includes(edge.sourceHandle)) {
                return false;
              }
              return true;
            });
            updateHistoryState(nodes, newEdges);
            return newEdges;
          });
        }}
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
        onErrors: [], // Error handlers will get IDs when added
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
    case 'sleep':
      return {
        label: 'Sleep',
        name: 'newSleep',
        duration: 'PT30M', // ISO 8601 duration format (30 minutes)
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

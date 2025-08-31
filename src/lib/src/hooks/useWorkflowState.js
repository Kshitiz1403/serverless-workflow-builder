import { useState, useCallback, useRef, useEffect } from 'react';
import { useReactFlow } from 'reactflow';

/**
 * Hook for tracking workflow state and React Flow configuration
 * Provides access to current workflow data and change tracking
 */
export function useWorkflowState(initialNodes = [], initialEdges = [], initialMetadata = {}) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [workflowMetadata, setWorkflowMetadata] = useState(initialMetadata);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(Date.now());
  
  const reactFlowInstance = useReactFlow();
  const changeListenersRef = useRef(new Set());
  const initialStateRef = useRef({ nodes: initialNodes, edges: initialEdges, metadata: initialMetadata });

  // Track changes by comparing current state with initial state
  useEffect(() => {
    const hasNodeChanges = JSON.stringify(nodes) !== JSON.stringify(initialStateRef.current.nodes);
    const hasEdgeChanges = JSON.stringify(edges) !== JSON.stringify(initialStateRef.current.edges);
    const hasMetadataChanges = JSON.stringify(workflowMetadata) !== JSON.stringify(initialStateRef.current.metadata);
    
    const newHasChanges = hasNodeChanges || hasEdgeChanges || hasMetadataChanges;
    
    if (newHasChanges !== hasChanges) {
      setHasChanges(newHasChanges);
      setLastUpdateTimestamp(Date.now());
      
      // Notify change listeners
      changeListenersRef.current.forEach(listener => {
        listener({
          nodes,
          edges,
          workflowMetadata,
          hasChanges: newHasChanges,
          timestamp: Date.now()
        });
      });
    }
  }, [nodes, edges, workflowMetadata, hasChanges]);

  // Update nodes with change tracking
  const updateNodes = useCallback((newNodes) => {
    setNodes(newNodes);
  }, []);

  // Update edges with change tracking
  const updateEdges = useCallback((newEdges) => {
    setEdges(newEdges);
  }, []);

  // Update workflow metadata with change tracking
  const updateWorkflowMetadata = useCallback((newMetadata) => {
    setWorkflowMetadata(newMetadata);
  }, []);

  // Reset to initial state
  const resetToInitialState = useCallback(() => {
    setNodes(initialStateRef.current.nodes);
    setEdges(initialStateRef.current.edges);
    setWorkflowMetadata(initialStateRef.current.metadata);
    setHasChanges(false);
  }, []);

  // Update initial state (useful when saving)
  const markAsSaved = useCallback(() => {
    initialStateRef.current = { nodes, edges, metadata: workflowMetadata };
    setHasChanges(false);
  }, [nodes, edges, workflowMetadata]);

  // Subscribe to workflow changes
  const subscribeToChanges = useCallback((listener) => {
    changeListenersRef.current.add(listener);
    
    // Return unsubscribe function
    return () => {
      changeListenersRef.current.delete(listener);
    };
  }, []);

  // Get current React Flow instance configuration
  const getReactFlowConfig = useCallback(() => {
    if (!reactFlowInstance) return null;
    
    return {
      viewport: reactFlowInstance.getViewport(),
      nodes: reactFlowInstance.getNodes(),
      edges: reactFlowInstance.getEdges(),
      bounds: reactFlowInstance.getNodesBounds(),
    };
  }, [reactFlowInstance]);

  // Fit view to all nodes
  const fitView = useCallback((options = {}) => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView(options);
    }
  }, [reactFlowInstance]);

  // Center view on specific node
  const centerOnNode = useCallback((nodeId, options = {}) => {
    if (reactFlowInstance) {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        reactFlowInstance.setCenter(node.position.x, node.position.y, options);
      }
    }
  }, [reactFlowInstance, nodes]);

  // Get workflow statistics
  const getWorkflowStats = useCallback(() => {
    const nodeTypes = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodeTypes,
      hasStartNode: nodes.some(n => n.type === 'start'),
      hasEndNode: nodes.some(n => n.type === 'end'),
      lastUpdate: lastUpdateTimestamp,
    };
  }, [nodes, edges, lastUpdateTimestamp]);

  // Export current React Flow layout as JSON
  const exportLayout = useCallback(() => {
    const layout = {
      version: '1.0',
      type: 'react-flow-layout',
      timestamp: new Date().toISOString(),
      metadata: {
        name: workflowMetadata.name || 'Untitled Workflow',
        description: workflowMetadata.description || '',
        version: workflowMetadata.version || '1.0',
        ...workflowMetadata
      },
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        // Include any other React Flow specific properties
        ...(node.style && { style: node.style }),
        ...(node.className && { className: node.className }),
        ...(node.hidden !== undefined && { hidden: node.hidden }),
        ...(node.selected !== undefined && { selected: node.selected }),
        ...(node.dragging !== undefined && { dragging: node.dragging })
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        ...(edge.label && { label: edge.label }),
        ...(edge.style && { style: edge.style }),
        ...(edge.className && { className: edge.className }),
        ...(edge.hidden !== undefined && { hidden: edge.hidden }),
        ...(edge.selected !== undefined && { selected: edge.selected }),
        ...(edge.data && { data: edge.data }),
        ...(edge.sourceHandle && { sourceHandle: edge.sourceHandle }),
        ...(edge.targetHandle && { targetHandle: edge.targetHandle })
      }))
    };

    return layout;
  }, [nodes, edges, workflowMetadata]);

  // Export layout as JSON string
  const exportLayoutAsString = useCallback((pretty = true) => {
    const layout = exportLayout();
    return JSON.stringify(layout, null, pretty ? 2 : 0);
  }, [exportLayout]);

  // Download layout as JSON file
  const downloadLayout = useCallback((filename) => {
    const layout = exportLayout();
    const jsonString = JSON.stringify(layout, null, 2);
    
    const defaultFilename = (workflowMetadata.name || 'workflow')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename || defaultFilename}-layout.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportLayout, workflowMetadata.name]);

  // Import layout from JSON data
  const importLayout = useCallback((layoutData) => {
    try {
      let layout;
      
      if (typeof layoutData === 'string') {
        layout = JSON.parse(layoutData);
      } else {
        layout = layoutData;
      }

      // Validate layout structure
      if (!layout || typeof layout !== 'object') {
        throw new Error('Invalid layout data: must be an object');
      }

      if (!Array.isArray(layout.nodes)) {
        throw new Error('Invalid layout data: nodes must be an array');
      }

      if (!Array.isArray(layout.edges)) {
        throw new Error('Invalid layout data: edges must be an array');
      }

      // Validate node structure
      layout.nodes.forEach((node, index) => {
        if (!node.id || !node.type) {
          throw new Error(`Invalid node at index ${index}: must have id and type`);
        }
        if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
          throw new Error(`Invalid node at index ${index}: must have valid position with x and y coordinates`);
        }
      });

      // Validate edge structure
      layout.edges.forEach((edge, index) => {
        if (!edge.id || !edge.source || !edge.target) {
          throw new Error(`Invalid edge at index ${index}: must have id, source, and target`);
        }
      });

      // Update state with imported layout
      setNodes(layout.nodes);
      setEdges(layout.edges);
      if (layout.metadata) {
        setWorkflowMetadata(layout.metadata);
      }

      return {
        nodes: layout.nodes,
        edges: layout.edges,
        metadata: layout.metadata || {},
        layoutInfo: {
          version: layout.version,
          type: layout.type,
          timestamp: layout.timestamp
        }
      };
    } catch (error) {
      console.error('Error importing layout:', error);
      throw new Error(`Failed to import layout: ${error.message}`);
    }
  }, []);

  // Copy layout to clipboard
  const copyLayoutToClipboard = useCallback(async () => {
    try {
      const layoutString = exportLayoutAsString();
      await navigator.clipboard.writeText(layoutString);
      return true;
    } catch (error) {
      console.error('Failed to copy layout to clipboard:', error);
      throw error;
    }
  }, [exportLayoutAsString]);

  return {
    // Current state
    nodes,
    edges,
    workflowMetadata,
    hasChanges,
    lastUpdateTimestamp,
    
    // State updaters
    updateNodes,
    updateEdges,
    updateWorkflowMetadata,
    
    // State management
    resetToInitialState,
    markAsSaved,
    
    // Change tracking
    subscribeToChanges,
    
    // React Flow utilities
    getReactFlowConfig,
    fitView,
    centerOnNode,
    
    // Workflow utilities
    getWorkflowStats,
    
    // Layout management
    exportLayout,
    exportLayoutAsString,
    downloadLayout,
    importLayout,
    copyLayoutToClipboard,
    
    // React Flow instance (for advanced usage)
    reactFlowInstance,
  };
}
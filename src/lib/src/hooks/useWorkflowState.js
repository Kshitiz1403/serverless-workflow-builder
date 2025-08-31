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
    
    // React Flow instance (for advanced usage)
    reactFlowInstance,
  };
}
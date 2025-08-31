import { useCallback } from 'react';
import {
  createOperationNode,
  createSleepNode,
  createEventNode,
  createSwitchNode,
  createEndNode,
  createStartNode,
  createNode,
  getDefaultPosition
} from '../utils/nodeFactory';

/**
 * Hook for workflow actions - provides functions to add nodes programmatically
 * @param {Object} workflowState - The workflow state from useWorkflowState
 * @param {Function} historyCallback - Optional callback to update history state
 * @returns {Object} Object containing functions to add different types of nodes
 */
export function useWorkflowActions(workflowState, historyCallback) {
  const { nodes, edges, workflowMetadata, updateNodes } = workflowState;

  // Helper function to add a node and update history
  const addNodeToWorkflow = useCallback((newNode) => {
    const updatedNodes = [...nodes, newNode];
    updateNodes(updatedNodes);
    
    // Update history if callback provided
    if (historyCallback) {
      historyCallback({
        nodes: updatedNodes,
        edges,
        workflowMetadata
      });
    }
    
    return newNode;
  }, [nodes, edges, workflowMetadata, updateNodes, historyCallback]);

  // Add operation node
  const addOperationNode = useCallback((options = {}) => {
    const position = options.position || getDefaultPosition(nodes);
    const newNode = createOperationNode({ ...options, position });
    return addNodeToWorkflow(newNode);
  }, [nodes, addNodeToWorkflow]);

  // Add sleep node
  const addSleepNode = useCallback((options = {}) => {
    const position = options.position || getDefaultPosition(nodes);
    const newNode = createSleepNode({ ...options, position });
    return addNodeToWorkflow(newNode);
  }, [nodes, addNodeToWorkflow]);

  // Add event node
  const addEventNode = useCallback((options = {}) => {
    const position = options.position || getDefaultPosition(nodes);
    const newNode = createEventNode({ ...options, position });
    return addNodeToWorkflow(newNode);
  }, [nodes, addNodeToWorkflow]);

  // Add switch node
  const addSwitchNode = useCallback((options = {}) => {
    const position = options.position || getDefaultPosition(nodes);
    const newNode = createSwitchNode({ ...options, position });
    return addNodeToWorkflow(newNode);
  }, [nodes, addNodeToWorkflow]);

  // Add end node
  const addEndNode = useCallback((options = {}) => {
    const position = options.position || getDefaultPosition(nodes);
    const newNode = createEndNode({ ...options, position });
    return addNodeToWorkflow(newNode);
  }, [nodes, addNodeToWorkflow]);

  // Add start node
  const addStartNode = useCallback((options = {}) => {
    const position = options.position || getDefaultPosition(nodes);
    const newNode = createStartNode({ ...options, position });
    return addNodeToWorkflow(newNode);
  }, [nodes, addNodeToWorkflow]);

  // Generic add node function
  const addNode = useCallback((nodeType, options = {}) => {
    const position = options.position || getDefaultPosition(nodes);
    const newNode = createNode(nodeType, { ...options, position });
    return addNodeToWorkflow(newNode);
  }, [nodes, addNodeToWorkflow]);

  // Remove node by ID
  const removeNode = useCallback((nodeId) => {
    const updatedNodes = nodes.filter(node => node.id !== nodeId);
    // Also remove edges connected to this node
    const updatedEdges = edges.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    );
    
    updateNodes(updatedNodes);
    
    // Update history if callback provided
    if (historyCallback) {
      historyCallback({
        nodes: updatedNodes,
        edges: updatedEdges,
        workflowMetadata
      });
    }
    
    return { nodes: updatedNodes, edges: updatedEdges };
  }, [nodes, edges, workflowMetadata, updateNodes, historyCallback]);

  // Duplicate node
  const duplicateNode = useCallback((nodeId, options = {}) => {
    const originalNode = nodes.find(node => node.id === nodeId);
    if (!originalNode) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    const position = options.position || {
      x: originalNode.position.x + 50,
      y: originalNode.position.y + 50
    };

    const newNode = createNode(originalNode.type, {
      ...originalNode.data,
      name: `${originalNode.data.name} Copy`,
      position,
      ...options
    });

    return addNodeToWorkflow(newNode);
  }, [nodes, addNodeToWorkflow]);

  // Clear all nodes
  const clearAllNodes = useCallback(() => {
    updateNodes([]);
    
    // Update history if callback provided
    if (historyCallback) {
      historyCallback({
        nodes: [],
        edges: [],
        workflowMetadata
      });
    }
  }, [updateNodes, workflowMetadata, historyCallback]);

  return {
    // Add specific node types
    addOperationNode,
    addSleepNode,
    addEventNode,
    addSwitchNode,
    addEndNode,
    addStartNode,
    
    // Generic functions
    addNode,
    removeNode,
    duplicateNode,
    clearAllNodes,
    
    // Utility
    getDefaultPosition: () => getDefaultPosition(nodes)
  };
}
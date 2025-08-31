import { useCallback } from 'react';
import { addEdge } from 'reactflow';

/**
 * Custom hook for handling edge connections with proper styling
 * @param {Array} edges - Current edges array
 * @param {Function} updateEdges - Function to update edges
 * @param {Function} setHistoryState - Function to update history state
 * @param {Object} nodes - Current nodes array
 * @param {Object} workflowMetadata - Current workflow metadata
 * @returns {Function} onConnect - Function to handle new edge connections
 */
export const useEdgeConnection = (edges, updateEdges, setHistoryState, nodes, workflowMetadata) => {
  const onConnect = useCallback((connection) => {
    // Determine edge type based on source and target node types
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);
    
    let edgeType = 'simple';
    let edgeClass = 'edge-simple edge-animated';
    let strokeColor = '#10b981'; // success color
    
    // Determine edge styling based on node types and source handle
    if (sourceNode?.type === 'switch') {
      // Check if this is a default edge from a switch node
      if (connection.sourceHandle === 'default') {
        edgeType = 'default';
        edgeClass = 'edge-default';
        strokeColor = '#6b7280'; // gray color for default edges
      } else {
        edgeType = 'condition';
        edgeClass = 'edge-condition';
        strokeColor = '#f59e0b'; // warning color
      }
    } else if (targetNode?.type === 'end') {
      edgeType = 'end';
      edgeClass = 'edge-end';
      strokeColor = '#ef4444'; // danger color
    } else if (sourceNode?.type === 'start') {
      edgeType = 'simple';
      edgeClass = 'edge-simple edge-animated';
      strokeColor = '#10b981'; // success color
    }
    
    // Create styled edge with proper configuration
    const newEdge = {
      ...connection,
      id: `${connection.source}-to-${connection.target}`,
      type: 'default',
      className: edgeClass,
      style: { 
        strokeWidth: edgeType === 'end' ? 3 : 2,
        stroke: strokeColor
      },
      data: { 
        type: edgeType,
        sourceNodeType: sourceNode?.type,
        targetNodeType: targetNode?.type
      },
      labelStyle: { 
        fill: strokeColor, 
        fontWeight: 500, 
        fontSize: '12px' 
      },
      labelBgStyle: { 
        fill: 'white', 
        fillOpacity: 0.9 
      },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: 'arrowclosed',
        width: 20,
        height: 20,
        color: strokeColor
      },
    };
    
    // Add label based on edge type
    if (edgeType === 'condition') {
      newEdge.label = 'condition';
    } else if (edgeType === 'default') {
      newEdge.label = 'default';
    } else if (edgeType === 'end') {
      newEdge.label = 'end';
    } else {
      newEdge.label = `→ ${targetNode?.data?.name || targetNode?.data?.label || 'next'}`;
    }
    
    const updatedEdges = addEdge(newEdge, edges);
    updateEdges(updatedEdges);
    
    // Update history if setHistoryState is provided
    if (setHistoryState) {
      setHistoryState({ nodes, edges: updatedEdges, workflowMetadata });
    }
  }, [edges, updateEdges, setHistoryState, nodes, workflowMetadata]);
  
  return onConnect;
};

export default useEdgeConnection;
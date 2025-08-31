import { useEffect, useCallback } from 'react';

/**
 * Hook to synchronize edge labels with node names
 * Updates edge labels when target node names change
 */
export function useEdgeLabelSync(nodes, edges, updateEdges) {
  const syncEdgeLabels = useCallback(() => {
    let hasChanges = false;
    const updatedEdges = edges.map(edge => {
      const targetNode = nodes.find(node => node.id === edge.target);
      
      if (targetNode && edge.label && edge.label.startsWith('→')) {
        const expectedLabel = `→ ${targetNode.data?.name || targetNode.data?.label || 'next'}`;
        
        if (edge.label !== expectedLabel) {
          hasChanges = true;
          return { ...edge, label: expectedLabel };
        }
      }
      
      return edge;
    });
    
    if (hasChanges) {
      updateEdges(updatedEdges);
    }
  }, [nodes, edges, updateEdges]);

  useEffect(() => {
    syncEdgeLabels();
  }, [syncEdgeLabels]);
}

export default useEdgeLabelSync;
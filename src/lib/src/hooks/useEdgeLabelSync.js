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
      const sourceNode = nodes.find(node => node.id === edge.source);

      // Handle simple edges (non-switch nodes)
      if (targetNode && edge.label && edge.label.startsWith('→')) {
        const expectedLabel = `→ ${targetNode.data?.name || targetNode.data?.label || 'next'}`;

        if (edge.label !== expectedLabel) {
          hasChanges = true;
          return { ...edge, label: expectedLabel };
        }
      }

      // Handle condition edges from switch nodes
      if (sourceNode && sourceNode.type === 'switch' && edge.sourceHandle && edge.sourceHandle.startsWith('condition-')) {
        const conditionIndex = parseInt(edge.sourceHandle.replace('condition-', ''));
        const conditions = sourceNode.data?.dataConditions || sourceNode.data?.eventConditions || [];
        const condition = conditions[conditionIndex];

        // Determine expected label based on condition type
        let expectedLabel = '';
        if (condition) {
          if (sourceNode.data?.conditionType === 'event') {
            expectedLabel = condition.name || condition.eventRef || `event${conditionIndex + 1}`;
          } else {
            expectedLabel = condition.name || condition.condition || `condition${conditionIndex + 1}`;
          }
        } else {
          expectedLabel = `condition${conditionIndex + 1}`;
        }

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
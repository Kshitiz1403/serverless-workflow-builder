import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for managing node properties panel state and interactions
 * @param {Object} options - Configuration options
 * @param {Function} options.onNodeUpdate - Callback when node data is updated
 * @param {Function} options.onClose - Callback when panel is closed
 * @returns {Object} Panel state and control functions
 */
export function useNodePropertiesPanel({ onNodeUpdate, onClose } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Open panel with a specific node
  const openPanel = useCallback((node) => {
    if (!node) return;

    setSelectedNode(node);
    setFormData(node.data || {});
    setIsOpen(true);
    setIsDirty(false);
  }, []);

  // Close panel
  const closePanel = useCallback(() => {
    setIsOpen(false);
    setSelectedNode(null);
    setFormData({});
    setIsDirty(false);

    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Update a specific field in the form data
  const updateField = useCallback((fieldPath, value) => {
    setFormData(prev => {
      const newData = { ...prev };

      // Handle nested field paths (e.g., 'functionRef.refName')
      if (fieldPath.includes('.')) {
        const keys = fieldPath.split('.');
        let current = newData;

        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }

        // Set the final value
        current[keys[keys.length - 1]] = value;
      } else {
        newData[fieldPath] = value;
      }

      return newData;
    });

    setIsDirty(true);
  }, []);

  // Apply changes to the node
  const applyChanges = useCallback(() => {
    if (!selectedNode || !isDirty || !onNodeUpdate) return;

    onNodeUpdate(selectedNode.id, formData);
    setIsDirty(false);
  }, [selectedNode, formData, isDirty, onNodeUpdate]);

  // Reset form data to original node data
  const resetChanges = useCallback(() => {
    if (!selectedNode) return;

    setFormData(selectedNode.data || {});
    setIsDirty(false);
  }, [selectedNode]);

  // Auto-apply changes when form data changes (optional)
  const enableAutoSave = useCallback(() => {
    if (isDirty && selectedNode && onNodeUpdate) {
      onNodeUpdate(selectedNode.id, formData);
      setIsDirty(false);
    }
  }, [isDirty, selectedNode, formData, onNodeUpdate]);

  // Update form data when selected node changes externally
  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode.data || {});
      setIsDirty(false);
    }
  }, [selectedNode]);

  // Auto-save when form data changes (if enabled)
  useEffect(() => {
    if (isDirty && selectedNode && onNodeUpdate) {
      const timeoutId = setTimeout(() => {
        onNodeUpdate(selectedNode.id, formData);
        setIsDirty(false);
      }, 300); // Debounce auto-save by 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [formData, isDirty, selectedNode, onNodeUpdate]);

  return {
    // State
    isOpen,
    selectedNode,
    formData,
    isDirty,

    // Actions
    openPanel,
    closePanel,
    updateField,
    applyChanges,
    resetChanges,
    enableAutoSave,

    // Computed values
    nodeType: selectedNode?.type,
    nodeId: selectedNode?.id,
    hasChanges: isDirty,
  };
}

export default useNodePropertiesPanel;
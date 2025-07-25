import React, { useState, useEffect } from 'react';
import { Plus, Minus, Settings, RefreshCw, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import JsonEditor from './JsonEditor';
import JsonEditorModal from './JsonEditorModal';
import './NodePropertiesEditor.css';

const NodePropertiesEditor = ({ node, onUpdateNodeData, workflowMetadata, onUpdateWorkflowMetadata }) => {
  const [formData, setFormData] = useState({});
  const [modalState, setModalState] = useState({ isOpen: false, value: null, onChange: null, title: '', label: '' });
  const [draggedActionIndex, setDraggedActionIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    const nodeData = node.data || {};

    // Convert legacy metadata format to new format if needed
    let updatedData = { ...nodeData };

    // Handle main metadata
    if (nodeData.metadata && !nodeData.metadataItems) {
      updatedData.metadataItems = Object.entries(nodeData.metadata).map(([key, value]) => ({
        id: uuidv4(),
        key,
        value
      }));
    }

    // Handle condition metadata for both data and event conditions
    ['dataConditions', 'eventConditions'].forEach(conditionKey => {
      if (updatedData[conditionKey]) {
        updatedData[conditionKey] = updatedData[conditionKey].map(condition => {
          if (condition.metadata && !condition.metadataItems) {
            return {
              ...condition,
              metadataItems: Object.entries(condition.metadata).map(([key, value]) => ({
                id: uuidv4(),
                key,
                value
              }))
            };
          }
          return condition;
        });
      }
    });

    setFormData(updatedData);
  }, [node]);

  // Start and End nodes should not have editable properties
  if (node.type === 'start' || node.type === 'end') {
    return (
      <div className="node-properties-editor">
        <div className="no-properties">
          <p className="no-properties-message">
            {node.type === 'start' ? 'Start' : 'End'} nodes have no editable properties.
          </p>
          <p className="node-info">
            This node serves as the workflow {node.type === 'start' ? 'entry point' : 'termination point'}.
          </p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const handleActionChange = (index, field, value) => {
    const actions = [...(formData.actions || [])];
    if (field === 'functionRef.refName') {
      actions[index] = {
        ...actions[index],
        functionRef: {
          ...actions[index].functionRef,
          refName: value,
        },
      };
    } else if (field === 'functionRef.arguments') {
      // Value is already parsed by JsonEditor
      actions[index] = {
        ...actions[index],
        functionRef: {
          ...actions[index].functionRef,
          arguments: value,
        },
      };
    } else if (field.startsWith('actionDataFilter.')) {
      const filterField = field.split('.')[1];
      actions[index] = {
        ...actions[index],
        actionDataFilter: {
          ...actions[index].actionDataFilter,
          [filterField]: value,
        },
      };
    } else {
      actions[index] = { ...actions[index], [field]: value };
    }

    const updatedData = { ...formData, actions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const addAction = () => {
    const actions = [...(formData.actions || [])];
    actions.push({
      name: `action${actions.length + 1}`,
      functionRef: {
        refName: 'functionName',
        arguments: {},
      },
    });
    const updatedData = { ...formData, actions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const removeAction = (index) => {
    const actions = [...(formData.actions || [])];
    actions.splice(index, 1);
    const updatedData = { ...formData, actions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const insertAction = (index) => {
    const actions = [...(formData.actions || [])];
    const newAction = {
      name: `action${actions.length + 1}`,
      functionRef: {
        refName: 'functionName',
        arguments: {},
      },
    };
    actions.splice(index + 1, 0, newAction);
    const updatedData = { ...formData, actions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const handleActionDragStart = (e, index) => {
    setDraggedActionIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // For Firefox compatibility
  };

  const handleActionDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedActionIndex !== null && draggedActionIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleActionDragLeave = (e) => {
    // Only clear drag over if we're leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleActionDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedActionIndex === null || draggedActionIndex === dropIndex) {
      setDraggedActionIndex(null);
      setDragOverIndex(null);
      return;
    }

    const actions = [...(formData.actions || [])];
    const draggedAction = actions[draggedActionIndex];

    // Remove the dragged action
    actions.splice(draggedActionIndex, 1);

    // Insert at the new position
    const newIndex = draggedActionIndex < dropIndex ? dropIndex - 1 : dropIndex;
    actions.splice(newIndex, 0, draggedAction);

    const updatedData = { ...formData, actions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
    setDraggedActionIndex(null);
    setDragOverIndex(null);
  };

  const handleActionDragEnd = () => {
    setDraggedActionIndex(null);
    setDragOverIndex(null);
  };

  const handleConditionChange = (index, field, value) => {
    const conditionType = formData.conditionType || 'data';
    const conditionKey = conditionType === 'data' ? 'dataConditions' : 'eventConditions';
    const conditions = [...(formData[conditionKey] || [])];

    if (field.startsWith('metadata.')) {
      const metadataField = field.split('.')[1];
      conditions[index] = {
        ...conditions[index],
        metadata: {
          ...conditions[index].metadata,
          [metadataField]: value,
        },
      };
    } else {
      conditions[index] = { ...conditions[index], [field]: value };
    }

    const updatedData = { ...formData, [conditionKey]: conditions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const addCondition = () => {
    const conditionType = formData.conditionType || 'data';
    const conditionKey = conditionType === 'data' ? 'dataConditions' : 'eventConditions';
    const conditions = [...(formData[conditionKey] || [])];

    if (conditionType === 'data') {
      conditions.push({
        name: `condition${conditions.length + 1}`,
        condition: '.data == true',
      });
    } else {
      conditions.push({
        name: `condition${conditions.length + 1}`,
        eventRef: 'example_event',
      });
    }

    const updatedData = { ...formData, [conditionKey]: conditions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const handleEventChange = (index, field, value) => {
    const events = [...(formData.events || [])];
    if (field === 'eventRefs') {
      // Value is already parsed by JsonEditor
      events[index] = { ...events[index], eventRefs: value };
    } else {
      events[index] = { ...events[index], [field]: value };
    }

    const updatedData = { ...formData, events };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const addEvent = () => {
    const events = [...(formData.events || [])];
    events.push({
      eventRefs: ['new_event'],
      actions: [],
    });
    const updatedData = { ...formData, events };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const removeEvent = (index) => {
    const events = [...(formData.events || [])];
    events.splice(index, 1);
    const updatedData = { ...formData, events };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const removeCondition = (index) => {
    const conditionType = formData.conditionType || 'data';
    const conditionKey = conditionType === 'data' ? 'dataConditions' : 'eventConditions';
    const conditions = [...(formData[conditionKey] || [])];
    conditions.splice(index, 1);
    const updatedData = { ...formData, [conditionKey]: conditions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  // Get available retry policies
  const getRetryPolicies = () => {
    return workflowMetadata?.retryPolicies || [];
  };

  // Error Handler Functions
  const addErrorHandler = () => {
    const onErrors = [...(formData.onErrors || [])];
    onErrors.push({
      errorRef: 'DefaultErrorRef',
      transition: 'ErrorHandlingState',
    });
    const updatedData = { ...formData, onErrors };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const removeErrorHandler = (index) => {
    const onErrors = [...(formData.onErrors || [])];
    onErrors.splice(index, 1);
    const updatedData = { ...formData, onErrors };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const handleErrorHandlerChange = (index, field, value) => {
    const onErrors = [...(formData.onErrors || [])];
    onErrors[index] = { ...onErrors[index], [field]: value };
    const updatedData = { ...formData, onErrors };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const openJsonModal = (value, onChange, title, label) => {
    setModalState({
      isOpen: true,
      value,
      onChange,
      title,
      label
    });
  };

  const closeJsonModal = () => {
    setModalState({ isOpen: false, value: null, onChange: null, title: '', label: '' });
  };

  // Metadata handling functions
  const addMetadataField = () => {
    // Initialize metadataItems if it doesn't exist
    const metadataItems = formData.metadataItems || [];
    const newItem = {
      id: uuidv4(),
      key: `newKey${metadataItems.length + 1}`,
      value: ''
    };
    const updatedMetadataItems = [...metadataItems, newItem];

    // Also update the metadata object for backwards compatibility
    const metadata = { ...formData.metadata };
    metadata[newItem.key] = newItem.value;

    const updatedData = {
      ...formData,
      metadataItems: updatedMetadataItems,
      metadata
    };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const updateMetadataField = (itemId, field, newValue) => {
    const metadataItems = [...(formData.metadataItems || [])];
    const itemIndex = metadataItems.findIndex(item => item.id === itemId);

    if (itemIndex === -1) return;

    const oldItem = metadataItems[itemIndex];
    const updatedItem = { ...oldItem, [field]: newValue };
    metadataItems[itemIndex] = updatedItem;

    // Rebuild metadata object from items
    const metadata = {};
    metadataItems.forEach(item => {
      if (item.key.trim()) { // Only add non-empty keys
        metadata[item.key] = item.value;
      }
    });

    const updatedData = {
      ...formData,
      metadataItems,
      metadata
    };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const removeMetadataField = (itemId) => {
    const metadataItems = [...(formData.metadataItems || [])];
    const filteredItems = metadataItems.filter(item => item.id !== itemId);

    // Rebuild metadata object from remaining items
    const metadata = {};
    filteredItems.forEach(item => {
      if (item.key.trim()) {
        metadata[item.key] = item.value;
      }
    });

    const updatedData = {
      ...formData,
      metadataItems: filteredItems,
      metadata
    };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  // Convert legacy metadata object to metadataItems format
  const getMetadataItems = () => {
    if (formData.metadataItems) {
      return formData.metadataItems;
    }

    // Convert legacy format
    if (formData.metadata) {
      return Object.entries(formData.metadata).map(([key, value]) => ({
        id: uuidv4(),
        key,
        value
      }));
    }

    return [];
  };

  const addConditionMetadataField = (conditionIndex) => {
    const conditionType = formData.conditionType || 'data';
    const conditionKey = conditionType === 'data' ? 'dataConditions' : 'eventConditions';
    const conditions = [...(formData[conditionKey] || [])];
    const condition = conditions[conditionIndex];

    // Initialize metadataItems if it doesn't exist
    const metadataItems = condition.metadataItems || [];
    const newItem = {
      id: uuidv4(),
      key: `newKey${metadataItems.length + 1}`,
      value: ''
    };
    const updatedMetadataItems = [...metadataItems, newItem];

    // Also update the metadata object for backwards compatibility
    const metadata = { ...condition.metadata };
    metadata[newItem.key] = newItem.value;

    conditions[conditionIndex] = {
      ...condition,
      metadataItems: updatedMetadataItems,
      metadata
    };
    const updatedData = { ...formData, [conditionKey]: conditions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const updateConditionMetadataField = (conditionIndex, itemId, field, newValue) => {
    const conditionType = formData.conditionType || 'data';
    const conditionKey = conditionType === 'data' ? 'dataConditions' : 'eventConditions';
    const conditions = [...(formData[conditionKey] || [])];
    const condition = conditions[conditionIndex];

    const metadataItems = [...(condition.metadataItems || [])];
    const itemIndex = metadataItems.findIndex(item => item.id === itemId);

    if (itemIndex === -1) return;

    const oldItem = metadataItems[itemIndex];
    const updatedItem = { ...oldItem, [field]: newValue };
    metadataItems[itemIndex] = updatedItem;

    // Rebuild metadata object from items
    const metadata = {};
    metadataItems.forEach(item => {
      if (item.key.trim()) {
        metadata[item.key] = item.value;
      }
    });

    conditions[conditionIndex] = {
      ...condition,
      metadataItems,
      metadata
    };
    const updatedData = { ...formData, [conditionKey]: conditions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const removeConditionMetadataField = (conditionIndex, itemId) => {
    const conditionType = formData.conditionType || 'data';
    const conditionKey = conditionType === 'data' ? 'dataConditions' : 'eventConditions';
    const conditions = [...(formData[conditionKey] || [])];
    const condition = conditions[conditionIndex];

    const metadataItems = [...(condition.metadataItems || [])];
    const filteredItems = metadataItems.filter(item => item.id !== itemId);

    // Rebuild metadata object from remaining items
    const metadata = {};
    filteredItems.forEach(item => {
      if (item.key.trim()) {
        metadata[item.key] = item.value;
      }
    });

    conditions[conditionIndex] = {
      ...condition,
      metadataItems: filteredItems,
      metadata
    };
    const updatedData = { ...formData, [conditionKey]: conditions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  // Convert legacy condition metadata object to metadataItems format
  const getConditionMetadataItems = (condition) => {
    if (condition.metadataItems) {
      return condition.metadataItems;
    }

    // Convert legacy format
    if (condition.metadata) {
      return Object.entries(condition.metadata).map(([key, value]) => ({
        id: uuidv4(),
        key,
        value
      }));
    }

    return [];
  };

  return (
    <div className="node-properties-editor">
      <div className="form-group">
        <label>Node Label</label>
        <input
          type="text"
          value={formData.label || ''}
          onChange={(e) => handleInputChange('label', e.target.value)}
          placeholder="Enter node label"
        />
      </div>

      <div className="form-group">
        <label>Node Name</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter node name"
        />
      </div>

      {/* Metadata Section */}
      <div className="section">
        <div className="section-header">
          <Settings size={16} />
          <span>Metadata</span>
          <button className="add-btn" onClick={addMetadataField}>
            <Plus size={14} />
          </button>
        </div>
        <div className="form-help">
          <small>Add custom key-value metadata for this state</small>
        </div>

        <div className="metadata-list">
          {getMetadataItems().map((item, index) => (
            <div key={item.id} className="metadata-row">
              <div className="metadata-input-group">
                <input
                  type="text"
                  value={item.key}
                  onChange={(e) => updateMetadataField(item.id, 'key', e.target.value)}
                  placeholder="Key"
                  className="metadata-key-input"
                />
                <input
                  type="text"
                  value={typeof item.value === 'object' ? JSON.stringify(item.value) : item.value}
                  onChange={(e) => updateMetadataField(item.id, 'value', e.target.value)}
                  placeholder="Value"
                  className="metadata-value-input"
                />
                <button
                  className="remove-btn-inline"
                  onClick={() => removeMetadataField(item.id)}
                  title="Remove metadata field"
                >
                  <Minus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {node.type === 'operation' && (
        <div className="section">
          <div className="section-header">
            <Settings size={16} />
            <span>Actions</span>
            <button className="add-btn" onClick={addAction}>
              <Plus size={14} />
            </button>
          </div>

          {(formData.actions || []).map((action, index) => (
            <div key={index}>
              {/* Drop zone indicator above each action */}
              {draggedActionIndex !== null && draggedActionIndex !== index && (
                <div
                  className={`drop-zone ${dragOverIndex === index ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleActionDragOver(e, index)}
                  onDrop={(e) => handleActionDrop(e, index)}
                  onDragLeave={handleActionDragLeave}
                >
                  <div className="drop-indicator">
                    <div className="drop-line"></div>
                    <span className="drop-text">Drop here to insert before Action {index + 1}</span>
                  </div>
                </div>
              )}

              <div
                className={`action-item ${draggedActionIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-target' : ''}`}
                draggable
                onDragStart={(e) => handleActionDragStart(e, index)}
                onDragOver={(e) => handleActionDragOver(e, index)}
                onDrop={(e) => handleActionDrop(e, index)}
                onDragEnd={handleActionDragEnd}
                onDragLeave={handleActionDragLeave}
              >
                <div className="item-header">
                  <div className="drag-handle">
                    <GripVertical size={14} />
                  </div>
                  <span>Action {index + 1}</span>
                  <div className="action-buttons">
                    <button
                      className="insert-btn"
                      onClick={() => insertAction(index)}
                      title="Insert action after this one"
                    >
                      <Plus size={14} />
                    </button>
                    <button className="remove-btn" onClick={() => removeAction(index)}>
                      <Minus size={14} />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={action.name || ''}
                    onChange={(e) => handleActionChange(index, 'name', e.target.value)}
                    placeholder="Action name"
                  />
                </div>

                <div className="form-group">
                  <label>Function Reference</label>
                  <input
                    type="text"
                    value={action.functionRef?.refName || ''}
                    onChange={(e) => handleActionChange(index, 'functionRef.refName', e.target.value)}
                    placeholder="Function name"
                  />
                </div>

                <JsonEditor
                  label="Arguments (JSON)"
                  value={action.functionRef?.arguments}
                  onChange={(value) => handleActionChange(index, 'functionRef.arguments', value)}
                  placeholder='{"key": "value"}'
                  height="120px"
                  onOpenModal={() => openJsonModal(
                    action.functionRef?.arguments,
                    (value) => handleActionChange(index, 'functionRef.arguments', value),
                    `Function Arguments - ${action.name || `Action ${index + 1}`}`,
                    "Function Arguments (JSON)"
                  )}
                />

                <div className="form-group">
                  <label>Retry Policy</label>
                  <select
                    value={action.retryRef || ''}
                    onChange={(e) => handleActionChange(index, 'retryRef', e.target.value)}
                  >
                    <option value="">No retry policy</option>
                    {getRetryPolicies().map((policy) => (
                      <option key={policy.id} value={policy.id}>
                        {policy.name}
                      </option>
                    ))}
                  </select>
                  {getRetryPolicies().length === 0 && (
                    <div className="retry-policy-hint">
                      <span>No retry policies available. Create policies in the Workflow tab.</span>
                    </div>
                  )}
                </div>

                {/* Action Data Filter Toggle */}
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={!!action.actionDataFilter}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Enable action data filter with default values
                          const actions = [...(formData.actions || [])];
                          actions[index] = {
                            ...actions[index],
                            actionDataFilter: {
                              useResults: true,
                              results: '',
                              toStateData: ''
                            }
                          };
                          const updatedData = { ...formData, actions };
                          setFormData(updatedData);
                          onUpdateNodeData(node.id, updatedData);
                        } else {
                          // Disable action data filter by removing it
                          const actions = [...(formData.actions || [])];
                          const updatedAction = { ...actions[index] };
                          delete updatedAction.actionDataFilter;
                          actions[index] = updatedAction;
                          const updatedData = { ...formData, actions };
                          setFormData(updatedData);
                          onUpdateNodeData(node.id, updatedData);
                        }
                      }}
                    />
                    Enable Action Data Filter
                  </label>
                  <div className="form-help">
                    <small>Configure how action results are processed and stored</small>
                  </div>
                </div>

                {/* Action Data Filter Section - Only visible when enabled */}
                {action.actionDataFilter && (
                  <div className="subsection">
                    <div className="subsection-header">
                      <span>Action Data Filter Configuration</span>
                    </div>

                    <div className="form-group">
                      <label>Results Filter (jq expression)</label>
                      <input
                        type="text"
                        value={action.actionDataFilter?.results || ''}
                        onChange={(e) => handleActionChange(index, 'actionDataFilter.results', e.target.value)}
                        placeholder="${ .userLoanDetails.currentAddress | fromjson | .state }"
                      />
                      <div className="form-help">
                        <small>jq expression to filter action result data</small>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>To State Data (jq expression)</label>
                      <input
                        type="text"
                        value={action.actionDataFilter?.toStateData || ''}
                        onChange={(e) => handleActionChange(index, 'actionDataFilter.toStateData', e.target.value)}
                        placeholder="${ .currentAddressState }"
                      />
                      <div className="form-help">
                        <small>jq expression defining how to populate state data</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drop zone at the end for the last item */}
              {draggedActionIndex !== null &&
                draggedActionIndex !== index &&
                index === (formData.actions || []).length - 1 && (
                  <div
                    className={`drop-zone ${dragOverIndex === index + 1 ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleActionDragOver(e, index + 1)}
                    onDrop={(e) => handleActionDrop(e, index + 1)}
                    onDragLeave={handleActionDragLeave}
                  >
                    <div className="drop-indicator">
                      <div className="drop-line"></div>
                      <span className="drop-text">Drop here to insert after Action {index + 1}</span>
                    </div>
                  </div>
                )}
            </div>
          ))}

          {/* Error Handlers Section */}
          <div className="section">
            <div className="section-header">
              <Settings size={16} />
              <span>Error Handlers</span>
              <button className="add-btn" onClick={addErrorHandler}>
                <Plus size={14} />
              </button>
            </div>

            {(formData.onErrors || []).map((errorHandler, index) => (
              <div key={index} className="error-handler-item">
                <div className="item-header">
                  <span>Error Handler {index + 1}</span>
                  <button className="remove-btn" onClick={() => removeErrorHandler(index)}>
                    <Minus size={14} />
                  </button>
                </div>

                <div className="form-group">
                  <label>Error Reference</label>
                  <input
                    type="text"
                    value={errorHandler.errorRef || ''}
                    onChange={(e) => handleErrorHandlerChange(index, 'errorRef', e.target.value)}
                    placeholder="Error reference name"
                  />
                </div>

                <div className="form-group">
                  <label>Transition State</label>
                  <input
                    type="text"
                    value={errorHandler.transition || ''}
                    onChange={(e) => handleErrorHandlerChange(index, 'transition', e.target.value)}
                    placeholder="Target state name"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {node.type === 'event' && (
        <div className="section">
          <div className="section-header">
            <Settings size={16} />
            <span>Events</span>
            <button className="add-btn" onClick={addEvent}>
              <Plus size={14} />
            </button>
          </div>

          {(formData.events || []).map((event, index) => (
            <div key={index} className="event-item">
              <div className="item-header">
                <span>Event {index + 1}</span>
                <button className="remove-btn" onClick={() => removeEvent(index)}>
                  <Minus size={14} />
                </button>
              </div>

              <JsonEditor
                label="Event References (JSON Array)"
                value={event.eventRefs}
                onChange={(value) => handleEventChange(index, 'eventRefs', value)}
                placeholder='["event_name_1", "event_name_2"]'
                height="80px"
                onOpenModal={() => openJsonModal(
                  event.eventRefs,
                  (value) => handleEventChange(index, 'eventRefs', value),
                  `Event References - Event ${index + 1}`,
                  "Event References (JSON Array)"
                )}
              />
            </div>
          ))}

          <div className="form-group">
            <label>Event Timeout</label>
            <input
              type="text"
              value={formData.timeouts?.eventTimeout || ''}
              onChange={(e) =>
                handleInputChange('timeouts', {
                  ...formData.timeouts,
                  eventTimeout: e.target.value,
                })
              }
              placeholder="PT30M (ISO 8601 duration)"
            />
          </div>
        </div>
      )}

      {node.type === 'sleep' && (
        <div className="section">
          <div className="form-group">
            <label>Duration</label>
            <input
              type="text"
              value={formData.duration || ''}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              placeholder="PT30M (ISO 8601 duration format)"
            />
          </div>
          <div className="form-help">
            <p>Use ISO 8601 duration format:</p>
            <ul>
              <li>PT30S - 30 seconds</li>
              <li>PT5M - 5 minutes</li>
              <li>PT2H - 2 hours</li>
              <li>PT24H - 24 hours</li>
              <li>P1D - 1 day</li>
            </ul>
          </div>
        </div>
      )}

      {node.type === 'switch' && (
        <div className="section">
          <div className="form-group">
            <label>Condition Type</label>
            <select
              value={formData.conditionType || 'data'}
              onChange={(e) => {
                const newType = e.target.value;
                const updatedData = {
                  ...formData,
                  conditionType: newType,
                  // Clear the opposite condition type when switching
                  dataConditions: newType === 'data' ? formData.dataConditions || [] : [],
                  eventConditions: newType === 'event' ? formData.eventConditions || [] : [],
                };

                setFormData(updatedData);
                onUpdateNodeData(node.id, updatedData);
              }}
            >
              <option value="data">Data Conditions</option>
              <option value="event">Event Conditions</option>
            </select>
          </div>

          {/* Event Timeout Configuration - Only visible when using event conditions */}
          {formData.conditionType === 'event' && (
            <div className="form-group">
              <label>Event Timeout <span className="required-indicator">*</span></label>
              <input
                type="text"
                value={formData.timeouts?.eventTimeout || ''}
                onChange={(e) =>
                  handleInputChange('timeouts', {
                    ...formData.timeouts,
                    eventTimeout: e.target.value,
                  })
                }
                placeholder="PT30M (ISO 8601 duration)"
                required
                className={!formData.timeouts?.eventTimeout ? 'required-field' : ''}
              />
              <div className="form-help">
                <small>Maximum time to wait for events before triggering default condition (ISO 8601 duration format)</small>
              </div>
              {!formData.timeouts?.eventTimeout && (
                <div className="validation-error">
                  <small>Event timeout is required when using event conditions</small>
                </div>
              )}
            </div>
          )}

          <div className="section-header">
            <Settings size={16} />
            <span>
              {formData.conditionType === 'event' ? 'Event Conditions' : 'Data Conditions'}
            </span>
            <button className="add-btn" onClick={addCondition}>
              <Plus size={14} />
            </button>
          </div>

          {(
            (formData.conditionType === 'data'
              ? formData.dataConditions
              : formData.eventConditions) || []
          ).map((condition, index) => (
            <div key={index} className="condition-item">
              <div className="item-header">
                <span>Condition {index + 1}</span>
                <button className="remove-btn" onClick={() => removeCondition(index)}>
                  <Minus size={14} />
                </button>
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={condition.name || ''}
                  onChange={(e) => handleConditionChange(index, 'name', e.target.value)}
                  placeholder="Condition name"
                />
              </div>

              {formData.conditionType === 'data' ? (
                <div className="form-group">
                  <label>Condition Expression</label>
                  <input
                    type="text"
                    value={condition.condition || ''}
                    onChange={(e) => handleConditionChange(index, 'condition', e.target.value)}
                    placeholder=".data == true"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Event Reference</label>
                  <input
                    type="text"
                    value={condition.eventRef || ''}
                    onChange={(e) => handleConditionChange(index, 'eventRef', e.target.value)}
                    placeholder="event_name"
                  />
                </div>
              )}

              {/* Condition Metadata Section */}
              <div className="subsection">
                <div className="subsection-header">
                  <span>Condition Metadata</span>
                  <button
                    className="add-btn"
                    onClick={() => addConditionMetadataField(index)}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="metadata-list">
                  {getConditionMetadataItems(condition).map((item, metaIndex) => (
                    <div key={item.id} className="metadata-row">
                      <div className="metadata-input-group">
                        <input
                          type="text"
                          value={item.key}
                          onChange={(e) => updateConditionMetadataField(index, item.id, 'key', e.target.value)}
                          placeholder="Key"
                          className="metadata-key-input"
                        />
                        <input
                          type="text"
                          value={typeof item.value === 'object' ? JSON.stringify(item.value) : item.value}
                          onChange={(e) => updateConditionMetadataField(index, item.id, 'value', e.target.value)}
                          placeholder="Value"
                          className="metadata-value-input"
                        />
                        <button
                          className="remove-btn-inline"
                          onClick={() => removeConditionMetadataField(index, item.id)}
                          title="Remove metadata field"
                        >
                          <Minus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <JsonEditorModal
        isOpen={modalState.isOpen}
        onClose={closeJsonModal}
        value={modalState.value}
        onChange={modalState.onChange}
        title={modalState.title}
        label={modalState.label}
      />
    </div>
  );
};

export default NodePropertiesEditor;

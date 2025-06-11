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
    setFormData(node.data || {});
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
    const metadata = { ...formData.metadata };
    metadata[`newKey${Object.keys(metadata || {}).length + 1}`] = '';
    const updatedData = { ...formData, metadata };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const updateMetadataField = (oldKey, newKey, value) => {
    const metadata = { ...formData.metadata };
    if (oldKey !== newKey && oldKey in metadata) {
      delete metadata[oldKey];
    }
    metadata[newKey] = value;
    const updatedData = { ...formData, metadata };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const removeMetadataField = (key) => {
    const metadata = { ...formData.metadata };
    delete metadata[key];
    const updatedData = { ...formData, metadata };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const addConditionMetadataField = (conditionIndex) => {
    const conditionType = formData.conditionType || 'data';
    const conditionKey = conditionType === 'data' ? 'dataConditions' : 'eventConditions';
    const conditions = [...(formData[conditionKey] || [])];
    const condition = conditions[conditionIndex];
    const metadata = { ...condition.metadata };
    metadata[`newKey${Object.keys(metadata || {}).length + 1}`] = '';
    conditions[conditionIndex] = { ...condition, metadata };
    const updatedData = { ...formData, [conditionKey]: conditions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const updateConditionMetadataField = (conditionIndex, oldKey, newKey, value) => {
    const conditionType = formData.conditionType || 'data';
    const conditionKey = conditionType === 'data' ? 'dataConditions' : 'eventConditions';
    const conditions = [...(formData[conditionKey] || [])];
    const condition = conditions[conditionIndex];
    const metadata = { ...condition.metadata };
    if (oldKey !== newKey && oldKey in metadata) {
      delete metadata[oldKey];
    }
    metadata[newKey] = value;
    conditions[conditionIndex] = { ...condition, metadata };
    const updatedData = { ...formData, [conditionKey]: conditions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
  };

  const removeConditionMetadataField = (conditionIndex, key) => {
    const conditionType = formData.conditionType || 'data';
    const conditionKey = conditionType === 'data' ? 'dataConditions' : 'eventConditions';
    const conditions = [...(formData[conditionKey] || [])];
    const condition = conditions[conditionIndex];
    const metadata = { ...condition.metadata };
    delete metadata[key];
    conditions[conditionIndex] = { ...condition, metadata };
    const updatedData = { ...formData, [conditionKey]: conditions };
    setFormData(updatedData);
    onUpdateNodeData(node.id, updatedData);
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

        {formData.metadata && Object.entries(formData.metadata).map(([key, value], index) => (
          <div key={index} className="metadata-item">
            <div className="item-header">
              <span>Metadata Field {index + 1}</span>
              <button
                className="remove-btn"
                onClick={() => removeMetadataField(key)}
              >
                <Minus size={14} />
              </button>
            </div>
            <div className="metadata-fields">
              <div className="form-group">
                <label>Key</label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => updateMetadataField(key, e.target.value, value)}
                  placeholder="metadata key"
                />
              </div>
              <div className="form-group">
                <label>Value</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateMetadataField(key, key, e.target.value)}
                  placeholder="metadata value"
                />
              </div>
            </div>
          </div>
        ))}
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

                {condition.metadata && Object.entries(condition.metadata).map(([key, value], metaIndex) => (
                  <div key={metaIndex} className="metadata-item small">
                    <div className="item-header">
                      <span>Meta {metaIndex + 1}</span>
                      <button
                        className="remove-btn"
                        onClick={() => removeConditionMetadataField(index, key)}
                      >
                        <Minus size={12} />
                      </button>
                    </div>
                    <div className="metadata-fields">
                      <div className="form-group">
                        <label>Key</label>
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => updateConditionMetadataField(index, key, e.target.value, value)}
                          placeholder="key"
                        />
                      </div>
                      <div className="form-group">
                        <label>Value</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateConditionMetadataField(index, key, key, e.target.value)}
                          placeholder="value"
                        />
                      </div>
                    </div>
                  </div>
                ))}
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

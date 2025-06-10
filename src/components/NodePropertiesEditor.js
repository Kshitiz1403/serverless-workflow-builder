import React, { useState, useEffect } from 'react';
import { Plus, Minus, Settings, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import JsonEditor from './JsonEditor';
import JsonEditorModal from './JsonEditorModal';
import './NodePropertiesEditor.css';

const NodePropertiesEditor = ({ node, onUpdateNodeData, workflowMetadata, onUpdateWorkflowMetadata }) => {
  const [formData, setFormData] = useState({});
  const [modalState, setModalState] = useState({ isOpen: false, value: null, onChange: null, title: '', label: '' });

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

  const handleConditionChange = (index, field, value) => {
    const conditionType = formData.conditionType || 'data';
    const conditionKey = conditionType === 'data' ? 'dataConditions' : 'eventConditions';
    const conditions = [...(formData[conditionKey] || [])];
    conditions[index] = { ...conditions[index], [field]: value };

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
            <div key={index} className="action-item">
              <div className="item-header">
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

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Settings, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import JsonEditor from './JsonEditor';
import './NodePropertiesEditor.css';

const NodePropertiesEditor = ({ node, onUpdateNodeData, workflowMetadata, onUpdateWorkflowMetadata }) => {
  const [formData, setFormData] = useState({});

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

  // Retry Policy Management
  const getRetryPolicies = () => {
    const policies = workflowMetadata?.retryPolicies || [];
    // Ensure all policies have IDs (for backward compatibility)
    let needsUpdate = false;
    const updatedPolicies = policies.map(policy => {
      if (!policy.id) {
        needsUpdate = true;
        return { ...policy, id: uuidv4() };
      }
      return policy;
    });

    // Update metadata if we added IDs
    if (needsUpdate && onUpdateWorkflowMetadata) {
      onUpdateWorkflowMetadata({
        ...workflowMetadata,
        retryPolicies: updatedPolicies
      });
    }

    return updatedPolicies;
  };

  const addRetryPolicy = () => {
    const retryPolicies = [...getRetryPolicies()];
    const newPolicy = {
      id: uuidv4(), // Stable unique ID
      name: `retryPolicy${retryPolicies.length + 1}`,
      delay: 'PT2S',
      maxAttempts: 3,
      increment: 'PT1S',
      multiplier: 2.0,
      maxDelay: 'PT30S',
      jitter: { from: 'PT0S', to: 'PT1S' }
    };
    retryPolicies.push(newPolicy);

    const updatedMetadata = {
      ...workflowMetadata,
      retryPolicies
    };
    onUpdateWorkflowMetadata(updatedMetadata);
  };

  const updateRetryPolicy = (policyId, field, value) => {
    const retryPolicies = [...getRetryPolicies()];
    const policyIndex = retryPolicies.findIndex(p => p.id === policyId);

    if (policyIndex === -1) return;

    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      retryPolicies[policyIndex] = {
        ...retryPolicies[policyIndex],
        [parentField]: {
          ...retryPolicies[policyIndex][parentField],
          [childField]: value
        }
      };
    } else {
      retryPolicies[policyIndex] = {
        ...retryPolicies[policyIndex],
        [field]: value
      };
    }

    const updatedMetadata = {
      ...workflowMetadata,
      retryPolicies
    };
    onUpdateWorkflowMetadata(updatedMetadata);
  };

  const removeRetryPolicy = (policyId) => {
    const retryPolicies = [...getRetryPolicies()];
    const filteredPolicies = retryPolicies.filter(p => p.id !== policyId);

    const updatedMetadata = {
      ...workflowMetadata,
      retryPolicies: filteredPolicies
    };
    onUpdateWorkflowMetadata(updatedMetadata);
  };

  const handleRetryPolicyChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
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
                <button className="remove-btn" onClick={() => removeAction(index)}>
                  <Minus size={14} />
                </button>
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
              />
            </div>
          ))}
        </div>
      )}

      {node.type === 'operation' && (
        <div className="section">
          <div className="section-header">
            <RefreshCw size={16} />
            <span>Retry Policy</span>
          </div>

          <div className="form-group">
            <label>Retry Policy</label>
            <select
              value={formData.retryRef || ''}
              onChange={(e) => handleRetryPolicyChange('retryRef', e.target.value)}
            >
              <option value="">No retry policy</option>
              {getRetryPolicies().map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.name}
                </option>
              ))}
            </select>
          </div>

          {getRetryPolicies().length === 0 && (
            <div className="no-retry-policies">
              <p>No retry policies defined.</p>
              <button
                className="create-retry-btn"
                onClick={addRetryPolicy}
                type="button"
              >
                <Plus size={14} />
                Create Retry Policy
              </button>
            </div>
          )}

          {getRetryPolicies().length > 0 && (
            <div className="retry-policies-management">
              <div className="section-header">
                <Settings size={16} />
                <span>Manage Retry Policies</span>
                <button className="add-btn" onClick={addRetryPolicy}>
                  <Plus size={14} />
                </button>
              </div>

              {getRetryPolicies().map((policy) => (
                <div key={policy.id} className="retry-policy-item">
                  <div className="item-header">
                    <span>Policy: {policy.name}</span>
                    <button className="remove-btn" onClick={() => removeRetryPolicy(policy.id)}>
                      <Minus size={14} />
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={policy.name || ''}
                      onChange={(e) => updateRetryPolicy(policy.id, 'name', e.target.value)}
                      placeholder="Retry policy name"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Initial Delay</label>
                      <input
                        type="text"
                        value={policy.delay || ''}
                        onChange={(e) => updateRetryPolicy(policy.id, 'delay', e.target.value)}
                        placeholder="PT2S"
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Attempts</label>
                      <input
                        type="number"
                        value={policy.maxAttempts || ''}
                        onChange={(e) => updateRetryPolicy(policy.id, 'maxAttempts', parseInt(e.target.value))}
                        placeholder="3"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Increment</label>
                      <input
                        type="text"
                        value={policy.increment || ''}
                        onChange={(e) => updateRetryPolicy(policy.id, 'increment', e.target.value)}
                        placeholder="PT1S"
                      />
                    </div>
                    <div className="form-group">
                      <label>Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        value={policy.multiplier || ''}
                        onChange={(e) => updateRetryPolicy(policy.id, 'multiplier', parseFloat(e.target.value))}
                        placeholder="2.0"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Max Delay</label>
                    <input
                      type="text"
                      value={policy.maxDelay || ''}
                      onChange={(e) => updateRetryPolicy(policy.id, 'maxDelay', e.target.value)}
                      placeholder="PT30S"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Jitter From</label>
                      <input
                        type="text"
                        value={policy.jitter?.from || ''}
                        onChange={(e) => updateRetryPolicy(policy.id, 'jitter.from', e.target.value)}
                        placeholder="PT0S"
                      />
                    </div>
                    <div className="form-group">
                      <label>Jitter To</label>
                      <input
                        type="text"
                        value={policy.jitter?.to || ''}
                        onChange={(e) => updateRetryPolicy(policy.id, 'jitter.to', e.target.value)}
                        placeholder="PT1S"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
};

export default NodePropertiesEditor;

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Settings } from 'lucide-react';
import './NodePropertiesEditor.css';

const NodePropertiesEditor = ({ node, onUpdateNodeData }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setFormData(node.data || {});
  }, [node]);

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
      try {
        const parsedArgs = JSON.parse(value);
        actions[index] = {
          ...actions[index],
          functionRef: {
            ...actions[index].functionRef,
            arguments: parsedArgs,
          },
        };
      } catch (e) {
        // Keep the string value if JSON parsing fails
        actions[index] = {
          ...actions[index],
          functionRef: {
            ...actions[index].functionRef,
            arguments: value,
          },
        };
      }
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
      try {
        const parsedRefs = JSON.parse(value);
        events[index] = { ...events[index], eventRefs: parsedRefs };
      } catch (e) {
        // Keep the string value if JSON parsing fails
        events[index] = { ...events[index], eventRefs: value };
      }
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

              <div className="form-group">
                <label>Arguments (JSON)</label>
                <textarea
                  value={
                    typeof action.functionRef?.arguments === 'string'
                      ? action.functionRef.arguments
                      : JSON.stringify(action.functionRef?.arguments || {}, null, 2)
                  }
                  onChange={(e) =>
                    handleActionChange(index, 'functionRef.arguments', e.target.value)
                  }
                  placeholder='{"key": "value"}'
                  rows="3"
                />
              </div>
            </div>
          ))}
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

              <div className="form-group">
                <label>Event References (JSON Array)</label>
                <textarea
                  value={
                    typeof event.eventRefs === 'string'
                      ? event.eventRefs
                      : JSON.stringify(event.eventRefs || [], null, 2)
                  }
                  onChange={(e) => handleEventChange(index, 'eventRefs', e.target.value)}
                  placeholder='["event_name_1", "event_name_2"]'
                  rows="2"
                />
              </div>
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

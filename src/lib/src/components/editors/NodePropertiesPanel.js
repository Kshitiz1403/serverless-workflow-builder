import React from 'react';
import { X, Save, RotateCcw, Settings } from 'lucide-react';
import './NodePropertiesPanel.css';

/**
 * A simple node properties panel component for editing node data
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the panel is open
 * @param {Object} props.node - The selected node object
 * @param {Object} props.formData - Current form data
 * @param {boolean} props.isDirty - Whether there are unsaved changes
 * @param {Function} props.onClose - Callback to close the panel
 * @param {Function} props.onFieldChange - Callback when a field changes
 * @param {Function} props.onSave - Callback to save changes
 * @param {Function} props.onReset - Callback to reset changes
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 */
export function NodePropertiesPanel({
  isOpen = false,
  node = null,
  formData = {},
  isDirty = false,
  onClose,
  onFieldChange,
  onSave,
  onReset,
  className = '',
  style = {},
  autoSave = false,
}) {
  if (!isOpen || !node) {
    return null;
  }

  const handleFieldChange = (field, value) => {
    if (onFieldChange) {
      onFieldChange(field, value);

      // When name changes, also update label to keep them in sync
      if (field === 'name') {
        onFieldChange('label', value);
      }
    }
  };

  const handleSave = () => {
    if (onSave && isDirty) {
      onSave();
    }
  };

  const handleReset = () => {
    if (onReset && isDirty) {
      onReset();
    }
  };

  const getNodeTypeLabel = (type) => {
    const labels = {
      start: 'Start Node',
      end: 'End Node',
      operation: 'Operation Node',
      switch: 'Switch Node',
      event: 'Event Node',
      sleep: 'Sleep Node',
    };
    return labels[type] || 'Unknown Node';
  };

  return (
    <div
      className={`node-properties-panel ${className}`}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '320px',
        maxHeight: '80vh',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={16} color="#6b7280" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>
            Node Properties
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          <X size={16} color="#6b7280" />
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '16px',
          flex: 1,
          overflow: 'auto',
        }}
      >
        {/* Node Type */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Node Type
          </label>
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#6b7280',
          }}>
            {getNodeTypeLabel(node.type)}
          </div>
        </div>

        {/* Node ID */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Node ID
          </label>
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#6b7280',
            fontFamily: 'monospace',
          }}>
            {node.id}
          </div>
        </div>

        {/* Node Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Name
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Enter node name"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Node-specific fields based on type */}
        {node.type === 'operation' && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Actions ({(formData.actions || []).length})
              </label>
              <button
                onClick={() => {
                  const newAction = {
                    functionRef: {
                      refName: '',
                      arguments: {}
                    },
                    retryRef: ''
                  };
                  const currentActions = formData.actions || [];
                  handleFieldChange('actions', [...currentActions, newAction]);
                }}
                className="add-btn"
              >
                <span style={{ fontSize: '14px', lineHeight: '1' }}>+</span>
                Add Action
              </button>
            </div>

            {(formData.actions || []).map((action, index) => (
              <div key={index} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#6b7280'
                  }}>
                    Action {index + 1}
                  </span>
                  <button
                    onClick={() => {
                      const newActions = formData.actions.filter((_, i) => i !== index);
                      handleFieldChange('actions', newActions);
                    }}
                    className="remove-btn"
                  >
                    <span style={{ fontSize: '12px', lineHeight: '1' }}>×</span>
                    Remove
                  </button>
                </div>

                {/* Function Reference Name */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '2px'
                  }}>
                    Function Name
                  </label>
                  <input
                    type="text"
                    value={action.functionRef?.refName || ''}
                    onChange={(e) => {
                      const newActions = [...(formData.actions || [])];
                      if (!newActions[index].functionRef) {
                        newActions[index].functionRef = {};
                      }
                      newActions[index].functionRef.refName = e.target.value;
                      handleFieldChange('actions', newActions);
                    }}
                    placeholder="Enter function name"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Arguments */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '2px'
                  }}>
                    Arguments (JSON)
                  </label>
                  <textarea
                    value={typeof action.functionRef?.arguments === 'string'
                      ? action.functionRef.arguments
                      : JSON.stringify(action.functionRef?.arguments || {}, null, 2)}
                    onChange={(e) => {
                      const newActions = [...(formData.actions || [])];
                      if (!newActions[index].functionRef) {
                        newActions[index].functionRef = {};
                      }

                      // Store as string while editing
                      newActions[index].functionRef.arguments = e.target.value;
                      handleFieldChange('actions', newActions);
                    }}
                    onBlur={(e) => {
                      // Try to parse as JSON when user finishes editing
                      try {
                        const parsedArgs = JSON.parse(e.target.value);
                        const newActions = [...(formData.actions || [])];
                        if (!newActions[index].functionRef) {
                          newActions[index].functionRef = {};
                        }
                        newActions[index].functionRef.arguments = parsedArgs;
                        handleFieldChange('actions', newActions);
                      } catch (error) {
                        // Keep as string if invalid JSON
                        console.warn('Invalid JSON in arguments field:', error.message);
                      }
                    }}
                    placeholder='{"key": "value"}'
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Retry Reference */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '2px'
                  }}>
                    Retry Reference
                  </label>
                  <input
                    type="text"
                    value={action.retryRef || ''}
                    onChange={(e) => {
                      const newActions = [...(formData.actions || [])];
                      newActions[index].retryRef = e.target.value;
                      handleFieldChange('actions', newActions);
                    }}
                    placeholder="Enter retry strategy name"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            ))}

            {(!formData.actions || formData.actions.length === 0) && (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '12px',
                border: '1px dashed #d1d5db',
                borderRadius: '6px'
              }}>
                No actions defined. Click "Add Action" to create one.
              </div>
            )}
          </div>
        )}

        {node.type === 'sleep' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Duration
            </label>
            <input
              type="text"
              value={formData.duration || ''}
              onChange={(e) => handleFieldChange('duration', e.target.value)}
              placeholder="e.g., PT30S, PT5M, PT1H"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        )}

        {node.type === 'switch' && (
          <div style={{ marginBottom: '16px' }}>


            {/* Data Conditions */}
            {(formData.conditionType || 'data') === 'data' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Data Conditions ({(formData.dataConditions || []).length})
                  </label>
                  <button
                    onClick={() => {
                      const newCondition = {
                        name: `condition${(formData.dataConditions || []).length + 1}`,
                        condition: '.data == true'
                      };
                      const currentConditions = formData.dataConditions || [];
                      handleFieldChange('dataConditions', [...currentConditions, newCondition]);
                    }}
                    className="add-btn"
                  >
                    <span style={{ fontSize: '14px', lineHeight: '1' }}>+</span>
                    Add Condition
                  </button>
                </div>

                {(formData.dataConditions || []).map((condition, index) => (
                  <div key={index} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Data Condition {index + 1}
                      </span>
                      <button
                        onClick={() => {
                          const newConditions = formData.dataConditions.filter((_, i) => i !== index);
                          handleFieldChange('dataConditions', newConditions);
                        }}
                        className="remove-btn"
                      >
                        <span style={{ fontSize: '12px', lineHeight: '1' }}>×</span>
                        Remove
                      </button>
                    </div>

                    {/* Condition Name */}
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '2px'
                      }}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={condition.name || ''}
                        onChange={(e) => {
                          const newConditions = [...(formData.dataConditions || [])];
                          newConditions[index] = { ...newConditions[index], name: e.target.value };
                          handleFieldChange('dataConditions', newConditions);
                        }}
                        placeholder="Condition name"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Condition Expression */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '2px'
                      }}>
                        Condition Expression
                      </label>
                      <input
                        type="text"
                        value={condition.condition || ''}
                        onChange={(e) => {
                          const newConditions = [...(formData.dataConditions || [])];
                          newConditions[index] = { ...newConditions[index], condition: e.target.value };
                          handleFieldChange('dataConditions', newConditions);
                        }}
                        placeholder=".data == true"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          outline: 'none'
                        }}
                      />
                      <div style={{
                        fontSize: '10px',
                        color: '#6b7280',
                        marginTop: '2px'
                      }}>
                        jq expression to evaluate condition
                      </div>
                    </div>
                  </div>
                ))}

                {(!formData.dataConditions || formData.dataConditions.length === 0) && (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '12px',
                    border: '1px dashed #d1d5db',
                    borderRadius: '6px'
                  }}>
                    No data conditions defined. Click "Add Condition" to create one.
                  </div>
                )}
              </div>
            )}

            {/* Event Conditions */}
            {(formData.conditionType || 'data') === 'event' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Event Conditions ({(formData.eventConditions || []).length})
                  </label>
                  <button
                    onClick={() => {
                      const newCondition = {
                        name: `eventCondition${(formData.eventConditions || []).length + 1}`,
                        eventRef: 'event1'
                      };
                      const currentConditions = formData.eventConditions || [];
                      handleFieldChange('eventConditions', [...currentConditions, newCondition]);
                    }}
                    className="add-btn"
                  >
                    <span style={{ fontSize: '14px', lineHeight: '1' }}>+</span>
                    Add Event Condition
                  </button>
                </div>

                {(formData.eventConditions || []).map((condition, index) => (
                  <div key={index} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#f9fafb'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Event Condition {index + 1}
                      </span>
                      <button
                        onClick={() => {
                          const newConditions = formData.eventConditions.filter((_, i) => i !== index);
                          handleFieldChange('eventConditions', newConditions);
                        }}
                        className="remove-btn"
                      >
                        <span style={{ fontSize: '12px', lineHeight: '1' }}>×</span>
                        Remove
                      </button>
                    </div>

                    {/* Condition Name */}
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '2px'
                      }}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={condition.name || ''}
                        onChange={(e) => {
                          const newConditions = [...(formData.eventConditions || [])];
                          newConditions[index] = { ...newConditions[index], name: e.target.value };
                          handleFieldChange('eventConditions', newConditions);
                        }}
                        placeholder="Event condition name"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Event Reference */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '2px'
                      }}>
                        Event Reference
                      </label>
                      <input
                        type="text"
                        value={condition.eventRef || ''}
                        onChange={(e) => {
                          const newConditions = [...(formData.eventConditions || [])];
                          newConditions[index] = { ...newConditions[index], eventRef: e.target.value };
                          handleFieldChange('eventConditions', newConditions);
                        }}
                        placeholder="event1"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <div style={{
                        fontSize: '10px',
                        color: '#6b7280',
                        marginTop: '2px'
                      }}>
                        Reference to an event defined in the workflow
                      </div>
                    </div>
                  </div>
                ))}

                {(!formData.eventConditions || formData.eventConditions.length === 0) && (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '12px',
                    border: '1px dashed #d1d5db',
                    borderRadius: '6px'
                  }}>
                    No event conditions defined. Click "Add Event Condition" to create one.
                  </div>
                )}
              </div>
            )}

            {/* Default Condition - Always Enabled */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                padding: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '6px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#0ea5e9',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>✓</span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#0369a1'
                  }}>
                    Default Condition Enabled
                  </span>
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#0369a1',
                  marginLeft: '24px'
                }}>
                  Provides a fallback path when no {(formData.conditionType || 'data') === 'event' ? 'events' : 'data conditions'} match
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Footer with action buttons (only show if not auto-save) */}
      {!autoSave && (
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={handleReset}
            disabled={!isDirty}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: isDirty ? '#374151' : '#9ca3af',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: isDirty ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (isDirty) {
                e.target.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            style={{
              padding: '8px 12px',
              border: '1px solid #3b82f6',
              backgroundColor: isDirty ? '#3b82f6' : '#e5e7eb',
              color: isDirty ? 'white' : '#9ca3af',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: isDirty ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (isDirty) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (isDirty) {
                e.target.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            <Save size={12} />
            Save
          </button>
        </div>
      )}

      {/* Dirty indicator */}
      {isDirty && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '40px',
            width: '8px',
            height: '8px',
            backgroundColor: '#f59e0b',
            borderRadius: '50%',
            border: '2px solid white',
          }}
        />
      )}
    </div>
  );
}

export default NodePropertiesPanel;
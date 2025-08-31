import React from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch, Tag } from 'lucide-react';
import '../../styles/NodeStyles.css';

const SwitchNode = ({ data, selected }) => {
  const dataConditions = data.dataConditions || [];
  const eventConditions = data.eventConditions || [];
  const conditions = dataConditions.length > 0 ? dataConditions : eventConditions;
  const conditionType = dataConditions.length > 0 ? 'data' : 'event';
  const hasDefault = data.defaultCondition;
  const totalHandles = conditions.length + (hasDefault ? 1 : 0);
  const hasMetadata = data.metadata && Object.keys(data.metadata).length > 0;

  return (
    <div className={`custom-node switch-node switch-node-${conditionType} ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />

      <div className="node-header">
        <GitBranch size={16} />
        <span className="node-title">{data.label || 'Switch'}</span>
        {hasMetadata && <Tag size={12} className="metadata-indicator" />}
      </div>

      <div className="node-content">
        <div className="node-field">
          <strong>Name:</strong> {data.name || 'unnamed'}
        </div>
        <div className="node-field">
          <strong>Type:</strong> {conditionType === 'data' ? 'Data Conditions' : 'Event Conditions'}
        </div>
        {conditions.length > 0 && (
          <div className="node-field">
            <strong>Conditions:</strong> {conditions.length}
          </div>
        )}
        <div className="node-field">
          <strong>Default:</strong> {hasDefault ? 'Yes' : 'No'}
        </div>
        {conditionType === 'event' && data.timeouts && data.timeouts.eventTimeout && (
          <div className="node-field">
            <strong>Timeout:</strong> {data.timeouts.eventTimeout}
          </div>
        )}
        {hasMetadata && (
          <div className="node-field metadata-preview">
            <strong>Metadata:</strong>
            <div className="metadata-tags">
              {Object.entries(data.metadata).slice(0, 2).map(([key, value]) => (
                <span key={key} className="metadata-tag">
                  {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                </span>
              ))}
              {Object.keys(data.metadata).length > 2 && (
                <span className="metadata-tag more">
                  +{Object.keys(data.metadata).length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Render condition handles with labels */}
        <div className="switch-outputs">
          {conditions.map((condition, index) => (
            <div key={`condition-${index}`} className="switch-output-item">
              <span className="output-label">
                {condition.name || condition.eventRef || condition.condition || `condition${index + 1}`}
                {condition.metadata && Object.keys(condition.metadata).length > 0 && (
                  <Tag size={10} className="condition-metadata-indicator" />
                )}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={`condition-${index}`}
                className={`${conditionType}-condition-handle-dot`}
                style={{
                  position: 'relative',
                  right: '-10px',
                  top: 'auto',
                  transform: 'none',
                  background: conditionType === 'data' ? '#f59e0b' : '#8b5cf6',
                  border: `2px solid ${conditionType === 'data' ? '#d97706' : '#7c3aed'}`,
                }}
              />
            </div>
          ))}

          {/* Default handle */}
          {hasDefault && (
            <div className="switch-output-item">
              <span className="output-label">default</span>
              <Handle
                type="source"
                position={Position.Right}
                id="default"
                className="default-handle-dot"
                style={{
                  position: 'relative',
                  right: '-10px',
                  top: 'auto',
                  transform: 'none',
                  background: '#6b7280',
                  border: '2px solid #4b5563',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwitchNode;
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, Tag } from 'lucide-react';
import '../../styles/NodeStyles.css';

const EventNode = ({ data, selected }) => {
  const hasMetadata = data.metadata && Object.keys(data.metadata).length > 0;

  return (
    <div className={`custom-node event-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />

      <div className="node-header">
        <Zap size={16} />
        <span className="node-title">{data.label || 'Event'}</span>
        {hasMetadata && <Tag size={12} className="metadata-indicator" />}
      </div>

      <div className="node-content">
        <div className="node-field">
          <strong>Name:</strong> {data.name || 'unnamed'}
        </div>
        {data.events && data.events.length > 0 && (
          <div className="node-field">
            <strong>Events:</strong> {data.events.length}
          </div>
        )}
        {data.timeouts && data.timeouts.eventTimeout && (
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
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default EventNode;
import React from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { Play, Tag } from 'lucide-react';
import './NodeStyles.css';

const OperationNode = ({ data, selected }) => {
  const hasMetadata = data.metadata && Object.keys(data.metadata).length > 0;

  return (
    <div className={`custom-node operation-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />

      <div className="node-header">
        <Play size={16} />
        <span className="node-title">{data.label || 'Operation'}</span>
        {hasMetadata && <Tag size={12} className="metadata-indicator" />}
      </div>

      <div className="node-content">
        <div className="node-field">
          <strong>Name:</strong> {data.name || 'unnamed'}
        </div>
        {data.actions && data.actions.length > 0 && (
          <div className="node-field">
            <strong>Actions:</strong> {data.actions.length}
          </div>
        )}
        {data.onErrors && data.onErrors.length > 0 && (
          <div className="node-field">
            <strong>Error Handlers:</strong> {data.onErrors.length}
          </div>
        )}
        {hasMetadata && (
          <div className="node-field metadata-preview">
            <strong>Metadata:</strong>
            <div className="metadata-tags">
              {Object.entries(data.metadata).slice(0, 2).map(([key, value]) => (
                <span key={key} className="metadata-tag">
                  {key}: {value}
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

      {/* Error handles on the right side */}
      {data.onErrors && data.onErrors.map((errorHandler, index) => (
        <Handle
          key={`error-${index}`}
          type="source"
          position={Position.Right}
          id={`error-${index}`}
          style={{
            top: `${30 + (index * 20)}%`,
            background: 'rgba(239, 68, 68, 0.6)',
            borderColor: 'rgba(239, 68, 68, 0.6)',
          }}
          title={`Error: ${errorHandler.errorRef || 'error'}`}
        />
      ))}
    </div>
  );
};

export default OperationNode;

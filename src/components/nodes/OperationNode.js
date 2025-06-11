import React from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { Play } from 'lucide-react';
import './NodeStyles.css';

const OperationNode = ({ data, selected }) => {
  return (
    <div className={`custom-node operation-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />

      <div className="node-header">
        <Play size={16} />
        <span className="node-title">{data.label || 'Operation'}</span>
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
      </div>

      <Handle type="source" position={Position.Bottom} />

      {/* Error handles on the right side */}
      {data.onErrors && data.onErrors.map((errorHandler, index) => {
        // Skip error handlers without IDs to avoid rendering issues
        if (!errorHandler.id) {
          console.warn('Error handler without ID found:', errorHandler);
          return null;
        }

        return (
          <Handle
            key={`error-${errorHandler.id}-${index}`}
            type="source"
            position={Position.Right}
            id={errorHandler.id}
            style={{
              top: `${30 + (index * 20)}%`,
              background: 'rgba(239, 68, 68, 0.6)',
              borderColor: 'rgba(239, 68, 68, 0.6)',
              width: '10px',
              height: '10px',
            }}
            title={`Error: ${errorHandler.errorRef || 'error'}`}
          />
        );
      })}
    </div>
  );
};

export default OperationNode;

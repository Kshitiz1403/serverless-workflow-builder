import React from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { Play, Tag, Info } from 'lucide-react';
import '../../styles/NodeStyles.css';

const OperationNode = ({ data, selected }) => {
  const hasMetadata = data.metadata && Object.keys(data.metadata).length > 0;
  const hasOperationMetadata = data.operationMetadata;
  const isDynamicOperation = data.operationId;

  return (
    <div className={`custom-node operation-node ${selected ? 'selected' : ''} ${isDynamicOperation ? 'dynamic-operation' : ''}`}>
      <Handle type="target" position={Position.Top} />

      <div className="node-header">
        <Play size={16} />
        <span className="node-title">{data.label || 'Operation'}</span>
        {hasMetadata && <Tag size={12} className="metadata-indicator" />}
        {isDynamicOperation && <Info size={12} className="dynamic-indicator" title="Dynamic Operation" />}
      </div>

      <div className="node-content">
        <div className="node-field">
          <strong>Name:</strong> {data.name || 'unnamed'}
        </div>

        {/* Show operation metadata for dynamic operations */}
        {hasOperationMetadata && (
          <>
            {data.operationMetadata.category && (
              <div className="node-field">
                <strong>Category:</strong> {data.operationMetadata.category}
              </div>
            )}
            {data.operationMetadata.version && (
              <div className="node-field">
                <strong>Version:</strong> v{data.operationMetadata.version}
              </div>
            )}
            {data.operationMetadata.tags && data.operationMetadata.tags.length > 0 && (
              <div className="node-field operation-tags-preview">
                <strong>Tags:</strong>
                <div className="operation-tags">
                  {data.operationMetadata.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="operation-tag">
                      {tag}
                    </span>
                  ))}
                  {data.operationMetadata.tags.length > 2 && (
                    <span className="operation-tag more">
                      +{data.operationMetadata.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {data.actions && data.actions.length > 0 && (
          <div className="node-field">
            <strong>Actions:</strong> {data.actions.length}
            {isDynamicOperation && data.actions.length > 0 && (
              <div className="action-preview">
                {data.actions[0].functionRef?.refName || 'Unknown function'}
              </div>
            )}
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
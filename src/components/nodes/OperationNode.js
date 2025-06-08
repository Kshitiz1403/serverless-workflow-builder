import React from 'react';
import { Handle, Position } from 'reactflow';
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
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default OperationNode;

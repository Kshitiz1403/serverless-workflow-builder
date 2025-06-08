import React from 'react';
import { Handle, Position } from 'reactflow';
import { PlayCircle } from 'lucide-react';
import './NodeStyles.css';

const StartNode = ({ data, selected }) => {
  return (
    <div className={`custom-node start-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <PlayCircle size={16} />
        <span className="node-title">{data.label || 'Start'}</span>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default StartNode;

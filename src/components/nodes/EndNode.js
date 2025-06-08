import React from 'react';
import { Handle, Position } from 'reactflow';
import { StopCircle } from 'lucide-react';
import './NodeStyles.css';

const EndNode = ({ data, selected }) => {
 return (
  <div className={`custom-node end-node ${selected ? 'selected' : ''}`}>
   <Handle type="target" position={Position.Top} />

   <div className="node-header">
    <StopCircle size={16} />
    <span className="node-title">{data.label || 'End'}</span>
   </div>
  </div>
 );
};

export default EndNode; 
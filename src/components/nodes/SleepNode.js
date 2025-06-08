import React from 'react';
import { Handle, Position } from 'reactflow';
import { Clock } from 'lucide-react';
import './NodeStyles.css';

const SleepNode = ({ data, selected }) => {
 return (
  <div className={`custom-node sleep-node ${selected ? 'selected' : ''}`}>
   <Handle type="target" position={Position.Top} />

   <div className="node-header">
    <Clock size={16} />
    <span className="node-title">{data.label || 'Sleep'}</span>
   </div>

   <div className="node-content">
    <div className="node-field">
     <strong>Name:</strong> {data.name || 'unnamed'}
    </div>
    {data.duration && (
     <div className="node-field">
      <strong>Duration:</strong> {data.duration}
     </div>
    )}
   </div>

   <Handle type="source" position={Position.Bottom} />
  </div>
 );
};

export default SleepNode; 
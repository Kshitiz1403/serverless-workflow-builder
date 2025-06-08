import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';
import './NodeStyles.css';

const EventNode = ({ data, selected }) => {
 return (
  <div className={`custom-node event-node ${selected ? 'selected' : ''}`}>
   <Handle type="target" position={Position.Top} />

   <div className="node-header">
    <Zap size={16} />
    <span className="node-title">{data.label || 'Event'}</span>
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
    {data.timeouts && (
     <div className="node-field">
      <strong>Timeout:</strong> Yes
     </div>
    )}
   </div>

   <Handle type="source" position={Position.Bottom} />
  </div>
 );
};

export default EventNode; 
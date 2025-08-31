import React from 'react';
import { Handle, Position } from 'reactflow';
import { Moon, Tag } from 'lucide-react';
import '../../styles/NodeStyles.css';

const SleepNode = ({ data, selected }) => {
 const hasMetadata = data.metadata && Object.keys(data.metadata).length > 0;

 return (
  <div className={`custom-node sleep-node ${selected ? 'selected' : ''}`}>
   <Handle type="target" position={Position.Top} />

   <div className="node-header">
    <Moon size={16} />
    <span className="node-title">{data.label || 'Sleep'}</span>
    {hasMetadata && <Tag size={12} className="metadata-indicator" />}
   </div>

   <div className="node-content">
    <div className="node-field">
     <strong>Name:</strong> {data.name || 'unnamed'}
    </div>
    <div className="node-field">
     <strong>Duration:</strong> {data.duration || 'PT30M'}
    </div>
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

export default SleepNode;
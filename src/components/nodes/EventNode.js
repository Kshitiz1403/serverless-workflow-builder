import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';
import './NodeStyles.css';

const EventNode = ({ data, selected, zoom = 1 }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const shouldShowDetails = zoom > 1.5 && isHovered;
  return (
    <div
      className={`custom-node event-node ${selected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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

        {/* Show detailed event info when highly zoomed AND hovered */}
        {shouldShowDetails && data.events && data.events.map((event, index) => (
          <div key={index} className="detailed-action">
            <div className="action-name">• Event {index + 1}</div>
            {event.eventRefs && (
              <div className="event-refs">
                <code>{JSON.stringify(event.eventRefs)}</code>
              </div>
            )}
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default EventNode;

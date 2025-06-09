import React from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { Play } from 'lucide-react';
import './NodeStyles.css';

const OperationNode = ({ data, selected, zoom = 1 }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const shouldShowDetails = zoom > 1.5 && isHovered; // Show details only when zoomed AND hovered

  // Use React Flow's useReactFlow hook to manipulate node z-index
  const { setNodes } = useReactFlow();

  React.useEffect(() => {
    if (shouldShowDetails) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.data === data) {
            return { ...node, style: { ...node.style, zIndex: 9999 } };
          }
          return node;
        })
      );
    } else {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.data === data) {
            return { ...node, style: { ...node.style, zIndex: 1 } };
          }
          return node;
        })
      );
    }
  }, [shouldShowDetails, setNodes, data]);

  return (
    <div
      className={`custom-node operation-node ${selected ? 'selected' : ''} ${shouldShowDetails ? 'showing-details' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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

        {/* Show detailed action info when highly zoomed AND hovered */}
        {shouldShowDetails && data.actions && data.actions.map((action, index) => (
          <div key={index} className="detailed-action">
            <div className="action-name">• {action.name}</div>
            <div className="action-function">{action.functionRef?.refName || 'No function'}</div>
            {action.functionRef?.arguments && Object.keys(action.functionRef.arguments).length > 0 && (
              <div className="action-args">
                <code>{JSON.stringify(action.functionRef.arguments)}</code>
              </div>
            )}
            {action.retryRef && (
              <div className="action-retry">🔄 Retry enabled</div>
            )}
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default OperationNode;

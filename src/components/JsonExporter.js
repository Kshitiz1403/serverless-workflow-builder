import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Copy, Download } from 'lucide-react';
import './JsonExporter.css';

const JsonExporter = ({ nodes, edges, workflowMetadata, onClose }) => {
  const [workflowInfo, setWorkflowInfo] = useState({
    id: 'my-workflow',
    version: '1.0',
    name: 'My Workflow',
    description: 'Generated serverless workflow',
  });
  const modalRef = useRef(null);

  const serverlessWorkflow = useMemo(() => {
    // Find the start node and its first connected state
    const startNode = nodes.find((node) => node.type === 'start');
    let startStateName = 'start';

    if (startNode) {
      const startEdge = edges.find((edge) => edge.source === startNode.id);
      if (startEdge) {
        const firstState = nodes.find((node) => node.id === startEdge.target);
        if (firstState && firstState.type !== 'end') {
          startStateName = getNodeStateName(firstState);
        }
      }
    }

    // Convert nodes to states, excluding start nodes as they're not states
    const states = nodes
      .filter((node) => node.type !== 'start')
      .map((node) => convertNodeToState(node, edges, nodes, workflowMetadata));

    // Build the complete serverless workflow
    const workflow = {
      id: workflowInfo.id,
      version: workflowInfo.version,
      name: workflowInfo.name,
      description: workflowInfo.description,
      start: startStateName,
      states: states.filter((state) => state !== null),
    };

    // Add retry policies if they exist
    if (workflowMetadata?.retryPolicies && workflowMetadata.retryPolicies.length > 0) {
      workflow.retryPolicies = workflowMetadata.retryPolicies.map(policy => {
        // Convert policy to Serverless Workflow format (exclude internal ID)
        const { id, ...exportPolicy } = policy;
        return exportPolicy;
      });
    }

    return workflow;
  }, [nodes, edges, workflowInfo]);

  const jsonString = JSON.stringify(serverlessWorkflow, null, 2);

  // Handle escape key and outside click
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      alert('JSON copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowInfo.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="json-exporter-overlay">
      <div className="json-exporter" ref={modalRef}>
        <div className="exporter-header">
          <h2>Export Serverless Workflow</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="workflow-info">
          <div className="info-grid">
            <div className="form-group">
              <label>Workflow ID</label>
              <input
                type="text"
                value={workflowInfo.id}
                onChange={(e) => setWorkflowInfo({ ...workflowInfo, id: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Version</label>
              <input
                type="text"
                value={workflowInfo.version}
                onChange={(e) => setWorkflowInfo({ ...workflowInfo, version: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={workflowInfo.name}
                onChange={(e) => setWorkflowInfo({ ...workflowInfo, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={workflowInfo.description}
                onChange={(e) => setWorkflowInfo({ ...workflowInfo, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="json-output">
          <div className="output-header">
            <h3>Generated JSON</h3>
            <div className="output-actions">
              <button className="copy-btn" onClick={handleCopy}>
                <Copy size={16} />
                Copy
              </button>
              <button className="download-btn" onClick={handleDownload}>
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
          <pre className="json-content">{jsonString}</pre>
        </div>
      </div>
    </div>
  );
};

function getNodeStateName(node) {
  return node.data.name || node.id.replace(/-\d+$/, '');
}

function convertNodeToState(node, edges, allNodes, workflowMetadata) {
  const stateName = getNodeStateName(node);

  // Find outgoing edges from this node
  const outgoingEdges = edges.filter((edge) => edge.source === node.id);

  switch (node.type) {
    case 'operation':
      const isOperationEnd =
        outgoingEdges.length === 0 || hasEndNodeTarget(outgoingEdges, allNodes);
      const operationState = {
        name: stateName,
        type: 'operation',
        actions: node.data.actions || [],
      };

      // Add retry policy reference if one exists
      if (node.data.retryRef && workflowMetadata?.retryPolicies) {
        const retryPolicy = workflowMetadata.retryPolicies.find(policy => policy.id === node.data.retryRef);
        if (retryPolicy) {
          operationState.retryRef = retryPolicy.name;
        }
      }

      if (isOperationEnd) {
        operationState.end = true;
      } else {
        operationState.transition = getTransition(node, outgoingEdges, allNodes);
      }

      return operationState;

    case 'event':
      const isEventEnd = outgoingEdges.length === 0 || hasEndNodeTarget(outgoingEdges, allNodes);
      const eventState = {
        name: stateName,
        type: 'event',
        onEvents: node.data.events || [],
        timeouts: node.data.timeouts || {},
      };

      if (isEventEnd) {
        eventState.end = true;
      } else {
        eventState.transition = getTransition(node, outgoingEdges, allNodes);
      }

      return eventState;

    case 'switch':
      const switchState = {
        name: stateName,
        type: 'switch',
        defaultCondition: node.data.defaultCondition || { transition: { nextState: '' } },
      };

      // Determine condition type and handle accordingly
      const conditionType = node.data.conditionType || 'data';
      const dataConditions = node.data.dataConditions || [];
      const eventConditions = node.data.eventConditions || [];
      const conditions = conditionType === 'data' ? dataConditions : eventConditions;

      if (conditionType === 'data') {
        switchState.dataConditions = [];
        conditions.forEach((condition, index) => {
          const conditionEdge = outgoingEdges.find(
            (edge) => edge.sourceHandle === `condition-${index}`
          );

          const conditionData = { ...condition };

          if (conditionEdge) {
            const targetNode = allNodes.find((n) => n.id === conditionEdge.target);
            if (targetNode && targetNode.type === 'end') {
              conditionData.end = true;
              // Remove transition property when ending
              delete conditionData.transition;
            } else {
              conditionData.transition = {
                nextState: getTargetStateName(conditionEdge.target, allNodes),
              };
            }
          } else {
            // No edge found, use existing transition if available
            const nextState = condition.transition?.nextState || '';
            if (nextState) {
              conditionData.transition = { nextState };
            }
          }

          switchState.dataConditions.push(conditionData);
        });
      } else {
        switchState.eventConditions = [];
        conditions.forEach((condition, index) => {
          const conditionEdge = outgoingEdges.find(
            (edge) => edge.sourceHandle === `condition-${index}`
          );

          const conditionData = { ...condition };

          if (conditionEdge) {
            const targetNode = allNodes.find((n) => n.id === conditionEdge.target);
            if (targetNode && targetNode.type === 'end') {
              conditionData.end = true;
              // Remove transition property when ending
              delete conditionData.transition;
            } else {
              conditionData.transition = {
                nextState: getTargetStateName(conditionEdge.target, allNodes),
              };
            }
          } else {
            // No edge found, use existing transition if available
            const nextState = condition.transition?.nextState || '';
            if (nextState) {
              conditionData.transition = { nextState };
            }
          }

          switchState.eventConditions.push(conditionData);
        });
      }

      // Handle default condition
      const defaultEdge = outgoingEdges.find((edge) => edge.sourceHandle === 'default');
      if (defaultEdge) {
        const targetNode = allNodes.find((n) => n.id === defaultEdge.target);
        if (targetNode && targetNode.type === 'end') {
          switchState.defaultCondition = { end: true };
        } else {
          switchState.defaultCondition = {
            transition: { nextState: getTargetStateName(defaultEdge.target, allNodes) },
          };
        }
      }

      return switchState;

    case 'end':
      return null; // End nodes don't become states, they're handled by the end property

    default:
      return null;
  }
}

function getTransition(node, outgoingEdges, allNodes) {
  if (outgoingEdges.length === 0) {
    return undefined;
  }

  const targetNodeId = outgoingEdges[0].target;
  const targetNode = allNodes.find((n) => n.id === targetNodeId);

  if (targetNode && targetNode.type === 'end') {
    return undefined; // No transition needed for end nodes
  }

  return {
    nextState: getTargetStateName(targetNodeId, allNodes),
  };
}

function getTargetStateName(targetNodeId, allNodes) {
  const targetNode = allNodes.find((n) => n.id === targetNodeId);
  if (targetNode && targetNode.type === 'end') {
    return ''; // End nodes don't have state names
  }
  return targetNode ? getNodeStateName(targetNode) : targetNodeId.replace(/-\d+$/, '');
}

function hasEndNodeTarget(outgoingEdges, allNodes) {
  return outgoingEdges.some((edge) => {
    const targetNode = allNodes.find((n) => n.id === edge.target);
    return targetNode && targetNode.type === 'end';
  });
}

export default JsonExporter;

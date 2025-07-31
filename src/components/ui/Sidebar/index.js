import React, { useState, useEffect } from 'react';
import {
  Play,
  GitBranch,
  PlayCircle,
  StopCircle,
  Download,
  Upload,
  Trash2,
  Plus,
  Save,
  Zap,
  Clock,
  Undo,
  Redo,
  GripVertical,
  Settings,
} from 'lucide-react';
import NodePropertiesEditor from '../../editors/NodePropertiesEditor';
import WorkflowPropertiesEditor from '../../editors/WorkflowPropertiesEditor';
import OperationsPalette from '../../import-export/OperationsPalette';
import ApiSettings from '../../editors/ApiSettings';
import './Sidebar.css';

const Sidebar = ({
  onAddNode,
  selectedNode,
  selectedNodes,
  onUpdateNodeData,
  onDeleteNode,
  onDeleteSelectedNodes,
  onExportJson,
  onImportJson,
  onClearWorkflow,
  getSavedTimestamp,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  workflowMetadata,
  onUpdateWorkflowMetadata,
  onSaveProject,
  hasUnsavedChanges,
}) => {
  const [activeTab, setActiveTab] = useState('palette');
  const [activePaletteTab, setActivePaletteTab] = useState('basic');
  const [lastSaved, setLastSaved] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebar-width');
    return savedWidth ? parseInt(savedWidth, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);

  useEffect(() => {
    const timestamp = getSavedTimestamp();
    setLastSaved(timestamp);
  }, [getSavedTimestamp]);

  useEffect(() => {
    const interval = setInterval(() => {
      const timestamp = getSavedTimestamp();
      setLastSaved(timestamp);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [getSavedTimestamp]);

  // Save sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-width', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Handle mouse resize functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      // Constrain width between 250px and 80% of screen width
      const maxWidth = Math.floor(window.innerWidth * 0.8);
      const constrainedWidth = Math.max(250, Math.min(maxWidth, newWidth));
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const nodeTypes = [
    {
      type: 'operation',
      label: 'Operation',
      icon: Play,
      description: 'Execute actions or functions',
    },
    {
      type: 'switch',
      label: 'Switch',
      icon: GitBranch,
      description: 'Conditional branching',
    },
    {
      type: 'event',
      label: 'Event',
      icon: Zap,
      description: 'Wait for events with timeout',
    },
    {
      type: 'sleep',
      label: 'Sleep',
      icon: Clock,
      description: 'Pause workflow for specified duration',
    },
    {
      type: 'start',
      label: 'Start',
      icon: PlayCircle,
      description: 'Workflow entry point',
    },
    {
      type: 'end',
      label: 'End',
      icon: StopCircle,
      description: 'Workflow termination',
    },
  ];

  const handleDragStart = (event, nodeType, operationData = null) => {
    if (operationData) {
      // For dynamic operations, pass the operation data
      event.dataTransfer.setData('application/reactflow', JSON.stringify({
        type: 'operation',
        operationData
      }));
    } else {
      // For basic node types
      event.dataTransfer.setData('application/reactflow', nodeType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleAddNode = (nodeType, operationData = null) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };
    onAddNode(nodeType, position, operationData);
  };

  return (
    <div
      className={`sidebar ${isResizing ? 'resizing' : ''}`}
      style={{ width: `${sidebarWidth}px` }}
    >
      <div
        className="resize-handle"
        onMouseDown={handleResizeStart}
        title="Drag to resize sidebar"
      >
        <div className="resize-indicator">
          <GripVertical size={12} />
        </div>
      </div>
      <div className="sidebar-header">
        <div className="sidebar-tabs">
          <button
            className={`tab ${activeTab === 'palette' ? 'active' : ''}`}
            onClick={() => setActiveTab('palette')}
          >
            Palette
          </button>
          <button
            className={`tab ${activeTab === 'workflow' ? 'active' : ''}`}
            onClick={() => setActiveTab('workflow')}
          >
            Workflow
          </button>
          <button
            className={`tab ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
            disabled={!selectedNode && (!selectedNodes || selectedNodes.length === 0)}
          >
            Properties
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        {activeTab === 'palette' && (
          <div className="node-palette">
            <div className="palette-tabs">
              <button
                className={`palette-tab ${activePaletteTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActivePaletteTab('basic')}
              >
                Basic Nodes
              </button>
              <button
                className={`palette-tab ${activePaletteTab === 'operations' ? 'active' : ''}`}
                onClick={() => setActivePaletteTab('operations')}
              >
                Operations
              </button>
            </div>

            {activePaletteTab === 'basic' && (
              <div className="basic-nodes">
                <h3>Node Types</h3>
                <div className="node-types">
                  {nodeTypes.map((nodeType) => {
                    const IconComponent = nodeType.icon;
                    return (
                      <div
                        key={nodeType.type}
                        className="node-type-item"
                        draggable
                        onDragStart={(e) => handleDragStart(e, nodeType.type)}
                        onClick={() => handleAddNode(nodeType.type)}
                      >
                        <div className="node-type-header">
                          <IconComponent size={16} />
                          <span>{nodeType.label}</span>
                          <Plus size={14} className="add-icon" />
                        </div>
                        <p className="node-type-description">{nodeType.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activePaletteTab === 'operations' && (
              <OperationsPalette
                onDragStart={handleDragStart}
                onAddNode={(operationData) => handleAddNode('operation', operationData)}
              />
            )}
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="workflow-properties">
            <h3>Workflow Settings</h3>
            <WorkflowPropertiesEditor
              workflowMetadata={workflowMetadata}
              onUpdateWorkflowMetadata={onUpdateWorkflowMetadata}
            />
          </div>
        )}

        {activeTab === 'properties' && selectedNode && (
          <div className="node-properties">
            <div className="properties-header">
              <h3>Node Properties</h3>
              <button
                className="delete-btn"
                onClick={() => onDeleteNode(selectedNode.id)}
                title="Delete Node"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <NodePropertiesEditor
              node={selectedNode}
              onUpdateNodeData={onUpdateNodeData}
              workflowMetadata={workflowMetadata}
              onUpdateWorkflowMetadata={onUpdateWorkflowMetadata}
            />
          </div>
        )}

        {activeTab === 'properties' && !selectedNode && selectedNodes && selectedNodes.length > 1 && (
          <div className="multi-selection">
            <div className="properties-header">
              <h3>Multiple Nodes Selected</h3>
              <button
                className="delete-btn"
                onClick={onDeleteSelectedNodes}
                title="Delete Selected Nodes"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="multi-selection-info">
              <p>{selectedNodes.length} nodes selected</p>
              <div className="selected-nodes-list">
                {selectedNodes.map((node) => (
                  <div key={node.id} className="selected-node-item">
                    <span className="node-type">{node.type}</span>
                    <span className="node-label">{node.data.label || node.data.name || node.id}</span>
                  </div>
                ))}
              </div>
              <div className="multi-selection-actions">
                <p className="help-text">
                  Press <kbd>Delete</kbd> or <kbd>Backspace</kbd> to delete selected nodes
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'properties' && !selectedNode && (!selectedNodes || selectedNodes.length === 0) && (
          <div className="no-selection">
            <p>Select a node to edit its properties</p>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        {lastSaved && (
          <div className="save-status">
            <Save size={14} />
            <span>Saved {formatTimestamp(lastSaved)}</span>
          </div>
        )}

        <div className="footer-actions">
          <div className="save-action">
            <button
              className="save-project-btn"
              onClick={onSaveProject}
              disabled={!hasUnsavedChanges}
              title={hasUnsavedChanges ? "Save project changes (Ctrl+S)" : "No changes to save"}
            >
              <Save size={16} />
              Save Project
            </button>
          </div>

          <div className="undo-redo-actions">
            <button
              className="undo-btn"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} />
              Undo
            </button>
            <button
              className="redo-btn"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo size={16} />
              Redo
            </button>
          </div>

          <div className="json-actions">
            <button className="import-btn" onClick={onImportJson}>
              <Upload size={16} />
              Import JSON
            </button>

            <button className="export-btn" onClick={onExportJson}>
              <Download size={16} />
              Export JSON
            </button>
          </div>

          <div className="settings-actions">
            <button
              className="settings-btn"
              onClick={() => setShowApiSettings(true)}
              title="API Configuration"
            >
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>
      </div>

      <ApiSettings
        isOpen={showApiSettings}
        onClose={() => setShowApiSettings(false)}
      />
    </div>
  );
};

export default Sidebar;

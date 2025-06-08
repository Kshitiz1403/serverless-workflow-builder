import React, { useState, useEffect } from 'react';
import { Play, GitBranch, PlayCircle, StopCircle, Download, Upload, Trash2, Plus, RefreshCw, Save, Zap } from 'lucide-react';
import NodePropertiesEditor from './NodePropertiesEditor';
import './Sidebar.css';

const Sidebar = ({
 onAddNode,
 selectedNode,
 onUpdateNodeData,
 onDeleteNode,
 onExportJson,
 onImportJson,
 onClearWorkflow,
 getSavedTimestamp
}) => {
 const [activeTab, setActiveTab] = useState('palette');
 const [lastSaved, setLastSaved] = useState(null);

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

 const handleClearWorkflow = () => {
  if (window.confirm('Are you sure you want to create a new workflow? This will clear all current work.')) {
   onClearWorkflow();
   setLastSaved(null);
  }
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
   description: 'Execute actions or functions'
  },
  {
   type: 'switch',
   label: 'Switch',
   icon: GitBranch,
   description: 'Conditional branching'
  },
  {
   type: 'event',
   label: 'Event',
   icon: Zap,
   description: 'Wait for events with timeout'
  },
  {
   type: 'start',
   label: 'Start',
   icon: PlayCircle,
   description: 'Workflow entry point'
  },
  {
   type: 'end',
   label: 'End',
   icon: StopCircle,
   description: 'Workflow termination'
  }
 ];

 const handleDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
 };

 const handleAddNode = (nodeType) => {
  const position = {
   x: Math.random() * 400 + 100,
   y: Math.random() * 300 + 100
  };
  onAddNode(nodeType, position);
 };

 return (
  <div className="sidebar">
   <div className="sidebar-header">
    <div className="sidebar-tabs">
     <button
      className={`tab ${activeTab === 'palette' ? 'active' : ''}`}
      onClick={() => setActiveTab('palette')}
     >
      Palette
     </button>
     <button
      className={`tab ${activeTab === 'properties' ? 'active' : ''}`}
      onClick={() => setActiveTab('properties')}
      disabled={!selectedNode}
     >
      Properties
     </button>
    </div>
   </div>

   <div className="sidebar-content">
    {activeTab === 'palette' && (
     <div className="node-palette">
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
      />
     </div>
    )}

    {activeTab === 'properties' && !selectedNode && (
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
     <button className="new-workflow-btn" onClick={handleClearWorkflow}>
      <RefreshCw size={16} />
      New Workflow
     </button>

     <button className="import-btn" onClick={onImportJson}>
      <Upload size={16} />
      Import JSON
     </button>

     <button className="export-btn" onClick={onExportJson}>
      <Download size={16} />
      Export JSON
     </button>
    </div>
   </div>
  </div>
 );
};

export default Sidebar; 
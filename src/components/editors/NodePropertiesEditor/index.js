import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CommonNodeEditor from './CommonNodeEditor';
import OperationEditor from './OperationEditor';
import SwitchEditor from './SwitchEditor';
import EventEditor from './EventEditor';
import SleepEditor from './SleepEditor';
import JsonEditorModal from '../../ui/modals/JsonEditorModal';
import './NodePropertiesEditor.css';

const NodePropertiesEditor = ({ node, onUpdateNodeData, workflowMetadata, onUpdateWorkflowMetadata }) => {
 const [formData, setFormData] = useState({});
 const [modalState, setModalState] = useState({ isOpen: false, value: null, onChange: null, title: '', label: '' });

 useEffect(() => {
  const nodeData = node.data || {};

  // Convert legacy metadata format to new format if needed
  let updatedData = { ...nodeData };

  // Handle main metadata
  if (nodeData.metadata && !nodeData.metadataItems) {
   updatedData.metadataItems = Object.entries(nodeData.metadata).map(([key, value]) => ({
    id: uuidv4(),
    key,
    value
   }));
  }

  // Handle condition metadata for both data and event conditions
  ['dataConditions', 'eventConditions'].forEach(conditionKey => {
   if (updatedData[conditionKey]) {
    updatedData[conditionKey] = updatedData[conditionKey].map(condition => {
     if (condition.metadata && !condition.metadataItems) {
      return {
       ...condition,
       metadataItems: Object.entries(condition.metadata).map(([key, value]) => ({
        id: uuidv4(),
        key,
        value
       }))
      };
     }
     return condition;
    });
   }
  });

  setFormData(updatedData);
 }, [node]);

 // Start and End nodes should not have editable properties
 if (node.type === 'start' || node.type === 'end') {
  return (
   <div className="node-properties-editor">
    <div className="no-properties">
     <p>{node.type === 'start' ? 'Start' : 'End'} nodes have no configurable properties.</p>
    </div>
   </div>
  );
 }

 const handleInputChange = (field, value) => {
  const updatedData = { ...formData, [field]: value };
  setFormData(updatedData);
  onUpdateNodeData(node.id, updatedData);
 };

 const handleUpdateData = (updatedData) => {
  setFormData(updatedData);
  onUpdateNodeData(node.id, updatedData);
 };

 const openJsonModal = (value, onChange, title, label) => {
  setModalState({
   isOpen: true,
   value,
   onChange,
   title,
   label
  });
 };

 const closeJsonModal = () => {
  setModalState({ isOpen: false, value: null, onChange: null, title: '', label: '' });
 };

 const renderNodeSpecificEditor = () => {
  switch (node.type) {
   case 'operation':
    return (
     <OperationEditor
      formData={formData}
      onUpdateData={handleUpdateData}
      workflowMetadata={workflowMetadata}
      openJsonModal={openJsonModal}
     />
    );
   case 'switch':
    return (
     <SwitchEditor
      formData={formData}
      onUpdateData={handleUpdateData}
      openJsonModal={openJsonModal}
     />
    );
   case 'event':
    return (
     <EventEditor
      formData={formData}
      onUpdateData={handleUpdateData}
      openJsonModal={openJsonModal}
     />
    );
   case 'sleep':
    return (
     <SleepEditor
      formData={formData}
      onInputChange={handleInputChange}
     />
    );
   default:
    return null;
  }
 };

 return (
  <div className="node-properties-editor">
   <CommonNodeEditor
    formData={formData}
    onInputChange={handleInputChange}
    onUpdateData={handleUpdateData}
   />

   {renderNodeSpecificEditor()}

   {modalState.isOpen && (
    <JsonEditorModal
     isOpen={modalState.isOpen}
     onClose={closeJsonModal}
     value={modalState.value}
     onChange={modalState.onChange}
     title={modalState.title}
     label={modalState.label}
    />
   )}
  </div>
 );
};

export default NodePropertiesEditor; 
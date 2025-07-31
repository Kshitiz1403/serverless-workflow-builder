import React, { useState } from 'react';
import { Plus, Minus, Settings, GripVertical } from 'lucide-react';
import JsonEditor from '../../ui/JsonEditor';

const OperationEditor = ({ formData, onUpdateData, workflowMetadata, openJsonModal }) => {
 const [draggedActionIndex, setDraggedActionIndex] = useState(null);
 const [dragOverIndex, setDragOverIndex] = useState(null);

 const getRetryPolicies = () => {
  if (!workflowMetadata?.retryPolicies) return [];
  return workflowMetadata.retryPolicies.map((policy, index) => ({
   id: policy.name || `retry-${index}`,
   name: policy.name || `Retry Policy ${index + 1}`,
  }));
 };

 const addAction = () => {
  const currentActions = formData.actions || [];
  const newAction = {
   name: `action${currentActions.length + 1}`,
   functionRef: {
    refName: 'functionName',
    arguments: {},
   },
  };
  const updatedData = { ...formData, actions: [...currentActions, newAction] };
  onUpdateData(updatedData);
 };

 const removeAction = (index) => {
  const currentActions = formData.actions || [];
  const newActions = currentActions.filter((_, i) => i !== index);
  const updatedData = { ...formData, actions: newActions };
  onUpdateData(updatedData);
 };

 const insertAction = (index) => {
  const currentActions = formData.actions || [];
  const newAction = {
   name: `action${currentActions.length + 1}`,
   functionRef: {
    refName: 'functionName',
    arguments: {},
   },
  };
  const newActions = [...currentActions];
  newActions.splice(index + 1, 0, newAction);
  const updatedData = { ...formData, actions: newActions };
  onUpdateData(updatedData);
 };

 const handleActionChange = (index, path, value) => {
  const currentActions = [...(formData.actions || [])];
  const action = { ...currentActions[index] };

  if (path.includes('.')) {
   const [parent, child] = path.split('.');
   action[parent] = { ...action[parent], [child]: value };
  } else {
   action[path] = value;
  }

  currentActions[index] = action;
  const updatedData = { ...formData, actions: currentActions };
  onUpdateData(updatedData);
 };

 // Drag and drop handlers
 const handleActionDragStart = (e, index) => {
  setDraggedActionIndex(index);
  e.dataTransfer.effectAllowed = 'move';
 };

 const handleActionDragOver = (e, index) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  setDragOverIndex(index);
 };

 const handleActionDrop = (e, dropIndex) => {
  e.preventDefault();

  if (draggedActionIndex === null || draggedActionIndex === dropIndex) {
   setDraggedActionIndex(null);
   setDragOverIndex(null);
   return;
  }

  const currentActions = [...(formData.actions || [])];
  const draggedAction = currentActions[draggedActionIndex];

  // Remove the dragged action from its original position
  currentActions.splice(draggedActionIndex, 1);

  // Adjust the drop index if necessary
  const adjustedDropIndex = draggedActionIndex < dropIndex ? dropIndex - 1 : dropIndex;

  // Insert the dragged action at the new position
  currentActions.splice(adjustedDropIndex, 0, draggedAction);

  const updatedData = { ...formData, actions: currentActions };
  onUpdateData(updatedData);

  setDraggedActionIndex(null);
  setDragOverIndex(null);
 };

 const handleActionDragEnd = () => {
  setDraggedActionIndex(null);
  setDragOverIndex(null);
 };

 const handleActionDragLeave = () => {
  setDragOverIndex(null);
 };

 return (
  <div className="section">
   <div className="section-header">
    <Settings size={16} />
    <span>Actions</span>
    <button className="add-btn" onClick={addAction}>
     <Plus size={14} />
    </button>
   </div>

   {(formData.actions || []).map((action, index) => (
    <div key={index}>
     {/* Drop zone indicator above each action */}
     {draggedActionIndex !== null && draggedActionIndex !== index && (
      <div
       className={`drop-zone ${dragOverIndex === index ? 'drag-over' : ''}`}
       onDragOver={(e) => handleActionDragOver(e, index)}
       onDrop={(e) => handleActionDrop(e, index)}
       onDragLeave={handleActionDragLeave}
      >
       <div className="drop-indicator">
        <div className="drop-line"></div>
        <span className="drop-text">Drop here to insert before Action {index + 1}</span>
       </div>
      </div>
     )}

     <div
      className={`action-item ${draggedActionIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-target' : ''}`}
      draggable
      onDragStart={(e) => handleActionDragStart(e, index)}
      onDragOver={(e) => handleActionDragOver(e, index)}
      onDrop={(e) => handleActionDrop(e, index)}
      onDragEnd={handleActionDragEnd}
      onDragLeave={handleActionDragLeave}
     >
      <div className="item-header">
       <div className="drag-handle">
        <GripVertical size={14} />
       </div>
       <span>Action {index + 1}</span>
       <div className="action-buttons">
        <button
         className="insert-btn"
         onClick={() => insertAction(index)}
         title="Insert action after this one"
        >
         <Plus size={14} />
        </button>
        <button className="remove-btn" onClick={() => removeAction(index)}>
         <Minus size={14} />
        </button>
       </div>
      </div>

      <div className="form-group">
       <label>Name</label>
       <input
        type="text"
        value={action.name || ''}
        onChange={(e) => handleActionChange(index, 'name', e.target.value)}
        placeholder="Action name"
       />
      </div>

      <div className="form-group">
       <label>Function Reference</label>
       <input
        type="text"
        value={action.functionRef?.refName || ''}
        onChange={(e) => handleActionChange(index, 'functionRef.refName', e.target.value)}
        placeholder="Function name"
       />
      </div>

      <JsonEditor
       label="Arguments (JSON)"
       value={action.functionRef?.arguments}
       onChange={(value) => handleActionChange(index, 'functionRef.arguments', value)}
       placeholder='{"key": "value"}'
       height="120px"
       onOpenModal={() => openJsonModal(
        action.functionRef?.arguments,
        (value) => handleActionChange(index, 'functionRef.arguments', value),
        `Function Arguments - ${action.name || `Action ${index + 1}`}`,
        "Function Arguments (JSON)"
       )}
      />

      <div className="form-group">
       <label>Retry Policy</label>
       <select
        value={action.retryRef || ''}
        onChange={(e) => handleActionChange(index, 'retryRef', e.target.value)}
       >
        <option value="">No retry policy</option>
        {getRetryPolicies().map((policy) => (
         <option key={policy.id} value={policy.id}>
          {policy.name}
         </option>
        ))}
       </select>
       {getRetryPolicies().length === 0 && (
        <div className="retry-policy-hint">
         <span>No retry policies available. Create policies in the Workflow tab.</span>
        </div>
       )}
      </div>

      {/* Action Data Filter Toggle */}
      <div className="form-group">
       <label>
        <input
         type="checkbox"
         checked={!!action.actionDataFilter}
         onChange={(e) => {
          if (e.target.checked) {
           // Enable action data filter with default values
           const actions = [...(formData.actions || [])];
           actions[index] = {
            ...actions[index],
            actionDataFilter: {
             useResults: true,
             results: '',
             toStateData: ''
            }
           };
           const updatedData = { ...formData, actions };
           onUpdateData(updatedData);
          } else {
           // Disable action data filter by removing it
           const actions = [...(formData.actions || [])];
           const updatedAction = { ...actions[index] };
           delete updatedAction.actionDataFilter;
           actions[index] = updatedAction;
           const updatedData = { ...formData, actions };
           onUpdateData(updatedData);
          }
         }}
        />
        Enable Action Data Filter
       </label>
       <div className="form-help">
        <small>Configure how action results are processed and stored</small>
       </div>
      </div>

      {/* Action Data Filter Section - Only visible when enabled */}
      {action.actionDataFilter && (
       <div className="subsection">
        <div className="subsection-header">
         <span>Action Data Filter Configuration</span>
        </div>

        <div className="form-group">
         <label>Results Filter (jq expression)</label>
         <input
          type="text"
          value={action.actionDataFilter?.results || ''}
          onChange={(e) => handleActionChange(index, 'actionDataFilter.results', e.target.value)}
          placeholder="${ .userLoanDetails.currentAddress | fromjson | .state }"
         />
         <div className="form-help">
          <small>jq expression to filter action result data</small>
         </div>
        </div>

        <div className="form-group">
         <label>To State Data (jq expression)</label>
         <input
          type="text"
          value={action.actionDataFilter?.toStateData || ''}
          onChange={(e) => handleActionChange(index, 'actionDataFilter.toStateData', e.target.value)}
          placeholder="${ .currentAddressState }"
         />
         <div className="form-help">
          <small>jq expression defining how to populate state data</small>
         </div>
        </div>
       </div>
      )}
     </div>

     {/* Drop zone at the end for the last item */}
     {draggedActionIndex !== null &&
      draggedActionIndex !== index &&
      index === (formData.actions || []).length - 1 && (
       <div
        className={`drop-zone ${dragOverIndex === index + 1 ? 'drag-over' : ''}`}
        onDragOver={(e) => handleActionDragOver(e, index + 1)}
        onDrop={(e) => handleActionDrop(e, index + 1)}
        onDragLeave={handleActionDragLeave}
       >
        <div className="drop-indicator">
         <div className="drop-line"></div>
         <span className="drop-text">Drop here to insert after Action {index + 1}</span>
        </div>
       </div>
      )}
    </div>
   ))}

   {(!formData.actions || formData.actions.length === 0) && (
    <div className="no-actions">
     <span>No actions defined yet</span>
    </div>
   )}
  </div>
 );
};

export default OperationEditor; 
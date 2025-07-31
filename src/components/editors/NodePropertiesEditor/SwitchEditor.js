import React from 'react';
import { Plus, Minus, Settings } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import JsonEditor from '../../ui/JsonEditor';

const SwitchEditor = ({ formData, onUpdateData, openJsonModal }) => {
 const addDataCondition = () => {
  const currentConditions = formData.dataConditions || [];
  const newCondition = {
   name: `condition${currentConditions.length + 1}`,
   condition: '.data == true',
   metadata: {},
   metadataItems: [],
  };
  const updatedData = { ...formData, dataConditions: [...currentConditions, newCondition] };
  onUpdateData(updatedData);
 };

 const removeDataCondition = (index) => {
  const currentConditions = formData.dataConditions || [];
  const newConditions = currentConditions.filter((_, i) => i !== index);
  const updatedData = { ...formData, dataConditions: newConditions };
  onUpdateData(updatedData);
 };

 const handleDataConditionChange = (index, field, value) => {
  const currentConditions = [...(formData.dataConditions || [])];
  currentConditions[index] = { ...currentConditions[index], [field]: value };
  const updatedData = { ...formData, dataConditions: currentConditions };
  onUpdateData(updatedData);
 };

 const addEventCondition = () => {
  const currentConditions = formData.eventConditions || [];
  const newCondition = {
   name: `eventCondition${currentConditions.length + 1}`,
   eventRef: 'example_event',
   metadata: {},
   metadataItems: [],
  };
  const updatedData = { ...formData, eventConditions: [...currentConditions, newCondition] };
  onUpdateData(updatedData);
 };

 const removeEventCondition = (index) => {
  const currentConditions = formData.eventConditions || [];
  const newConditions = currentConditions.filter((_, i) => i !== index);
  const updatedData = { ...formData, eventConditions: newConditions };
  onUpdateData(updatedData);
 };

 const handleEventConditionChange = (index, field, value) => {
  const currentConditions = [...(formData.eventConditions || [])];
  currentConditions[index] = { ...currentConditions[index], [field]: value };
  const updatedData = { ...formData, eventConditions: currentConditions };
  onUpdateData(updatedData);
 };

 const handleConditionTypeChange = (type) => {
  const updatedData = { ...formData, conditionType: type };
  onUpdateData(updatedData);
 };

 // Helper function to manage condition metadata
 const addConditionMetadataField = (conditionType, conditionIndex) => {
  const conditions = [...(formData[conditionType] || [])];
  const condition = { ...conditions[conditionIndex] };
  const currentMetadata = condition.metadataItems || [];
  condition.metadataItems = [...currentMetadata, { id: uuidv4(), key: '', value: '' }];
  conditions[conditionIndex] = condition;
  const updatedData = { ...formData, [conditionType]: conditions };
  onUpdateData(updatedData);
 };

 const removeConditionMetadataField = (conditionType, conditionIndex, fieldId) => {
  const conditions = [...(formData[conditionType] || [])];
  const condition = { ...conditions[conditionIndex] };
  condition.metadataItems = (condition.metadataItems || []).filter(item => item.id !== fieldId);
  conditions[conditionIndex] = condition;
  const updatedData = { ...formData, [conditionType]: conditions };
  onUpdateData(updatedData);
 };

 const handleConditionMetadataChange = (conditionType, conditionIndex, fieldId, field, value) => {
  const conditions = [...(formData[conditionType] || [])];
  const condition = { ...conditions[conditionIndex] };
  condition.metadataItems = (condition.metadataItems || []).map(item =>
   item.id === fieldId ? { ...item, [field]: value } : item
  );
  conditions[conditionIndex] = condition;
  const updatedData = { ...formData, [conditionType]: conditions };
  onUpdateData(updatedData);
 };

 return (
  <>
   {/* Condition Type Selection */}
   <div className="section">
    <div className="section-header">
     <Settings size={16} />
     <span>Condition Type</span>
    </div>
    <div className="form-group">
     <label>
      <input
       type="radio"
       name="conditionType"
       value="data"
       checked={formData.conditionType === 'data'}
       onChange={() => handleConditionTypeChange('data')}
      />
      Data Conditions
     </label>
     <label>
      <input
       type="radio"
       name="conditionType"
       value="event"
       checked={formData.conditionType === 'event'}
       onChange={() => handleConditionTypeChange('event')}
      />
      Event Conditions
     </label>
    </div>
   </div>

   {/* Data Conditions */}
   {formData.conditionType === 'data' && (
    <div className="section">
     <div className="section-header">
      <span>Data Conditions</span>
      <button className="add-btn" onClick={addDataCondition}>
       <Plus size={14} />
      </button>
     </div>
     <div className="form-help">
      <small>Define conditions based on workflow data using expressions</small>
     </div>

     {(formData.dataConditions || []).map((condition, index) => (
      <div key={index} className="condition-item">
       <div className="item-header">
        <span>Condition {index + 1}</span>
        <button className="remove-btn" onClick={() => removeDataCondition(index)}>
         <Minus size={14} />
        </button>
       </div>

       <div className="form-group">
        <label>Name</label>
        <input
         type="text"
         value={condition.name || ''}
         onChange={(e) => handleDataConditionChange(index, 'name', e.target.value)}
         placeholder="Condition name"
        />
       </div>

       <div className="form-group">
        <label>Condition Expression</label>
        <input
         type="text"
         value={condition.condition || ''}
         onChange={(e) => handleDataConditionChange(index, 'condition', e.target.value)}
         placeholder=".data == true"
        />
        <div className="form-help">
         <small>jq expression to evaluate condition</small>
        </div>
       </div>

       {/* Condition Metadata */}
       <div className="subsection">
        <div className="subsection-header">
         <span>Condition Metadata</span>
         <button
          className="add-btn"
          onClick={() => addConditionMetadataField('dataConditions', index)}
         >
          <Plus size={12} />
         </button>
        </div>

        {(condition.metadataItems || []).map((item) => (
         <div key={item.id} className="metadata-item">
          <input
           type="text"
           value={item.key}
           onChange={(e) => handleConditionMetadataChange('dataConditions', index, item.id, 'key', e.target.value)}
           placeholder="Key"
          />
          <input
           type="text"
           value={item.value}
           onChange={(e) => handleConditionMetadataChange('dataConditions', index, item.id, 'value', e.target.value)}
           placeholder="Value"
          />
          <button
           className="remove-btn"
           onClick={() => removeConditionMetadataField('dataConditions', index, item.id)}
          >
           <Minus size={12} />
          </button>
         </div>
        ))}
       </div>
      </div>
     ))}

     {(!formData.dataConditions || formData.dataConditions.length === 0) && (
      <div className="no-conditions">
       <span>No data conditions defined yet</span>
      </div>
     )}
    </div>
   )}

   {/* Event Conditions */}
   {formData.conditionType === 'event' && (
    <div className="section">
     <div className="section-header">
      <span>Event Conditions</span>
      <button className="add-btn" onClick={addEventCondition}>
       <Plus size={14} />
      </button>
     </div>
     <div className="form-help">
      <small>Define conditions based on events</small>
     </div>

     {(formData.eventConditions || []).map((condition, index) => (
      <div key={index} className="condition-item">
       <div className="item-header">
        <span>Event Condition {index + 1}</span>
        <button className="remove-btn" onClick={() => removeEventCondition(index)}>
         <Minus size={14} />
        </button>
       </div>

       <div className="form-group">
        <label>Name</label>
        <input
         type="text"
         value={condition.name || ''}
         onChange={(e) => handleEventConditionChange(index, 'name', e.target.value)}
         placeholder="Event condition name"
        />
       </div>

       <div className="form-group">
        <label>Event Reference</label>
        <input
         type="text"
         value={condition.eventRef || ''}
         onChange={(e) => handleEventConditionChange(index, 'eventRef', e.target.value)}
         placeholder="example_event"
        />
       </div>

       {/* Event Condition Metadata */}
       <div className="subsection">
        <div className="subsection-header">
         <span>Event Condition Metadata</span>
         <button
          className="add-btn"
          onClick={() => addConditionMetadataField('eventConditions', index)}
         >
          <Plus size={12} />
         </button>
        </div>

        {(condition.metadataItems || []).map((item) => (
         <div key={item.id} className="metadata-item">
          <input
           type="text"
           value={item.key}
           onChange={(e) => handleConditionMetadataChange('eventConditions', index, item.id, 'key', e.target.value)}
           placeholder="Key"
          />
          <input
           type="text"
           value={item.value}
           onChange={(e) => handleConditionMetadataChange('eventConditions', index, item.id, 'value', e.target.value)}
           placeholder="Value"
          />
          <button
           className="remove-btn"
           onClick={() => removeConditionMetadataField('eventConditions', index, item.id)}
          >
           <Minus size={12} />
          </button>
         </div>
        ))}
       </div>
      </div>
     ))}

     {(!formData.eventConditions || formData.eventConditions.length === 0) && (
      <div className="no-conditions">
       <span>No event conditions defined yet</span>
      </div>
     )}
    </div>
   )}

   {/* Default Condition */}
   <div className="section">
    <div className="section-header">
     <span>Default Condition</span>
    </div>
    <div className="form-group">
     <label>
      <input
       type="checkbox"
       checked={!!formData.defaultCondition}
       onChange={(e) => {
        const updatedData = { ...formData, defaultCondition: e.target.checked };
        onUpdateData(updatedData);
       }}
      />
      Enable Default Condition
     </label>
     <div className="form-help">
      <small>Provides a fallback path when no other conditions match</small>
     </div>
    </div>
   </div>
  </>
 );
};

export default SwitchEditor; 
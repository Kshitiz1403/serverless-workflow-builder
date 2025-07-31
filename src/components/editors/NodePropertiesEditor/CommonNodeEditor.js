import React from 'react';
import { Plus, Minus, Settings } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const CommonNodeEditor = ({ formData, onInputChange, onUpdateData }) => {
 const addMetadataField = () => {
  const currentMetadata = formData.metadataItems || [];
  const newMetadata = [...currentMetadata, { id: uuidv4(), key: '', value: '' }];
  const updatedData = { ...formData, metadataItems: newMetadata };
  onUpdateData(updatedData);
 };

 const removeMetadataField = (fieldId) => {
  const currentMetadata = formData.metadataItems || [];
  const newMetadata = currentMetadata.filter(item => item.id !== fieldId);
  const updatedData = { ...formData, metadataItems: newMetadata };
  onUpdateData(updatedData);
 };

 const handleMetadataChange = (fieldId, field, value) => {
  const currentMetadata = formData.metadataItems || [];
  const newMetadata = currentMetadata.map(item =>
   item.id === fieldId ? { ...item, [field]: value } : item
  );
  const updatedData = { ...formData, metadataItems: newMetadata };
  onUpdateData(updatedData);
 };

 return (
  <>
   <div className="form-group">
    <label>Node Label</label>
    <input
     type="text"
     value={formData.label || ''}
     onChange={(e) => onInputChange('label', e.target.value)}
     placeholder="Enter node label"
    />
   </div>

   <div className="form-group">
    <label>Node Name</label>
    <input
     type="text"
     value={formData.name || ''}
     onChange={(e) => onInputChange('name', e.target.value)}
     placeholder="Enter node name"
    />
   </div>

   {/* Metadata Section */}
   <div className="section">
    <div className="section-header">
     <Settings size={16} />
     <span>Metadata</span>
     <button className="add-btn" onClick={addMetadataField}>
      <Plus size={14} />
     </button>
    </div>
    <div className="form-help">
     <small>Add custom key-value metadata for this state</small>
    </div>

    <div className="metadata-list">
     {(formData.metadataItems || []).map((item) => (
      <div key={item.id} className="metadata-item">
       <input
        type="text"
        value={item.key}
        onChange={(e) => handleMetadataChange(item.id, 'key', e.target.value)}
        placeholder="Key"
       />
       <input
        type="text"
        value={item.value}
        onChange={(e) => handleMetadataChange(item.id, 'value', e.target.value)}
        placeholder="Value"
       />
       <button
        className="remove-btn"
        onClick={() => removeMetadataField(item.id)}
       >
        <Minus size={14} />
       </button>
      </div>
     ))}
     {(!formData.metadataItems || formData.metadataItems.length === 0) && (
      <div className="no-metadata">
       <span>No metadata fields added yet</span>
      </div>
     )}
    </div>
   </div>
  </>
 );
};

export default CommonNodeEditor; 
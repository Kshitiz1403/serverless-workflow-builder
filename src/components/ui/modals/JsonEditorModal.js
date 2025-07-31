import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import JsonEditor from '../JsonEditor';
import './JsonEditorModal.css';

const JsonEditorModal = ({
 isOpen,
 onClose,
 value,
 onChange,
 title = "JSON Editor",
 label = "JSON Data"
}) => {
 const [tempValue, setTempValue] = useState(value);
 const [hasChanges, setHasChanges] = useState(false);

 useEffect(() => {
  if (isOpen) {
   setTempValue(value);
   setHasChanges(false);
  }
 }, [isOpen, value]);

 const handleTempChange = (newValue) => {
  setTempValue(newValue);
  setHasChanges(JSON.stringify(newValue) !== JSON.stringify(value));
 };

 const handleSave = () => {
  onChange(tempValue);
  setHasChanges(false);
  onClose();
 };

 const handleReset = () => {
  setTempValue(value);
  setHasChanges(false);
 };

 const handleClose = () => {
  if (hasChanges) {
   if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
    onClose();
   }
  } else {
   onClose();
  }
 };

 if (!isOpen) return null;

 return (
  <div className="json-editor-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
   <div className="json-editor-modal">
    <div className="json-editor-modal-header">
     <h3>{title}</h3>
     <div className="json-editor-modal-actions">
      {hasChanges && (
       <button
        className="reset-btn"
        onClick={handleReset}
        title="Reset to original"
       >
        <RotateCcw size={16} />
        Reset
       </button>
      )}
      <button
       className="save-btn"
       onClick={handleSave}
       disabled={!hasChanges}
       title="Save changes"
      >
       <Save size={16} />
       Save
      </button>
      <button
       className="close-btn"
       onClick={handleClose}
       title="Close modal"
      >
       <X size={16} />
      </button>
     </div>
    </div>

    <div className="json-editor-modal-content">
     <JsonEditor
      value={tempValue}
      onChange={handleTempChange}
      label={label}
      height="500px"
      allowEdit={true}
      showValidation={true}
     />
    </div>

    <div className="json-editor-modal-footer">
     <div className="json-editor-modal-info">
      {hasChanges && (
       <span className="changes-indicator">• Unsaved changes</span>
      )}
     </div>
     <div className="json-editor-modal-buttons">
      <button className="cancel-btn" onClick={handleClose}>
       Cancel
      </button>
      <button
       className="save-btn primary"
       onClick={handleSave}
       disabled={!hasChanges}
      >
       Save Changes
      </button>
     </div>
    </div>
   </div>
  </div>
 );
};

export default JsonEditorModal; 
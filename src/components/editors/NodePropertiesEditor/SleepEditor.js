import React from 'react';

const SleepEditor = ({ formData, onInputChange }) => {
 return (
  <div className="section">
   <div className="section-header">
    <span>Sleep Configuration</span>
   </div>
   <div className="form-help">
    <small>Configure how long the workflow should pause</small>
   </div>

   <div className="form-group">
    <label>Duration (ISO 8601 format)</label>
    <input
     type="text"
     value={formData.duration || ''}
     onChange={(e) => onInputChange('duration', e.target.value)}
     placeholder="PT30M"
    />
    <div className="form-help">
     <small>Duration to sleep (e.g., PT30M for 30 minutes, PT1H for 1 hour, PT5S for 5 seconds)</small>
    </div>
   </div>
  </div>
 );
};

export default SleepEditor; 
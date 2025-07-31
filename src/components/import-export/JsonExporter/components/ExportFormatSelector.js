import React from 'react';

const ExportFormatSelector = ({ exportFormat, onFormatChange }) => {
 return (
  <div className="export-format-selector">
   <div className="format-options">
    <label className="format-option">
     <input
      type="radio"
      name="exportFormat"
      value="serverless"
      checked={exportFormat === 'serverless'}
      onChange={(e) => onFormatChange(e.target.value)}
     />
     <div className="format-details">
      <strong>Serverless Workflow</strong>
      <span>Standard format for execution engines</span>
     </div>
    </label>
    <label className="format-option">
     <input
      type="radio"
      name="exportFormat"
      value="reactflow"
      checked={exportFormat === 'reactflow'}
      onChange={(e) => onFormatChange(e.target.value)}
     />
     <div className="format-details">
      <strong>React Flow Layout</strong>
      <span>Preserves visual positioning for sharing</span>
     </div>
    </label>
   </div>
  </div>
 );
};

export default ExportFormatSelector; 
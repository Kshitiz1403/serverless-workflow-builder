import React from 'react';

const FileUploadSection = ({ onFileUpload, visible }) => {
 if (!visible) return null;

 const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
   const reader = new FileReader();
   reader.onload = (e) => {
    onFileUpload(e.target.result);
   };
   reader.readAsText(file);
  }
 };

 return (
  <div className="file-upload-section">
   <input
    type="file"
    accept=".json"
    onChange={handleFileUpload}
    className="file-input"
   />
   <p className="file-help">
    Select a .json file containing a serverless workflow
   </p>
  </div>
 );
};

export default FileUploadSection; 
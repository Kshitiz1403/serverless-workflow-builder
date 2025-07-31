import React from 'react';
import { Upload, FileText } from 'lucide-react';

const ImportModeSelector = ({ importMode, onModeChange }) => {
 return (
  <div className="import-mode-selector">
   <button
    className={`mode-btn ${importMode === 'paste' ? 'active' : ''}`}
    onClick={() => onModeChange('paste')}
   >
    <FileText size={16} />
    Paste JSON
   </button>
   <button
    className={`mode-btn ${importMode === 'file' ? 'active' : ''}`}
    onClick={() => onModeChange('file')}
   >
    <Upload size={16} />
    Upload File
   </button>
  </div>
 );
};

export default ImportModeSelector; 
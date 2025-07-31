import React, { useState } from 'react';
import { Copy, Download, Check, AlertCircle } from 'lucide-react';
import { copyToClipboard, downloadJsonFile } from '../utils/fileOperations';
import ValidationWarnings from './ValidationWarnings';

const JsonOutput = ({
 jsonString,
 exportFormat,
 workflowInfo,
 validationErrors
}) => {
 const [copyStatus, setCopyStatus] = useState('idle'); // 'idle', 'copied', 'error'

 const handleCopy = async () => {
  const result = await copyToClipboard(jsonString);
  if (result.success) {
   setCopyStatus('copied');
  } else {
   setCopyStatus('error');
  }
  // Reset status after 1 second
  setTimeout(() => setCopyStatus('idle'), 1000);
 };

 const handleDownload = () => {
  downloadJsonFile(jsonString, exportFormat, workflowInfo);
 };

 return (
  <div className="json-output">
   <div className="output-header">
    <h3>Generated {exportFormat === 'serverless' ? 'Serverless Workflow' : 'React Flow Layout'}</h3>
    <div className="output-actions">
     <button
      className={`copy-btn ${copyStatus === 'copied' ? 'copied' : ''} ${copyStatus === 'error' ? 'error' : ''}`}
      onClick={handleCopy}
      disabled={copyStatus !== 'idle'}
     >
      {copyStatus === 'copied' ? (
       <>
        <Check size={16} />
        Copied!
       </>
      ) : copyStatus === 'error' ? (
       <>
        <AlertCircle size={16} />
        Error
       </>
      ) : (
       <>
        <Copy size={16} />
        Copy
       </>
      )}
     </button>
     <button className="download-btn" onClick={handleDownload}>
      <Download size={16} />
      Download
     </button>
    </div>
   </div>

   <ValidationWarnings validationErrors={validationErrors} />

   <pre className="json-content">{jsonString}</pre>
  </div>
 );
};

export default JsonOutput; 
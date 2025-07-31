import React from 'react';
import { exampleWorkflow } from '../data/exampleWorkflows';

const JsonInputSection = ({ jsonInput, onJsonInputChange, onClearError }) => {
 const loadExampleWorkflow = () => {
  const formattedWorkflow = JSON.stringify(exampleWorkflow, null, 2);
  onJsonInputChange(formattedWorkflow);
  onClearError();
 };

 return (
  <div className="json-input-section">
   <div className="input-header">
    <label>Workflow JSON</label>
    <button className="example-btn" onClick={loadExampleWorkflow}>
     Load Example
    </button>
   </div>
   <textarea
    value={jsonInput}
    onChange={(e) => {
     onJsonInputChange(e.target.value);
     onClearError();
    }}
    placeholder="Paste your workflow JSON here (Serverless Workflow or React Flow format)..."
    rows="15"
    className="json-textarea"
   />
  </div>
 );
};

export default JsonInputSection; 
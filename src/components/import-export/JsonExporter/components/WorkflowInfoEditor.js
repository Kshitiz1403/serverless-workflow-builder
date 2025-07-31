import React from 'react';

const WorkflowInfoEditor = ({ exportFormat, workflowInfo, onWorkflowInfoChange }) => {
 const handleChange = (field, value) => {
  onWorkflowInfoChange({ ...workflowInfo, [field]: value });
 };

 if (exportFormat === 'serverless') {
  return (
   <div className="workflow-info">
    <div className="info-grid">
     <div className="form-group">
      <label>Workflow ID</label>
      <input
       type="text"
       value={workflowInfo.id}
       onChange={(e) => handleChange('id', e.target.value)}
      />
     </div>
     <div className="form-group">
      <label>Version</label>
      <input
       type="text"
       value={workflowInfo.version}
       onChange={(e) => handleChange('version', e.target.value)}
      />
     </div>
     <div className="form-group">
      <label>Name</label>
      <input
       type="text"
       value={workflowInfo.name}
       onChange={(e) => handleChange('name', e.target.value)}
      />
     </div>
     <div className="form-group">
      <label>Description</label>
      <input
       type="text"
       value={workflowInfo.description}
       onChange={(e) => handleChange('description', e.target.value)}
      />
     </div>
    </div>
   </div>
  );
 }

 if (exportFormat === 'reactflow') {
  return (
   <div className="workflow-info">
    <div className="info-grid">
     <div className="form-group">
      <label>Layout Name</label>
      <input
       type="text"
       value={workflowInfo.name}
       onChange={(e) => handleChange('name', e.target.value)}
      />
     </div>
     <div className="form-group">
      <label>Description</label>
      <input
       type="text"
       value={workflowInfo.description}
       onChange={(e) => handleChange('description', e.target.value)}
      />
     </div>
    </div>
   </div>
  );
 }

 return null;
};

export default WorkflowInfoEditor; 
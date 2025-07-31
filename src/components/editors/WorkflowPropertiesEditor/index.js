import React, { useState } from 'react';
import { Plus, Minus, RefreshCw, Settings } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import './WorkflowPropertiesEditor.css';

const WorkflowPropertiesEditor = ({ workflowMetadata, onUpdateWorkflowMetadata }) => {
 // Retry Policy Management
 const getRetryPolicies = () => {
  const policies = workflowMetadata?.retryPolicies || [];
  // Ensure all policies have IDs (for backward compatibility)
  let needsUpdate = false;
  const updatedPolicies = policies.map(policy => {
   if (!policy.id) {
    needsUpdate = true;
    return { ...policy, id: uuidv4() };
   }
   return policy;
  });

  // Update metadata if we added IDs
  if (needsUpdate && onUpdateWorkflowMetadata) {
   onUpdateWorkflowMetadata({
    ...workflowMetadata,
    retryPolicies: updatedPolicies
   });
  }

  return updatedPolicies;
 };

 const addRetryPolicy = () => {
  const retryPolicies = [...getRetryPolicies()];
  const newPolicy = {
   id: uuidv4(),
   name: `retryPolicy${retryPolicies.length + 1}`,
   delay: 'PT2S',
   maxAttempts: 3,
   increment: 'PT1S',
   multiplier: 2.0,
   maxDelay: 'PT30S',
   jitter: { from: 'PT0S', to: 'PT1S' }
  };
  retryPolicies.push(newPolicy);

  const updatedMetadata = {
   ...workflowMetadata,
   retryPolicies
  };
  onUpdateWorkflowMetadata(updatedMetadata);
 };

 const updateRetryPolicy = (policyId, field, value) => {
  const retryPolicies = [...getRetryPolicies()];
  const policyIndex = retryPolicies.findIndex(p => p.id === policyId);

  if (policyIndex === -1) return;

  if (field.includes('.')) {
   const [parentField, childField] = field.split('.');
   retryPolicies[policyIndex] = {
    ...retryPolicies[policyIndex],
    [parentField]: {
     ...retryPolicies[policyIndex][parentField],
     [childField]: value
    }
   };
  } else {
   retryPolicies[policyIndex] = {
    ...retryPolicies[policyIndex],
    [field]: value
   };
  }

  const updatedMetadata = {
   ...workflowMetadata,
   retryPolicies
  };
  onUpdateWorkflowMetadata(updatedMetadata);
 };

 const removeRetryPolicy = (policyId) => {
  const retryPolicies = [...getRetryPolicies()];
  const filteredPolicies = retryPolicies.filter(p => p.id !== policyId);

  const updatedMetadata = {
   ...workflowMetadata,
   retryPolicies: filteredPolicies
  };
  onUpdateWorkflowMetadata(updatedMetadata);
 };

 return (
  <div className="workflow-properties-editor">
   <div className="workflow-section">
    <div className="section-header">
     <Settings size={16} />
     <span>Workflow Information</span>
    </div>

    <div className="workflow-info">
     <p className="section-description">
      Configure global workflow settings and reusable policies.
     </p>
    </div>
   </div>

   <div className="workflow-section">
    <div className="section-header">
     <RefreshCw size={16} />
     <span>Retry Policies</span>
     <button className="add-btn" onClick={addRetryPolicy}>
      <Plus size={14} />
     </button>
    </div>

    <div className="section-description">
     Define reusable retry policies that can be applied to any operation action.
    </div>

    {getRetryPolicies().length === 0 && (
     <div className="no-retry-policies">
      <p>No retry policies defined yet.</p>
      <p className="help-text">
       Create retry policies here to use them in your operation actions.
      </p>
      <button
       className="create-retry-btn"
       onClick={addRetryPolicy}
       type="button"
      >
       <Plus size={14} />
       Create First Retry Policy
      </button>
     </div>
    )}

    {getRetryPolicies().length > 0 && (
     <div className="retry-policies-list">
      {getRetryPolicies().map((policy) => (
       <div key={policy.id} className="retry-policy-item">
        <div className="item-header">
         <span className="policy-name">{policy.name}</span>
         <button
          className="remove-btn"
          onClick={() => removeRetryPolicy(policy.id)}
          title="Delete retry policy"
         >
          <Minus size={14} />
         </button>
        </div>

        <div className="policy-form">
         <div className="form-group">
          <label>Policy Name</label>
          <input
           type="text"
           value={policy.name || ''}
           onChange={(e) => updateRetryPolicy(policy.id, 'name', e.target.value)}
           placeholder="Retry policy name"
          />
         </div>

         <div className="form-row">
          <div className="form-group">
           <label>Initial Delay</label>
           <input
            type="text"
            value={policy.delay || ''}
            onChange={(e) => updateRetryPolicy(policy.id, 'delay', e.target.value)}
            placeholder="PT2S"
           />
          </div>
          <div className="form-group">
           <label>Max Attempts</label>
           <input
            type="number"
            value={policy.maxAttempts || ''}
            onChange={(e) => updateRetryPolicy(policy.id, 'maxAttempts', parseInt(e.target.value))}
            placeholder="3"
            min="1"
           />
          </div>
         </div>

         <div className="form-row">
          <div className="form-group">
           <label>Increment</label>
           <input
            type="text"
            value={policy.increment || ''}
            onChange={(e) => updateRetryPolicy(policy.id, 'increment', e.target.value)}
            placeholder="PT1S"
           />
          </div>
          <div className="form-group">
           <label>Multiplier</label>
           <input
            type="number"
            step="0.1"
            value={policy.multiplier || ''}
            onChange={(e) => updateRetryPolicy(policy.id, 'multiplier', parseFloat(e.target.value))}
            placeholder="2.0"
            min="1"
           />
          </div>
         </div>

         <div className="form-group">
          <label>Max Delay</label>
          <input
           type="text"
           value={policy.maxDelay || ''}
           onChange={(e) => updateRetryPolicy(policy.id, 'maxDelay', e.target.value)}
           placeholder="PT30S"
          />
         </div>

         <div className="form-row">
          <div className="form-group">
           <label>Jitter From</label>
           <input
            type="text"
            value={policy.jitter?.from || ''}
            onChange={(e) => updateRetryPolicy(policy.id, 'jitter.from', e.target.value)}
            placeholder="PT0S"
           />
          </div>
          <div className="form-group">
           <label>Jitter To</label>
           <input
            type="text"
            value={policy.jitter?.to || ''}
            onChange={(e) => updateRetryPolicy(policy.id, 'jitter.to', e.target.value)}
            placeholder="PT1S"
           />
          </div>
         </div>
        </div>
       </div>
      ))}
     </div>
    )}

    {getRetryPolicies().length > 0 && (
     <div className="policies-summary">
      <div className="summary-header">
       <span>Available Policies ({getRetryPolicies().length})</span>
      </div>
      <div className="policies-list">
       {getRetryPolicies().map((policy) => (
        <div key={policy.id} className="policy-summary-item">
         <span className="policy-name">{policy.name}</span>
         <span className="policy-details">
          {policy.maxAttempts} attempts, {policy.delay} delay
         </span>
        </div>
       ))}
      </div>
     </div>
    )}
   </div>
  </div>
 );
};

export default WorkflowPropertiesEditor; 
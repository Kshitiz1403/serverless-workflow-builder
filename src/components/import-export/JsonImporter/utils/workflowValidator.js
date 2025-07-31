// Validate and process imported workflow data
export function validateAndProcessWorkflow(jsonString) {
 const data = JSON.parse(jsonString);

 // Check if this is a React Flow format
 if (data.format === 'react-flow-workflow') {
  return validateReactFlowFormat(data);
 }

 // Handle serverless workflow format
 return validateServerlessWorkflowFormat(data);
}

function validateReactFlowFormat(data) {
 if (!data.nodes || !data.edges) {
  throw new Error('Invalid React Flow format: missing nodes or edges');
 }

 return {
  type: 'react-flow',
  nodes: data.nodes,
  edges: data.edges,
  workflowMetadata: data.workflowMetadata || null
 };
}

function validateServerlessWorkflowFormat(workflowData) {
 // Basic validation for serverless workflow
 if (!workflowData.states || !Array.isArray(workflowData.states)) {
  throw new Error('Invalid workflow format: missing or invalid states array');
 }

 if (workflowData.states.length === 0) {
  throw new Error('Workflow must contain at least one state');
 }

 // Validate required fields for states
 for (const state of workflowData.states) {
  if (!state.name) {
   throw new Error('All states must have a name property');
  }
  if (!state.type) {
   throw new Error(`State "${state.name}" must have a type property`);
  }
 }

 // Validate start state exists
 if (workflowData.start) {
  const startStateName = typeof workflowData.start === 'string'
   ? workflowData.start
   : workflowData.start.stateName;

  if (startStateName) {
   const startStateExists = workflowData.states.some(state => state.name === startStateName);
   if (!startStateExists) {
    throw new Error(`Start state "${startStateName}" not found in states array`);
   }
  }
 }

 return {
  type: 'serverless-workflow',
  workflowData
 };
} 
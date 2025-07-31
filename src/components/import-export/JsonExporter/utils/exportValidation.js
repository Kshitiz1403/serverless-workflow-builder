export function validateWorkflow(nodes) {
 const errors = [];

 nodes.forEach((node) => {
  if (node.type === 'switch' &&
   node.data.conditionType === 'event' &&
   (!node.data.timeouts || !node.data.timeouts.eventTimeout)) {
   errors.push(`Switch node "${node.data.name || node.data.label || 'unnamed'}" uses event conditions but has no timeout configured`);
  }
 });

 return errors;
} 
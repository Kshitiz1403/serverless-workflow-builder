// Calculate positions for workflow nodes using different layouts
export function calculateNodePositions(states) {
 const positions = {};
 const totalNodes = states.length + 1; // +1 for potential start node

 // Helper function to determine layout type based on workflow structure
 const getLayoutType = () => {
  const hasComplexBranching = states.some(state =>
   state.type === 'switch' && (
    (state.dataConditions && state.dataConditions.length > 2) ||
    (state.eventConditions && state.eventConditions.length > 2)
   )
  );

  const hasParallelPaths = states.some(state =>
   state.type === 'parallel' ||
   (state.type === 'switch' && state.dataConditions && state.dataConditions.length > 1)
  );

  if (hasComplexBranching || totalNodes > 10) return 'hierarchical';
  if (hasParallelPaths) return 'branching';
  return 'sequential';
 };

 const layoutType = getLayoutType();
 const baseSpacing = { x: 300, y: 150 };

 states.forEach((state, index) => {
  let x, y;

  switch (layoutType) {
   case 'sequential':
    // Simple left-to-right layout
    x = 100 + (index * baseSpacing.x);
    y = 100;
    break;

   case 'branching':
    // Grid layout with staggered positioning for branches
    const columns = Math.min(3, Math.ceil(Math.sqrt(totalNodes)));
    const horizontalSpacing = baseSpacing.x;
    const verticalSpacing = baseSpacing.y;
    const row = Math.floor(index / columns);
    const col = index % columns;
    x = 100 + (col * horizontalSpacing);
    y = 100 + (row * verticalSpacing);
    break;

   case 'hierarchical':
    // More spread out layout for complex workflows
    const columns2 = Math.min(3, Math.ceil(Math.sqrt(totalNodes * 1.2)));
    const horizontalSpacing2 = baseSpacing.x * 1.2;
    const verticalSpacing2 = baseSpacing.y * 1.1;
    const row2 = Math.floor(index / columns2);
    const col2 = index % columns2;
    x = 100 + (col2 * horizontalSpacing2);
    y = 100 + (row2 * verticalSpacing2);
    // Add staggering to reduce visual clutter
    const staggerOffset = (row2 % 2) * (horizontalSpacing2 * 0.3);
    x += staggerOffset;
    break;

   default:
    x = 100 + (index * baseSpacing.x);
    y = 100;
  }

  positions[state.name] = { x, y };
 });

 return positions;
} 
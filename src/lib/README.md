# Serverless Workflow Builder Library

A reusable React library for building serverless workflow editors using React Flow. This library provides pre-built node components, hooks for state management, and utilities for workflow conversion.

## Features

- **Pre-built Node Components**: Ready-to-use React Flow nodes for different workflow states
- **State Management Hooks**: Hooks for history management and workflow state tracking
- **Workflow Conversion**: Utilities to convert between React Flow data and Serverless Workflow specification
- **Styling**: Pre-configured CSS styles for workflow nodes
- **TypeScript Ready**: Full TypeScript support (when converted)

## Installation

```bash
npm install ./src/lib
```

## Quick Start

```jsx
import React from 'react';
import ReactFlow, { ReactFlowProvider } from 'reactflow';
import {
  nodeTypes,
  defaultInitialNodes,
  defaultInitialEdges,
  useHistory,
  useWorkflowState
} from 'serverless-workflow-builder-lib';
import 'reactflow/dist/style.css';

function WorkflowEditor() {
  const {
    nodes,
    edges,
    updateNodes,
    updateEdges,
    hasChanges
  } = useWorkflowState(defaultInitialNodes, defaultInitialEdges);

  const {
    state: historyState,
    setState: setHistoryState,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory({
    nodes: defaultInitialNodes,
    edges: defaultInitialEdges,
    workflowMetadata: {}
  });

  return (
    <ReactFlowProvider>
      <div style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={updateNodes}
          onEdgesChange={updateEdges}
        />
      </div>
    </ReactFlowProvider>
  );
}

export default WorkflowEditor;
```

## Components

### Node Components

The library provides the following pre-built node components:

- **StartNode**: Entry point for workflows
- **OperationNode**: Represents operation states with actions
- **SwitchNode**: Conditional branching with data/event conditions
- **EventNode**: Event-based states with timeouts
- **SleepNode**: Delay states with configurable duration
- **EndNode**: Terminal states for workflows

#### Usage

```jsx
import { nodeTypes } from 'serverless-workflow-builder-lib';

// Use with React Flow
<ReactFlow nodeTypes={nodeTypes} />
```

#### Individual Component Import

```jsx
import {
  StartNode,
  OperationNode,
  SwitchNode,
  EventNode,
  EndNode,
  SleepNode
} from 'serverless-workflow-builder-lib';
```

## Hooks

### useHistory

Provides undo/redo functionality for workflow state management.

```jsx
import { useHistory } from 'serverless-workflow-builder-lib';

const {
  state,           // Current state
  setState,        // Update state (adds to history)
  undo,           // Undo last change
  redo,           // Redo last undone change
  canUndo,        // Boolean: can undo
  canRedo,        // Boolean: can redo
  reset           // Reset to initial state
} = useHistory(initialState);
```

#### Parameters
- `initialState`: Initial state object (typically contains nodes, edges, workflowMetadata)

#### Example

```jsx
const { state, setState, undo, redo, canUndo, canRedo } = useHistory({
  nodes: [],
  edges: [],
  workflowMetadata: {}
});

// Update state
setState({ nodes: newNodes, edges: newEdges, workflowMetadata });

// Undo/Redo
if (canUndo) undo();
if (canRedo) redo();
```

### useWorkflowState

Tracks workflow state and React Flow configuration with change detection.

```jsx
import { useWorkflowState } from 'serverless-workflow-builder-lib';

const {
  nodes,                    // Current nodes
  edges,                    // Current edges
  workflowMetadata,         // Current metadata
  hasChanges,              // Boolean: has unsaved changes
  lastUpdateTimestamp,     // Last update timestamp
  updateNodes,             // Update nodes
  updateEdges,             // Update edges
  updateWorkflowMetadata,  // Update metadata
  resetToInitialState,     // Reset to initial state
  markAsSaved,             // Mark current state as saved
  subscribeToChanges,      // Subscribe to change events
  getReactFlowConfig,      // Get React Flow configuration
  fitView,                 // Fit view to all nodes
  centerOnNode,            // Center view on specific node
  getWorkflowStats,        // Get workflow statistics
  reactFlowInstance        // React Flow instance
} = useWorkflowState(initialNodes, initialEdges, initialMetadata);
```

#### Parameters
- `initialNodes`: Initial nodes array (default: [])
- `initialEdges`: Initial edges array (default: [])
- `initialMetadata`: Initial metadata object (default: {})

#### Example

```jsx
const {
  nodes,
  edges,
  hasChanges,
  updateNodes,
  subscribeToChanges,
  getWorkflowStats
} = useWorkflowState(defaultInitialNodes, defaultInitialEdges);

// Subscribe to changes
useEffect(() => {
  const unsubscribe = subscribeToChanges((state) => {
    console.log('Workflow changed:', state);
  });
  return unsubscribe;
}, [subscribeToChanges]);

// Get statistics
const stats = getWorkflowStats();
console.log(`Total nodes: ${stats.totalNodes}`);
```

## Utilities

### Workflow Conversion

Utilities for converting between React Flow data and Serverless Workflow specification.

```jsx
import {
  createServerlessWorkflow,
  createReactFlowData,
  convertNodeToState,
  getNodeStateName
} from 'serverless-workflow-builder-lib';
```

#### createServerlessWorkflow

Converts React Flow data to Serverless Workflow specification.

```jsx
const workflow = createServerlessWorkflow(nodes, edges, workflowMetadata, workflowInfo);
```

**Parameters:**
- `nodes`: Array of React Flow nodes
- `edges`: Array of React Flow edges
- `workflowMetadata`: Workflow metadata object
- `workflowInfo`: Workflow information (id, version, name, description)

#### createReactFlowData

Creates React Flow compatible data structure.

```jsx
const reactFlowData = createReactFlowData(nodes, edges, workflowMetadata, workflowInfo);
```

#### convertNodeToState

Converts a single React Flow node to a workflow state.

```jsx
const state = convertNodeToState(node, edges, allNodes, workflowMetadata);
```

## Default Exports

### nodeTypes

Pre-configured node types object for React Flow:

```jsx
import { nodeTypes } from 'serverless-workflow-builder-lib';

// Contains:
// {
//   operation: OperationNode,
//   switch: SwitchNode,
//   start: StartNode,
//   end: EndNode,
//   event: EventNode,
//   sleep: SleepNode
// }
```

### Default Initial State

```jsx
import {
  defaultInitialNodes,
  defaultInitialEdges
} from 'serverless-workflow-builder-lib';

// defaultInitialNodes contains a single start node
// defaultInitialEdges is an empty array
```

## Styling

The library includes pre-configured CSS styles. Import them in your application:

```jsx
import 'serverless-workflow-builder-lib'; // Automatically imports styles
```

Or import styles manually:

```jsx
import 'serverless-workflow-builder-lib/src/styles/NodeStyles.css';
```

## Node Data Structure

Each node type expects specific data structures:

### StartNode
```jsx
{
  id: 'start-1',
  type: 'start',
  position: { x: 100, y: 100 },
  data: { label: 'Start' }
}
```

### OperationNode
```jsx
{
  id: 'operation-1',
  type: 'operation',
  position: { x: 200, y: 100 },
  data: {
    name: 'My Operation',
    actions: [{
      name: 'action1',
      functionRef: { refName: 'myFunction' }
    }],
    metadata: {}
  }
}
```

### SwitchNode
```jsx
{
  id: 'switch-1',
  type: 'switch',
  position: { x: 300, y: 100 },
  data: {
    name: 'My Switch',
    conditionType: 'data', // or 'event'
    dataConditions: [{
      condition: '${ .age > 18 }',
      transition: { nextState: 'adult' }
    }],
    defaultCondition: {
      transition: { nextState: 'default' }
    }
  }
}
```

## Dependencies

Peer dependencies that must be installed in your project:

- `react` (>=16.8.0)
- `react-dom` (>=16.8.0)
- `reactflow` (>=11.0.0)
- `uuid` (>=9.0.0)

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## Support

For issues and questions, please use the GitHub issue tracker.
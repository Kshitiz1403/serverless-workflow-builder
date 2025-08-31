# Usage Guide

## Quick Start

### 1. Basic Setup

```jsx
import React from 'react';
import ReactFlow, { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

import {
  nodeTypes,
  defaultInitialNodes,
  defaultInitialEdges,
  useWorkflowState,
} from 'serverless-workflow-builder-lib';

function MyWorkflowEditor() {
  const {
    nodes,
    edges,
    updateNodes,
    updateEdges,
  } = useWorkflowState(
    defaultInitialNodes,
    defaultInitialEdges
  );

  return (
    <ReactFlowProvider>
      <div style={{ height: '500px' }}>
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
```

### 2. Adding Undo/Redo Functionality

```jsx
import { useHistory } from 'serverless-workflow-builder-lib';

function WorkflowEditorWithHistory() {
  const { nodes, edges, updateNodes, updateEdges } = useWorkflowState();
  
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    setState: setHistoryState,
  } = useHistory({ nodes, edges });

  const handleNodesChange = (changes) => {
    updateNodes(changes);
    setHistoryState({ nodes, edges });
  };

  return (
    <div>
      <div>
        <button onClick={undo} disabled={!canUndo}>Undo</button>
        <button onClick={redo} disabled={!canRedo}>Redo</button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
      />
    </div>
  );
}
```

### 3. Exporting Workflows

```jsx
import { createServerlessWorkflow } from 'serverless-workflow-builder-lib';

function WorkflowExporter({ nodes, edges, workflowMetadata }) {
  const exportWorkflow = () => {
    const workflowInfo = {
      id: 'my-workflow',
      version: '1.0',
      name: 'My Workflow',
      description: 'A sample workflow',
    };

    const serverlessWorkflow = createServerlessWorkflow(
      nodes,
      edges,
      workflowMetadata,
      workflowInfo
    );

    console.log(JSON.stringify(serverlessWorkflow, null, 2));
  };

  return <button onClick={exportWorkflow}>Export</button>;
}
```

## Node Types

### Start Node
```jsx
const startNode = {
  id: 'start',
  type: 'start',
  position: { x: 100, y: 100 },
  data: {
    name: 'Start',
    metadata: {}
  }
};
```

### Operation Node
```jsx
const operationNode = {
  id: 'operation-1',
  type: 'operation',
  position: { x: 200, y: 100 },
  data: {
    name: 'Process Data',
    actions: [
      {
        name: 'processAction',
        functionRef: {
          refName: 'processFunction'
        }
      }
    ],
    metadata: {}
  }
};
```

### Switch Node
```jsx
const switchNode = {
  id: 'switch-1',
  type: 'switch',
  position: { x: 300, y: 100 },
  data: {
    name: 'Decision Point',
    dataConditions: [
      {
        name: 'condition1',
        condition: '$.data > 100',
        transition: 'next-state'
      }
    ],
    defaultCondition: {
      transition: 'default-state'
    },
    metadata: {}
  }
};
```

### Event Node
```jsx
const eventNode = {
  id: 'event-1',
  type: 'event',
  position: { x: 400, y: 100 },
  data: {
    name: 'Wait for Event',
    onEvents: [
      {
        eventRefs: ['user-input'],
        actions: [
          {
            name: 'handleEvent',
            functionRef: {
              refName: 'handleUserInput'
            }
          }
        ]
      }
    ],
    metadata: {}
  }
};
```

### Sleep Node
```jsx
const sleepNode = {
  id: 'sleep-1',
  type: 'sleep',
  position: { x: 500, y: 100 },
  data: {
    name: 'Wait 5 seconds',
    duration: 'PT5S',
    metadata: {}
  }
};
```

### End Node
```jsx
const endNode = {
  id: 'end',
  type: 'end',
  position: { x: 600, y: 100 },
  data: {
    name: 'End',
    terminate: true,
    metadata: {}
  }
};
```

## Styling

The library includes default styles, but you can customize them:

```css
/* Override node styles */
.react-flow__node-operation {
  background: #e1f5fe;
  border: 2px solid #0288d1;
}

.react-flow__node-switch {
  background: #fff3e0;
  border: 2px solid #f57c00;
}

/* Custom handle styles */
.react-flow__handle {
  background: #555;
  border: 2px solid #fff;
}
```

## Best Practices

1. **Always wrap your editor in ReactFlowProvider**
2. **Use useWorkflowState for state management**
3. **Implement history tracking for better UX**
4. **Validate node data before export**
5. **Provide meaningful node names and descriptions**
6. **Use proper error handling for workflow operations**

## Common Patterns

### Adding Custom Validation
```jsx
const validateWorkflow = (nodes, edges) => {
  const startNodes = nodes.filter(n => n.type === 'start');
  const endNodes = nodes.filter(n => n.type === 'end');
  
  if (startNodes.length !== 1) {
    throw new Error('Workflow must have exactly one start node');
  }
  
  if (endNodes.length === 0) {
    throw new Error('Workflow must have at least one end node');
  }
  
  // Add more validation logic...
};
```

### Custom Node Addition
```jsx
const addCustomNode = (type, position) => {
  const newNode = {
    id: `${type}-${Date.now()}`,
    type,
    position,
    data: getDefaultDataForType(type)
  };
  
  updateNodes([...nodes, newNode]);
};
```

### Workflow Statistics
```jsx
const { getWorkflowStats } = useWorkflowState();
const stats = getWorkflowStats();

console.log(`Total nodes: ${stats.totalNodes}`);
console.log(`Total edges: ${stats.totalEdges}`);
console.log(`Node types: ${Object.keys(stats.nodeTypes).join(', ')}`);
```
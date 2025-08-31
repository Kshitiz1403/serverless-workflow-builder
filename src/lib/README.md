# Serverless Workflow Builder Library

A reusable React library for building serverless workflow editors using React Flow. This library provides pre-built node components, hooks for state management, and utilities for workflow conversion.

## Features

- **🎯 Pre-built Node Components**: Ready-to-use React Flow nodes for different workflow states (Start, Operation, Switch, Event, Sleep, End)
- **🔄 State Management Hooks**: Comprehensive hooks for workflow state, history management, and edge connections
- **📊 Workflow Conversion**: Bidirectional conversion between React Flow data and Serverless Workflow specification
- **🎨 Smart Edge Styling**: Automatic edge styling with animations, colors, and labels based on node types
- **⏮️ Undo/Redo Support**: Built-in history management with undo/redo functionality
- **📁 Import/Export**: Load and save workflows in standard Serverless Workflow JSON format
- **🎨 Pre-configured Styling**: Beautiful CSS styles for nodes and edges with theme support
- **🔧 Extensible**: Easy to customize and extend with your own node types and styling
- **📱 Responsive**: Works on desktop and mobile devices
- **⚡ Performance Optimized**: Efficient state management and rendering

## Installation

```bash
npm install ./src/lib
```

## Quick Start

```jsx
import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
} from 'reactflow';
import {
  nodeTypes,
  defaultInitialNodes,
  defaultInitialEdges,
  useHistory,
  useWorkflowState,
  useEdgeConnection,
  createServerlessWorkflow,
  convertWorkflowToReactFlow,
} from 'serverless-workflow-builder-lib';
import 'reactflow/dist/style.css';

function WorkflowEditor() {
  const [workflowMetadata, setWorkflowMetadata] = React.useState({
    name: 'My Workflow',
    description: 'A serverless workflow',
    version: '1.0',
  });

  const { nodes, edges, updateNodes, updateEdges } = useWorkflowState(
    defaultInitialNodes,
    defaultInitialEdges,
    workflowMetadata
  );

  const { state: historyState, setState: setHistoryState } = useHistory({
    nodes: defaultInitialNodes,
    edges: defaultInitialEdges,
    workflowMetadata
  });

  const onNodesChange = (changes) => {
    const updatedNodes = applyNodeChanges(changes, nodes);
    updateNodes(updatedNodes);
    setHistoryState({ nodes: updatedNodes, edges, workflowMetadata });
  };

  const onEdgesChange = (changes) => {
    const updatedEdges = applyEdgeChanges(changes, edges);
    updateEdges(updatedEdges);
    setHistoryState({ nodes, edges: updatedEdges, workflowMetadata });
  };

  const onConnect = useEdgeConnection(
    edges,
    updateEdges,
    setHistoryState,
    nodes,
    workflowMetadata
  );

  // Convert current workflow to Serverless Workflow JSON
  const exportWorkflow = () => {
    const workflow = createServerlessWorkflow(nodes, edges, workflowMetadata);
    console.log('Exported workflow:', JSON.stringify(workflow, null, 2));
  };

  // Load workflow from Serverless Workflow JSON
  const loadWorkflow = (workflowJson) => {
    try {
      const { nodes: convertedNodes, edges: convertedEdges } = 
        convertWorkflowToReactFlow(workflowJson);
      updateNodes(convertedNodes);
      updateEdges(convertedEdges);
      setWorkflowMetadata({
        name: workflowJson.name || 'Imported Workflow',
        description: workflowJson.description || 'Imported from JSON',
        version: workflowJson.version || '1.0',
      });
    } catch (error) {
      console.error('Error loading workflow:', error);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <button onClick={exportWorkflow}>Export Workflow</button>
        <input
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const workflow = JSON.parse(event.target.result);
                loadWorkflow(workflow);
              };
              reader.readAsText(file);
            }
          }}
        />
      </div>
      
      {/* Workflow Canvas */}
      <div style={{ width: '100%', height: 'calc(100% - 60px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}

export default App;
```

## Common Use Cases

### Loading a Sample Workflow

```jsx
// Sample Serverless Workflow JSON
const sampleWorkflow = {
  id: 'greeting',
  version: '1.0',
  specVersion: '0.8',
  name: 'Greeting workflow',
  description: 'JSON based greeting workflow',
  start: 'ChooseOnLanguage',
  states: [
    {
      name: 'ChooseOnLanguage',
      type: 'switch',
      dataConditions: [
        {
          name: "English",
          condition: '${ .language == "English" }',
          transition: 'GreetInEnglish'
        },
        {
          name: "Spanish",
          condition: '${ .language == "Spanish" }',
          transition: 'GreetInSpanish'
        }
      ],
      defaultCondition: {
        transition: 'GreetInEnglish'
      }
    },
    {
      name: 'GreetInEnglish',
      type: 'inject',
      data: {
        greeting: 'Hello from JSON Workflow, '
      },
      transition: 'GreetPerson'
    },
    {
      name: 'GreetPerson',
      type: 'inject',
      data: {
        greetingMessage: '${ .greeting + .name }'
      },
      end: true
    }
  ]
};

// Load the workflow
const loadSampleWorkflow = () => {
  try {
    const { nodes: convertedNodes, edges: convertedEdges } = 
      convertWorkflowToReactFlow(sampleWorkflow);
    updateNodes(convertedNodes);
    updateEdges(convertedEdges);
    setWorkflowMetadata({
      name: sampleWorkflow.name,
      description: sampleWorkflow.description,
      version: sampleWorkflow.version,
    });
  } catch (error) {
    console.error('Error loading workflow:', error);
  }
};
```

### Adding Toolbar Actions

```jsx
function WorkflowToolbar({ onExport, onImport, onReset }) {
  return (
    <div style={{ 
      padding: '10px', 
      borderBottom: '1px solid #ccc',
      display: 'flex',
      gap: '10px'
    }}>
      <button 
        onClick={onExport}
        style={{
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Export Workflow
      </button>
      
      <input
        type="file"
        accept=".json"
        onChange={onImport}
        style={{ display: 'none' }}
        id="workflow-import"
      />
      <label 
        htmlFor="workflow-import"
        style={{
          padding: '8px 16px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Import Workflow
      </label>
      
      <button 
        onClick={onReset}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reset
      </button>
    </div>
  );
}
```

### Custom Node Styling

```jsx
// The library includes pre-built styles, but you can customize them
import 'serverless-workflow-builder-lib/styles/NodeStyles.css';
import 'serverless-workflow-builder-lib/styles/EdgeStyles.css';

// Or add your own custom styles
const customNodeStyle = {
  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  border: '2px solid #FF8E53',
  borderRadius: '10px',
  color: 'white'
};
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

## Hooks in Action

### Complete State Management Example

```jsx
import React from 'react';
import {
  useWorkflowState,
  useHistory,
  useEdgeConnection,
  defaultInitialNodes,
  defaultInitialEdges
} from 'serverless-workflow-builder-lib';

function WorkflowWithFullStateManagement() {
  const [workflowMetadata, setWorkflowMetadata] = React.useState({
    name: 'My Workflow',
    description: 'A sample workflow',
    version: '1.0'
  });

  // Main workflow state management
  const { 
    nodes, 
    edges, 
    updateNodes, 
    updateEdges,
    hasChanges 
  } = useWorkflowState(
    defaultInitialNodes, 
    defaultInitialEdges, 
    workflowMetadata
  );

  // History management for undo/redo
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
    workflowMetadata
  });

  // Smart edge connection handling
  const onConnect = useEdgeConnection(
    edges,
    updateEdges,
    setHistoryState,
    nodes,
    workflowMetadata
  );

  // Handle node changes with history tracking
  const handleNodesChange = React.useCallback((changes) => {
    const updatedNodes = applyNodeChanges(changes, nodes);
    updateNodes(updatedNodes);
    setHistoryState({ 
      nodes: updatedNodes, 
      edges, 
      workflowMetadata 
    });
  }, [nodes, edges, workflowMetadata, updateNodes, setHistoryState]);

  // Handle edge changes with history tracking
  const handleEdgesChange = React.useCallback((changes) => {
    const updatedEdges = applyEdgeChanges(changes, edges);
    updateEdges(updatedEdges);
    setHistoryState({ 
      nodes, 
      edges: updatedEdges, 
      workflowMetadata 
    });
  }, [nodes, edges, workflowMetadata, updateEdges, setHistoryState]);

  return (
    <div>
      {/* Toolbar with undo/redo */}
      <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={undo} 
          disabled={!canUndo}
          style={{ 
            padding: '8px 16px',
            backgroundColor: canUndo ? '#2196F3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canUndo ? 'pointer' : 'not-allowed'
          }}
        >
          ↶ Undo
        </button>
        
        <button 
          onClick={redo} 
          disabled={!canRedo}
          style={{ 
            padding: '8px 16px',
            backgroundColor: canRedo ? '#2196F3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canRedo ? 'pointer' : 'not-allowed'
          }}
        >
          ↷ Redo
        </button>
        
        {hasChanges && (
          <span style={{ 
            padding: '8px 16px',
            backgroundColor: '#ff9800',
            color: 'white',
            borderRadius: '4px'
          }}>
            Unsaved Changes
          </span>
        )}
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

### Hook Combinations for Different Use Cases

```jsx
// Minimal setup - just basic workflow editing
const { nodes, edges, updateNodes, updateEdges } = useWorkflowState(
  defaultInitialNodes, 
  defaultInitialEdges
);

// With history - adds undo/redo capability
const { setState: setHistoryState, undo, redo } = useHistory({
  nodes: defaultInitialNodes,
  edges: defaultInitialEdges
});

// With smart edge connections - automatic styling and labeling
const onConnect = useEdgeConnection(
  edges, 
  updateEdges, 
  setHistoryState, 
  nodes, 
  workflowMetadata
);

// Full setup - all features enabled
// (See complete example above)
```

## Hooks API Reference

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

## Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Make sure all peer dependencies are installed
npm install react react-dom reactflow uuid

# Or with yarn
yarn add react react-dom reactflow uuid
```

#### Edges not connecting properly
```jsx
// Make sure you're using the useEdgeConnection hook
import { useEdgeConnection } from 'serverless-workflow-builder-lib';

const onConnect = useEdgeConnection(
  edges,
  updateEdges,
  setHistoryState, // Optional: for history tracking
  nodes,
  workflowMetadata
);

// Pass it to ReactFlow
<ReactFlow onConnect={onConnect} />
```

#### Styles not loading
```jsx
// Make sure to import the CSS file
import 'serverless-workflow-builder-lib/styles/EdgeStyles.css';

// Or import all styles
import 'serverless-workflow-builder-lib/styles/index.css';
```

#### Undo/Redo not working
```jsx
// Make sure to update history state when making changes
const handleNodesChange = (changes) => {
  const newNodes = applyNodeChanges(changes, nodes);
  updateNodes(newNodes);
  
  // Important: Update history state
  setHistoryState({ 
    nodes: newNodes, 
    edges, 
    workflowMetadata 
  });
};
```

#### Performance issues with large workflows
```jsx
// Use React.memo for custom components
const CustomNode = React.memo(({ data }) => {
  return <div>{data.label}</div>;
});

// Debounce frequent updates
import { debounce } from 'lodash';

const debouncedUpdate = debounce((newState) => {
  setHistoryState(newState);
}, 300);
```

### Best Practices

1. **Always use the provided hooks** - They handle state management and edge cases
2. **Import styles** - Don't forget to import the CSS files for proper styling
3. **Handle errors gracefully** - Wrap workflow operations in try-catch blocks
4. **Use TypeScript** - The library includes TypeScript definitions for better development experience
5. **Test your workflows** - Use the conversion utilities to validate your workflow structure

### Performance Tips

- Use `React.memo` for custom node components
- Debounce frequent state updates
- Limit the number of nodes for better performance (recommended: <100 nodes)
- Use the `fitView` prop on ReactFlow for better initial positioning

## Examples Repository

For more examples and advanced use cases, check out our examples repository:
- Basic workflow editor
- Advanced state management
- Custom node types
- Integration with external APIs
- Workflow validation

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## Support

For issues and questions, please use the GitHub issue tracker.
# Serverless Workflow Builder Library

A reusable React library for building serverless workflow editors using React Flow. This library provides pre-built node components, hooks for state management, and utilities for workflow conversion.

## Features

- **🎯 Pre-built Node Components**: Ready-to-use React Flow nodes for different workflow states (Start, Operation, Switch, Event, Sleep, End)
- **🔄 State Management Hooks**: Comprehensive hooks for workflow state, history management, and edge connections
- **🚀 Programmatic Node Creation**: Add, remove, and manipulate workflow nodes programmatically with useWorkflowActions hook
- **🏭 Node Factory Utilities**: Low-level utilities for creating workflow nodes with custom configurations
- **📊 Workflow Conversion**: Bidirectional conversion between React Flow data and Serverless Workflow specification
- **🎨 Smart Edge Styling**: Automatic edge styling with animations, colors, and labels based on node types
- **⏮️ Undo/Redo Support**: Built-in history management with undo/redo functionality
- **📁 Import/Export**: Load and save workflows in standard Serverless Workflow JSON format
- **🎨 Pre-configured Styling**: Beautiful CSS styles for nodes and edges with theme support
- **🔧 Extensible**: Easy to customize and extend with your own node types and styling
- **📱 Responsive**: Works on desktop and mobile devices
- **⚡ Performance Optimized**: Efficient state management and rendering
- **🎛️ Node Properties Panel**: Built-in properties panel for editing node configurations with auto-save
- **🔗 Smart Edge Label Sync**: Automatic synchronization of edge labels with node names and conditions
- **⚙️ Advanced Switch States**: Support for both data and event-based conditions with timeout handling
- **📝 Rich Node Editing**: Comprehensive forms for editing all node types with validation and real-time updates

## Installation

```bash
npm install ./src/lib
```

## Quick Start

The Serverless Workflow Builder Library is designed to work with existing Serverless Workflow specifications. Here are two ways to get started:

### Option 1: Start from Scratch

If you want to create a new workflow from scratch:

```jsx
import React, { useState } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import {
  nodeTypes,
  defaultInitialNodes,
  defaultInitialEdges,
  useWorkflowState,
  useEdgeConnection,
  useHistory,
  useEdgeLabelSync,
  useNodePropertiesPanel,
  NodePropertiesPanel
} from 'serverless-workflow-builder-lib';
import 'reactflow/dist/style.css';
import 'serverless-workflow-builder-lib/dist/style.css';

function App() {
  const { nodes, edges, updateNodes, updateEdges } = useWorkflowState(
    defaultInitialNodes,
    defaultInitialEdges
  );
  
  const { onConnect } = useEdgeConnection(edges, updateEdges);
  const { undo, redo, canUndo, canRedo } = useHistory();
  
  // Automatically sync edge labels with node names
  useEdgeLabelSync(nodes, edges, updateEdges);
  
  // Properties panel for editing nodes
  const nodePropertiesPanel = useNodePropertiesPanel({
    onNodeUpdate: (nodeId, updatedData) => {
      const updatedNodes = nodes.map(node =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...updatedData } } : node
      );
      updateNodes(updatedNodes);
    },
    autoSave: true
  });

  const onNodeClick = (event, node) => {
    nodePropertiesPanel.openPanel(node);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => updateNodes(changes)}
          onEdgesChange={(changes) => updateEdges(changes)}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
        
        {/* Undo/Redo buttons */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
          <button onClick={undo} disabled={!canUndo}>Undo</button>
          <button onClick={redo} disabled={!canRedo}>Redo</button>
        </div>
      </div>
      
      {/* Node Properties Panel */}
      <NodePropertiesPanel {...nodePropertiesPanel} />
    </div>
  );
}

export default App;
```

### Option 2: Import an Existing Serverless Workflow

Converting an existing Serverless Workflow JSON into an editable visual workflow:

```jsx
import React, { useState } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import {
  nodeTypes,
  useWorkflowState,
  useEdgeConnection,
  useHistory,
  useEdgeLabelSync,
  useNodePropertiesPanel,
  NodePropertiesPanel,
  convertWorkflowToReactFlow
} from 'serverless-workflow-builder-lib';
import 'reactflow/dist/style.css';
import 'serverless-workflow-builder-lib/dist/style.css';

// Example Serverless Workflow JSON
const sampleWorkflow = {
  "id": "loan-application",
  "name": "Loan Application Workflow",
  "description": "A workflow for processing loan applications",
  "version": "1.0",
  "specVersion": "0.8",
  "start": "GetLoanApplication",
  "states": [
    {
      "name": "GetLoanApplication",
      "type": "operation",
      "actions": [
        {
          "functionRef": {
            "refName": "getLoanApplicationFunction",
            "arguments": {
              "applicationId": "${ .applicationId }"
            }
          }
        }
      ],
      "transition": "CheckCreditScore"
    },
    {
      "name": "CheckCreditScore",
      "type": "operation",
      "actions": [
        {
          "functionRef": {
            "refName": "checkCreditScoreFunction",
            "arguments": {
              "ssn": "${ .applicant.ssn }"
            }
          }
        }
      ],
      "transition": "CreditDecision"
    },
    {
      "name": "CreditDecision",
      "type": "switch",
      "dataConditions": [
        {
          "name": "HighCreditScore",
          "condition": "${ .creditScore >= 700 }",
          "transition": "ApproveLoan"
        }
      ],
      "defaultCondition": {
        "transition": "RejectLoan"
      }
    },
    {
      "name": "ApproveLoan",
      "type": "operation",
      "actions": [
        {
          "functionRef": {
            "refName": "approveLoanFunction"
          }
        }
      ],
      "end": true
    },
    {
      "name": "RejectLoan",
      "type": "operation",
      "actions": [
        {
          "functionRef": {
            "refName": "rejectLoanFunction"
          }
        }
      ],
      "end": true
    }
  ]
};

function App() {
  // Convert Serverless Workflow to React Flow format
  const { nodes: initialNodes, edges: initialEdges } = convertWorkflowToReactFlow(sampleWorkflow);
  
  const { nodes, edges, updateNodes, updateEdges } = useWorkflowState(
    initialNodes,
    initialEdges
  );
  
  const { onConnect } = useEdgeConnection(edges, updateEdges);
  const { undo, redo, canUndo, canRedo } = useHistory();
  
  // Automatically sync edge labels with node names and conditions
  useEdgeLabelSync(nodes, edges, updateEdges);
  
  // Properties panel for editing nodes
  const nodePropertiesPanel = useNodePropertiesPanel({
    onNodeUpdate: (nodeId, updatedData) => {
      const updatedNodes = nodes.map(node =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...updatedData } } : node
      );
      updateNodes(updatedNodes);
    },
    autoSave: true
  });

  const onNodeClick = (event, node) => {
    nodePropertiesPanel.openPanel(node);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => updateNodes(changes)}
          onEdgesChange={(changes) => updateEdges(changes)}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
        
        {/* Undo/Redo buttons */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
          <button onClick={undo} disabled={!canUndo}>Undo</button>
          <button onClick={redo} disabled={!canRedo}>Redo</button>
        </div>
      </div>
      
      {/* Node Properties Panel */}
      <NodePropertiesPanel {...nodePropertiesPanel} />
    </div>
  );
}

export default App;
```

### Enhanced Quick Start with Properties Panel

For a more complete editor experience with node editing capabilities:

```jsx
import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import {
  nodeTypes,
  defaultInitialNodes,
  defaultInitialEdges,
  useWorkflowState,
  useEdgeConnection,
  useHistory,
  useEdgeLabelSync,
  useNodePropertiesPanel,
  NodePropertiesPanel
} from 'serverless-workflow-builder-lib';
import 'reactflow/dist/style.css';
import 'serverless-workflow-builder-lib/dist/style.css';

function App() {
  const { nodes, edges, updateNodes, updateEdges } = useWorkflowState(
    defaultInitialNodes,
    defaultInitialEdges
  );
  
  const { onConnect } = useEdgeConnection(edges, updateEdges);
  const { undo, redo, canUndo, canRedo } = useHistory();
  useEdgeLabelSync(nodes, edges, updateEdges);
  
  // Properties panel for editing nodes
  const nodePropertiesPanel = useNodePropertiesPanel({
    onNodeUpdate: (nodeId, updatedData) => {
      const updatedNodes = nodes.map(node =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...updatedData } } : node
      );
      updateNodes(updatedNodes);
    },
    autoSave: true
  });

  const onNodeClick = (event, node) => {
    nodePropertiesPanel.openPanel(node);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => updateNodes(changes)}
        onEdgesChange={(changes) => updateEdges(changes)}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      
      {/* Undo/Redo buttons */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
        <button onClick={undo} disabled={!canUndo}>Undo</button>
        <button onClick={redo} disabled={!canRedo}>Redo</button>
      </div>
      
      {/* Properties Panel */}
      <NodePropertiesPanel
        isOpen={nodePropertiesPanel.isOpen}
        node={nodePropertiesPanel.selectedNode}
        formData={nodePropertiesPanel.formData}
        isDirty={nodePropertiesPanel.isDirty}
        onClose={nodePropertiesPanel.closePanel}
        onFieldChange={nodePropertiesPanel.updateField}
        onSave={nodePropertiesPanel.applyChanges}
        onReset={nodePropertiesPanel.resetChanges}
        autoSave={true}
      />
    </div>
  );
}

export default App;
```

## Node Properties Panel

The library includes a built-in properties panel for editing node configurations. This panel provides a comprehensive interface for modifying all node properties with real-time validation and auto-save functionality.

### Properties Panel Features

- **Auto-save**: Automatically saves changes as you type
- **Validation**: Real-time validation of node properties
- **Type-specific forms**: Different forms for each node type (Operation, Switch, Event, etc.)
- **Condition management**: Advanced editing for switch state conditions
- **Timeout support**: Built-in timeout configuration for event-based states
- **Metadata editing**: Support for custom metadata on all nodes

### useNodePropertiesPanel Hook

```jsx
const nodePropertiesPanel = useNodePropertiesPanel({
  onNodeUpdate: (nodeId, updatedData) => {
    // Handle node updates
  },
  autoSave: true, // Enable auto-save (default: false)
  debounceMs: 300 // Auto-save debounce delay (default: 300ms)
});

// Available methods and properties:
const {
  isOpen,           // Boolean: panel open state
  selectedNode,     // Currently selected node
  formData,         // Current form data
  isDirty,          // Boolean: has unsaved changes
  openPanel,        // Function: open panel for node
  closePanel,       // Function: close panel
  updateField,      // Function: update form field
  applyChanges,     // Function: apply changes to node
  resetChanges      // Function: reset form to original values
} = nodePropertiesPanel;
```

## Edge Label Synchronization

The library automatically synchronizes edge labels with node names and switch conditions using the `useEdgeLabelSync` hook.

```jsx
import { useEdgeLabelSync } from 'serverless-workflow-builder-lib';

function WorkflowEditor() {
  const { nodes, edges, updateEdges } = useWorkflowState();
  
  // Automatically sync edge labels
  useEdgeLabelSync(nodes, edges, updateEdges);
  
  // Edge labels will automatically update when:
  // - Node names change
  // - Switch condition names change
  // - Event condition names change
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      // ... other props
    />
  );
}
```

### Label Sync Features

- **Simple edges**: Labels update to `→ {targetNodeName}`
- **Switch conditions**: Labels update to condition names or expressions
- **Event conditions**: Labels update to event names or event references
- **Real-time updates**: Changes are reflected immediately

## Common Use Cases

### Loading a Sample Workflow

```jsx
// Sample Serverless Workflow JSON
const sampleWorkflow = {
    "id": "greeting",
    "version": "1.0",
    "specVersion": "0.8",
    "name": "Greeting workflow",
    "description": "JSON based greeting workflow",
    "start": "ChooseOnLanguage",
    "states": [
        {
            "name": "ChooseOnLanguage",
            "type": "switch",
            "dataConditions": [
                {
                    "name": "English",
                    "condition": "${ .language == \"English\" }",
                    "transition": "GreetInEnglish"
                },
                {
                    "name": "Spanish",
                    "condition": "${ .language == \"Spanish\" }",
                    "transition": "GreetInSpanish"
                }
            ],
            "defaultCondition": {
                "transition": "GreetInEnglish"
            }
        },
        {
            "name": "GreetInEnglish",
            "type": "operation",
            "actions": [
                {
                    "functionRef": {
                        "refName": "Greet",
                        "arguments": {
                            "message": "${ \"Hello\" + .name }"
                        }
                    }
                }
            ],
            "end": true
        },
        {
            "name": "GreetInSpanish",
            "type": "operation",
            "actions": [
                {
                    "functionRef": {
                        "refName": "Greet",
                        "arguments": {
                            "message": "${ \"Hola\" + .name }"
                        }
                    }
                }
            ],
            "end": true
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

### useWorkflowActions

Provides functions to programmatically add, remove, and manipulate workflow nodes.

```jsx
import { useWorkflowActions } from 'serverless-workflow-builder-lib';

const workflowActions = useWorkflowActions(workflowState, historyCallback);

const {
  // Add specific node types
  addOperationNode,     // Add operation node
  addSleepNode,         // Add sleep node
  addEventNode,         // Add event node
  addSwitchNode,        // Add switch node
  addEndNode,           // Add end node
  addStartNode,         // Add start node
  
  // Generic functions
  addNode,              // Add any node type
  removeNode,           // Remove node by ID
  duplicateNode,        // Duplicate existing node
  clearAllNodes,        // Clear all nodes
  
  // Utility
  getDefaultPosition    // Get default position for new nodes
} = workflowActions;
```

#### Parameters
- `workflowState`: The workflow state object from useWorkflowState
- `historyCallback`: Optional callback to update history state

#### Example

```jsx
function WorkflowEditor() {
  const { nodes, edges, workflowMetadata, updateNodes, updateEdges } = useWorkflowState(
    defaultInitialNodes,
    defaultInitialEdges,
    workflowMetadata
  );
  
  const { setState: setHistoryState } = useHistory({
    nodes: defaultInitialNodes,
    edges: defaultInitialEdges,
    workflowMetadata
  });
  
  const workflowActions = useWorkflowActions(
    { nodes, edges, workflowMetadata, updateNodes, updateEdges },
    setHistoryState
  );
  
  return (
    <div>
      {/* Add state buttons */}
      <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
        <button onClick={() => workflowActions.addOperationNode()}>
          + Operation
        </button>
        <button onClick={() => workflowActions.addSleepNode()}>
          + Sleep
        </button>
        <button onClick={() => workflowActions.addEventNode()}>
          + Event
        </button>
        <button onClick={() => workflowActions.addSwitchNode()}>
          + Switch
        </button>
        <button onClick={() => workflowActions.addEndNode()}>
          + End
        </button>
      </div>
      
      {/* Custom positioned node */}
      <button 
        onClick={() => workflowActions.addOperationNode({
          position: { x: 200, y: 300 },
          name: 'Custom Operation',
          actions: [{ name: 'customAction', functionRef: 'myFunction' }]
        })}
      >
        Add Custom Operation
      </button>
      
      {/* Remove node */}
      <button onClick={() => workflowActions.removeNode('node-id')}>
        Remove Node
      </button>
      
      {/* Duplicate node */}
      <button onClick={() => workflowActions.duplicateNode('node-id')}>
        Duplicate Node
      </button>
      
      {/* React Flow component */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        // ... other props
      />
    </div>
  );
}
```

#### Node Creation Options

Each add function accepts an optional options object:

```jsx
// Basic usage
workflowActions.addOperationNode();

// With custom options
workflowActions.addOperationNode({
  position: { x: 100, y: 200 },           // Custom position
  name: 'My Operation',                   // Custom name
  actions: [                              // Custom actions
    { name: 'action1', functionRef: 'func1' }
  ],
  metadata: { custom: 'data' }            // Custom metadata
});

// Sleep node with duration
workflowActions.addSleepNode({
  name: 'Wait 5 seconds',
  duration: 'PT5S'
});

// Event node with events
workflowActions.addEventNode({
  name: 'Wait for Order',
  onEvents: [{
    eventRefs: ['order.created']
  }]
});
```

## Node Factory Utilities

Low-level utilities for creating workflow nodes programmatically.

```jsx
import {
  createOperationNode,
  createSleepNode,
  createEventNode,
  createSwitchNode,
  createEndNode,
  createStartNode,
  createNode,
  generateNodeId,
  getDefaultPosition
} from 'serverless-workflow-builder-lib';
```

### Individual Node Creators

```jsx
// Create specific node types
const operationNode = createOperationNode({
  position: { x: 100, y: 200 },
  name: 'Process Order',
  actions: [{ name: 'processOrder', functionRef: 'orderProcessor' }]
});

const sleepNode = createSleepNode({
  position: { x: 200, y: 300 },
  name: 'Wait',
  duration: 'PT30S'
});

const eventNode = createEventNode({
  position: { x: 300, y: 400 },
  name: 'Wait for Event',
  onEvents: [{ eventRefs: ['user.action'] }]
});
```

### Generic Node Creator

```jsx
// Create any node type
const node = createNode('operation', {
  position: { x: 100, y: 200 },
  name: 'My Node',
  // ... type-specific options
});
```

### Utility Functions

```jsx
// Generate unique node ID
const nodeId = generateNodeId(); // Returns: 'node-1234567890'

// Get default position for new nodes
const position = getDefaultPosition(existingNodes);
// Returns: { x: number, y: number }
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

The library provides several default exports for quick setup:

### nodeTypes

Pre-configured node types for React Flow:

```jsx
import { nodeTypes } from 'serverless-workflow-builder-lib';

// Contains:
// {
//   start: StartNode,
//   operation: OperationNode,
//   switch: SwitchNode,
//   event: EventNode,
//   sleep: SleepNode,
//   end: EndNode
// }
```

### defaultInitialNodes and defaultInitialEdges

Default workflow setup with Start and End nodes:

```jsx
import { defaultInitialNodes, defaultInitialEdges } from 'serverless-workflow-builder-lib';

// Use as initial state for your workflow
const [nodes, setNodes] = useState(defaultInitialNodes);
const [edges, setEdges] = useState(defaultInitialEdges);
```

## Complete API Reference

### Components

- `StartNode` - Start state node component
- `OperationNode` - Operation state node component  
- `SwitchNode` - Switch state node component
- `EventNode` - Event state node component
- `SleepNode` - Sleep state node component
- `EndNode` - End state node component
- `NodePropertiesPanel` - Properties panel for editing nodes

### Hooks

- `useHistory` - Undo/redo functionality
- `useWorkflowState` - Main workflow state management
- `useEdgeConnection` - Edge connection handling
- `useWorkflowActions` - Programmatic node manipulation
- `useNodePropertiesPanel` - Properties panel state management
- `useEdgeLabelSync` - Automatic edge label synchronization

### Utilities

- `createServerlessWorkflow` - Convert React Flow data to Serverless Workflow
- `createReactFlowData` - Convert Serverless Workflow to React Flow data
- `convertWorkflowToReactFlow` - Enhanced workflow conversion with positioning
- `convertNodeToState` - Convert individual nodes to workflow states
- `createOperationNode` - Create operation nodes
- `createNode` - Generic node creation utility

### Default Exports

- `nodeTypes` - Pre-configured node types object
- `defaultInitialNodes` - Default starting nodes
- `defaultInitialEdges` - Default starting edges

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

## Working Example

A complete working example is available in the `test-library` directory of this repository. This example demonstrates all the library features in action:

### Features Demonstrated

- **Complete workflow editor** with all node types
- **Node properties panel** for editing node configurations
- **Automatic edge label synchronization**
- **Undo/redo functionality** with history management
- **Import/export workflows** in Serverless Workflow format
- **Programmatic node creation** with toolbar buttons
- **Real-time workflow validation**
- **Complex workflow examples** including loan processing workflows

### Running the Example

```bash
# Navigate to the test library
cd test-library

# Install dependencies
npm install

# Start the development server
npm start
```

The example will be available at `http://localhost:3001` and includes:

- A fully functional workflow editor
- Sample workflows you can load and modify
- All node types with their respective property forms
- Export functionality to download workflows as JSON
- Comprehensive demonstration of all library capabilities

### Example Code Structure

The test library shows how to:

```jsx
// Complete integration example
import {
  nodeTypes,
  defaultInitialNodes,
  defaultInitialEdges,
  useHistory,
  useWorkflowState,
  useEdgeConnection,
  useWorkflowActions,
  useNodePropertiesPanel,
  useEdgeLabelSync,
  NodePropertiesPanel,
  createServerlessWorkflow,
  convertWorkflowToReactFlow
} from 'serverless-workflow-builder-lib';

function WorkflowEditor() {
  // State management
  const { nodes, edges, updateNodes, updateEdges } = useWorkflowState();
  const { undo, redo, canUndo, canRedo } = useHistory();
  
  // Edge connections and labels
  const { onConnect } = useEdgeConnection(edges, updateEdges);
  useEdgeLabelSync(nodes, edges, updateEdges);
  
  // Node actions
  const workflowActions = useWorkflowActions(nodes, edges, updateNodes, updateEdges);
  
  // Properties panel
  const nodePropertiesPanel = useNodePropertiesPanel({
    onNodeUpdate: (nodeId, updatedData) => {
      const updatedNodes = nodes.map(node =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...updatedData } } : node
      );
      updateNodes(updatedNodes);
    },
    autoSave: true
  });
  
  // ... rest of component implementation
}
```

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
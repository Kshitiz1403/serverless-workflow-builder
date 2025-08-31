import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  nodeTypes,
  defaultInitialNodes,
  defaultInitialEdges,
  useHistory,
  useWorkflowState,
  createServerlessWorkflow,
} from '../src';

/**
 * Basic Workflow Editor Example
 * 
 * This example demonstrates how to use the serverless-workflow-builder-lib
 * to create a simple workflow editor with undo/redo functionality.
 */
function BasicWorkflowEditor() {
  // Initialize workflow state with library hooks
  const {
    nodes,
    edges,
    workflowMetadata,
    hasChanges,
    updateNodes,
    updateEdges,
    getWorkflowStats,
    fitView,
  } = useWorkflowState(
    defaultInitialNodes,
    defaultInitialEdges,
    {
      name: 'Example Workflow',
      description: 'A simple workflow example',
      version: '1.0.0',
    }
  );

  // History management for undo/redo
  const {
    state: historyState,
    setState: setHistoryState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory({
    nodes: defaultInitialNodes,
    edges: defaultInitialEdges,
    workflowMetadata: {
      name: 'Example Workflow',
      description: 'A simple workflow example',
      version: '1.0.0',
    },
  });

  // State for workflow export
  const [exportedWorkflow, setExportedWorkflow] = useState(null);

  // Handle node changes with history tracking
  const onNodesChange = useCallback(
    (changes) => {
      updateNodes(changes);
      // Update history
      setHistoryState({
        nodes: nodes,
        edges: edges,
        workflowMetadata,
      });
    },
    [updateNodes, nodes, edges, workflowMetadata, setHistoryState]
  );

  // Handle edge changes with history tracking
  const onEdgesChange = useCallback(
    (changes) => {
      updateEdges(changes);
      // Update history
      setHistoryState({
        nodes: nodes,
        edges: edges,
        workflowMetadata,
      });
    },
    [updateEdges, nodes, edges, workflowMetadata, setHistoryState]
  );

  // Handle new connections
  const onConnect = useCallback(
    (params) => {
      const newEdges = addEdge(params, edges);
      updateEdges(newEdges);
      setHistoryState({
        nodes: nodes,
        edges: newEdges,
        workflowMetadata,
      });
    },
    [edges, updateEdges, nodes, workflowMetadata, setHistoryState]
  );

  // Handle undo
  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      updateNodes(previousState.nodes);
      updateEdges(previousState.edges);
    }
  }, [undo, updateNodes, updateEdges]);

  // Handle redo
  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      updateNodes(nextState.nodes);
      updateEdges(nextState.edges);
    }
  }, [redo, updateNodes, updateEdges]);

  // Export workflow to Serverless Workflow format
  const handleExport = useCallback(() => {
    const workflowInfo = {
      id: 'example-workflow',
      version: '1.0',
      name: workflowMetadata.name || 'Example Workflow',
      description: workflowMetadata.description || 'Generated workflow',
    };

    const serverlessWorkflow = createServerlessWorkflow(
      nodes,
      edges,
      workflowMetadata,
      workflowInfo
    );

    setExportedWorkflow(JSON.stringify(serverlessWorkflow, null, 2));
  }, [nodes, edges, workflowMetadata]);

  // Add a new operation node
  const addOperationNode = useCallback(() => {
    const newNode = {
      id: `operation-${Date.now()}`,
      type: 'operation',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        name: 'New Operation',
        actions: [
          {
            name: 'defaultAction',
            functionRef: {
              refName: 'myFunction',
            },
          },
        ],
        metadata: {},
      },
    };

    const newNodes = [...nodes, newNode];
    updateNodes(newNodes);
    setHistoryState({
      nodes: newNodes,
      edges: edges,
      workflowMetadata,
    });
  }, [nodes, edges, workflowMetadata, updateNodes, setHistoryState]);

  // Get workflow statistics
  const stats = getWorkflowStats();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '10px',
          borderBottom: '1px solid #ccc',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <button onClick={handleUndo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={handleRedo} disabled={!canRedo}>
          Redo
        </button>
        <button onClick={addOperationNode}>Add Operation</button>
        <button onClick={() => fitView()}>Fit View</button>
        <button onClick={handleExport}>Export Workflow</button>
        
        <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
          Nodes: {stats.totalNodes} | Edges: {stats.totalEdges}
          {hasChanges && <span style={{ color: 'orange' }}> • Unsaved changes</span>}
        </div>
      </div>

      {/* Main editor area */}
      <div style={{ flex: 1, display: 'flex' }}>
        {/* React Flow Editor */}
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Export panel */}
        {exportedWorkflow && (
          <div
            style={{
              width: '400px',
              borderLeft: '1px solid #ccc',
              padding: '10px',
              backgroundColor: '#f9f9f9',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <h3>Exported Workflow</h3>
              <button onClick={() => setExportedWorkflow(null)}>×</button>
            </div>
            <pre
              style={{
                fontSize: '12px',
                backgroundColor: 'white',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '500px',
              }}
            >
              {exportedWorkflow}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Wrapper component with ReactFlowProvider
 */
function BasicWorkflowEditorWrapper() {
  return (
    <ReactFlowProvider>
      <BasicWorkflowEditor />
    </ReactFlowProvider>
  );
}

export default BasicWorkflowEditorWrapper;
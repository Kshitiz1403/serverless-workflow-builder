// Serverless Workflow Builder Library
// Main entry point for the library exports

// Node Components
import StartNodeComponent from './components/nodes/StartNode';
import OperationNodeComponent from './components/nodes/OperationNode';
import SwitchNodeComponent from './components/nodes/SwitchNode';
import EventNodeComponent from './components/nodes/EventNode';
import EndNodeComponent from './components/nodes/EndNode';
import SleepNodeComponent from './components/nodes/SleepNode';

export { default as StartNode } from './components/nodes/StartNode';
export { default as OperationNode } from './components/nodes/OperationNode';
export { default as SwitchNode } from './components/nodes/SwitchNode';
export { default as EventNode } from './components/nodes/EventNode';
export { default as EndNode } from './components/nodes/EndNode';
export { default as SleepNode } from './components/nodes/SleepNode';

// Hooks
export { useHistory } from './hooks/useHistory';
export { useWorkflowState } from './hooks/useWorkflowState';

// Utilities
export {
  getNodeStateName,
  convertNodeToState,
  getTransition,
  getTargetStateName,
  hasEndNodeTarget,
  createServerlessWorkflow,
  createReactFlowData,
} from './utils/workflowConverter';

// Styles
import './styles/NodeStyles.css';

// Node types configuration for React Flow
export const nodeTypes = {
  operation: OperationNodeComponent,
  switch: SwitchNodeComponent,
  start: StartNodeComponent,
  end: EndNodeComponent,
  event: EventNodeComponent,
  sleep: SleepNodeComponent,
};

// Default initial workflow state
export const defaultInitialNodes = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 100, y: 100 },
    data: { label: 'Start' },
  },
];

export const defaultInitialEdges = [];
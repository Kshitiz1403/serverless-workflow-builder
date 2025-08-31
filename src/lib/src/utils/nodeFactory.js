/**
 * Node Factory Utilities
 * 
 * Provides functions to create workflow nodes programmatically with proper default data structures.
 */

/**
 * Generate a unique node ID
 * @param {string} nodeType - The type of node
 * @returns {string} Unique node ID
 */
export function generateNodeId(nodeType) {
  return `${nodeType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get default position for a new node
 * @param {Array} existingNodes - Array of existing nodes
 * @returns {Object} Position object with x and y coordinates
 */
export function getDefaultPosition(existingNodes = []) {
  // If no nodes exist, place at center
  if (existingNodes.length === 0) {
    return { x: 250, y: 150 };
  }

  // Find a position that doesn't overlap with existing nodes
  const gridSize = 200;
  const maxAttempts = 50;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = 100 + (attempt % 5) * gridSize + Math.random() * 50;
    const y = 100 + Math.floor(attempt / 5) * gridSize + Math.random() * 50;
    
    // Check if this position is too close to existing nodes
    const tooClose = existingNodes.some(node => {
      const distance = Math.sqrt(
        Math.pow(node.position.x - x, 2) + Math.pow(node.position.y - y, 2)
      );
      return distance < 150; // Minimum distance between nodes
    });
    
    if (!tooClose) {
      return { x, y };
    }
  }
  
  // Fallback to random position if no good spot found
  return {
    x: Math.random() * 400 + 100,
    y: Math.random() * 300 + 100
  };
}

/**
 * Create a new operation node
 * @param {Object} options - Configuration options
 * @param {string} options.name - Node name
 * @param {Array} options.actions - Array of actions
 * @param {Object} options.position - Position coordinates
 * @param {Object} options.metadata - Additional metadata
 * @returns {Object} Operation node object
 */
export function createOperationNode(options = {}) {
  const {
    name = 'New Operation',
    actions = [{
      name: 'defaultAction',
      functionRef: {
        refName: 'myFunction',
        arguments: {}
      }
    }],
    position,
    metadata = {}
  } = options;

  const nodeId = generateNodeId('operation');
  
  return {
    id: nodeId,
    type: 'operation',
    position: position || getDefaultPosition(),
    data: {
      name,
      actions,
      metadata,
      label: name
    }
  };
}

/**
 * Create a new sleep node
 * @param {Object} options - Configuration options
 * @param {string} options.name - Node name
 * @param {string} options.duration - Sleep duration (ISO 8601 format)
 * @param {Object} options.position - Position coordinates
 * @param {Object} options.metadata - Additional metadata
 * @returns {Object} Sleep node object
 */
export function createSleepNode(options = {}) {
  const {
    name = 'New Sleep',
    duration = 'PT5S',
    position,
    metadata = {}
  } = options;

  const nodeId = generateNodeId('sleep');
  
  return {
    id: nodeId,
    type: 'sleep',
    position: position || getDefaultPosition(),
    data: {
      name,
      duration,
      metadata,
      label: name
    }
  };
}

/**
 * Create a new event node
 * @param {Object} options - Configuration options
 * @param {string} options.name - Node name
 * @param {Array} options.onEvents - Array of event configurations
 * @param {Object} options.timeouts - Timeout configurations
 * @param {Object} options.position - Position coordinates
 * @param {Object} options.metadata - Additional metadata
 * @returns {Object} Event node object
 */
export function createEventNode(options = {}) {
  const {
    name = 'New Event',
    onEvents = [{
      eventRefs: ['sample-event']
    }],
    timeouts = {},
    position,
    metadata = {}
  } = options;

  const nodeId = generateNodeId('event');
  
  return {
    id: nodeId,
    type: 'event',
    position: position || getDefaultPosition(),
    data: {
      name,
      onEvents,
      timeouts,
      metadata,
      label: name
    }
  };
}

/**
 * Create a new switch node
 * @param {Object} options - Configuration options
 * @param {string} options.name - Node name
 * @param {Array} options.dataConditions - Array of data conditions
 * @param {Array} options.eventConditions - Array of event conditions
 * @param {Object} options.defaultCondition - Default condition
 * @param {Object} options.position - Position coordinates
 * @param {Object} options.metadata - Additional metadata
 * @returns {Object} Switch node object
 */
export function createSwitchNode(options = {}) {
  const {
    name = 'New Switch',
    dataConditions = [{
      condition: '${ .data }',
      transition: {
        nextState: 'NextState'
      }
    }],
    eventConditions = [],
    defaultCondition = {
      transition: {
        nextState: 'DefaultState'
      }
    },
    position,
    metadata = {}
  } = options;

  const nodeId = generateNodeId('switch');
  
  return {
    id: nodeId,
    type: 'switch',
    position: position || getDefaultPosition(),
    data: {
      name,
      dataConditions,
      eventConditions,
      defaultCondition,
      metadata,
      label: name
    }
  };
}

/**
 * Create a new end node
 * @param {Object} options - Configuration options
 * @param {string} options.name - Node name
 * @param {boolean} options.terminate - Whether to terminate the workflow
 * @param {Object} options.position - Position coordinates
 * @param {Object} options.metadata - Additional metadata
 * @returns {Object} End node object
 */
export function createEndNode(options = {}) {
  const {
    name = 'New End',
    terminate = true,
    position,
    metadata = {}
  } = options;

  const nodeId = generateNodeId('end');
  
  return {
    id: nodeId,
    type: 'end',
    position: position || getDefaultPosition(),
    data: {
      name,
      terminate,
      metadata,
      label: name
    }
  };
}

/**
 * Create a new start node
 * @param {Object} options - Configuration options
 * @param {string} options.name - Node name
 * @param {Object} options.position - Position coordinates
 * @param {Object} options.metadata - Additional metadata
 * @returns {Object} Start node object
 */
export function createStartNode(options = {}) {
  const {
    name = 'Start',
    position,
    metadata = {}
  } = options;

  const nodeId = generateNodeId('start');
  
  return {
    id: nodeId,
    type: 'start',
    position: position || getDefaultPosition(),
    data: {
      name,
      metadata,
      label: name
    }
  };
}

/**
 * Factory function to create any type of node
 * @param {string} nodeType - Type of node to create
 * @param {Object} options - Configuration options
 * @returns {Object} Node object
 */
export function createNode(nodeType, options = {}) {
  switch (nodeType) {
    case 'operation':
      return createOperationNode(options);
    case 'sleep':
      return createSleepNode(options);
    case 'event':
      return createEventNode(options);
    case 'switch':
      return createSwitchNode(options);
    case 'end':
      return createEndNode(options);
    case 'start':
      return createStartNode(options);
    default:
      throw new Error(`Unknown node type: ${nodeType}`);
  }
}

/**
 * Get available node types
 * @returns {Array} Array of available node types
 */
export function getAvailableNodeTypes() {
  return ['start', 'operation', 'sleep', 'event', 'switch', 'end'];
}
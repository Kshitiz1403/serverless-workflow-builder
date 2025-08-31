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
 * Generate a unique node name based on existing nodes
 * @param {string} baseNodeType - The base type of node (e.g., 'Operation', 'Switch')
 * @param {Array} existingNodes - Array of existing nodes
 * @returns {string} Unique node name
 */
export function generateUniqueNodeName(baseNodeType, existingNodes = []) {
  const baseName = baseNodeType;
  const existingNames = existingNodes.map(node => node.data?.name || node.data?.label || '').filter(Boolean);
  
  // If base name doesn't exist, use it
  if (!existingNames.includes(baseName)) {
    return baseName;
  }
  
  // Find the next available number
  let counter = 1;
  let candidateName;
  
  do {
    candidateName = `${baseName} ${counter}`;
    counter++;
  } while (existingNames.includes(candidateName));
  
  return candidateName;
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
 * @param {Array} options.existingNodes - Array of existing nodes for unique naming
 * @returns {Object} Operation node object
 */
export function createOperationNode(options = {}) {
  const {
    name,
    actions = [{
      name: 'defaultAction',
      functionRef: {
        refName: 'myFunction',
        arguments: {}
      }
    }],
    position,
    metadata = {},
    existingNodes = []
  } = options;
  
  const nodeName = name || generateUniqueNodeName('Operation', existingNodes);

  const nodeId = generateNodeId('operation');
  
  return {
    id: nodeId,
    type: 'operation',
    position: position || getDefaultPosition(),
    data: {
      name: nodeName,
      actions,
      metadata,
      label: nodeName
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
    name,
    duration = 'PT5S',
    position,
    metadata = {},
    existingNodes = []
  } = options;
  
  const nodeName = name || generateUniqueNodeName('Sleep', existingNodes);
  const nodeId = generateNodeId('sleep');
  
  return {
    id: nodeId,
    type: 'sleep',
    position: position || getDefaultPosition(),
    data: {
      name: nodeName,
      duration,
      metadata,
      label: nodeName
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
    name,
    onEvents = [{
      eventRefs: ['sample-event']
    }],
    timeouts = {},
    position,
    metadata = {},
    existingNodes = []
  } = options;
  
  const nodeName = name || generateUniqueNodeName('Event', existingNodes);
  const nodeId = generateNodeId('event');
  
  return {
    id: nodeId,
    type: 'event',
    position: position || getDefaultPosition(),
    data: {
      name: nodeName,
      onEvents,
      timeouts,
      metadata,
      label: nodeName
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
    name,
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
    metadata = {},
    existingNodes = []
  } = options;
  
  const nodeName = name || generateUniqueNodeName('Switch', existingNodes);

  const nodeId = generateNodeId('switch');
  
  return {
    id: nodeId,
    type: 'switch',
    position: position || getDefaultPosition(),
    data: {
      name: nodeName,
      dataConditions,
      eventConditions,
      defaultCondition,
      metadata,
      label: nodeName
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
    name,
    terminate = true,
    position,
    metadata = {},
    existingNodes = []
  } = options;
  
  const nodeName = name || generateUniqueNodeName('End', existingNodes);
  const nodeId = generateNodeId('end');
  
  return {
    id: nodeId,
    type: 'end',
    position: position || getDefaultPosition(),
    data: {
      name: nodeName,
      terminate,
      metadata,
      label: nodeName
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
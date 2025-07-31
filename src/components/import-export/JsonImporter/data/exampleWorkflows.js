export const exampleWorkflow = {
 id: 'example-workflow',
 version: '1.0',
 name: 'Example Workflow',
 description: 'A simple example workflow',
 start: 'assessUrgency',
 retryPolicies: [
  {
   name: 'simpleRetry',
   delay: 'PT2S',
   maxAttempts: 3,
   increment: 'PT1S',
   multiplier: 2.0,
   maxDelay: 'PT30S',
   jitter: {
    from: 'PT0S',
    to: 'PT1S'
   }
  }
 ],
 states: [
  {
   name: 'assessUrgency',
   type: 'operation',
   retryRef: 'simpleRetry',
   actions: [
    {
     name: 'assess',
     functionRef: {
      refName: 'assessFunction',
      arguments: {
       input: '${.input}',
      },
     },
     actionDataFilter: {
      useResults: true,
      results: '${.assessmentResult}',
      toStateData: '${.urgencyLevel}'
     }
    },
   ],
   transition: {
    nextState: 'makeDecision',
   },
  },
  {
   name: 'makeDecision',
   type: 'switch',
   dataConditions: [
    {
     name: 'highUrgency',
     condition: ".urgency == 'high'",
     transition: {
      nextState: 'processUrgent',
     },
    },
    {
     name: 'lowUrgency',
     condition: ".urgency == 'low'",
     transition: {
      nextState: 'processNormal',
     },
    },
   ],
   defaultCondition: {
    transition: {
     nextState: 'processNormal',
    },
   },
  },
  {
   name: 'processUrgent',
   type: 'operation',
   actions: [
    {
     name: 'urgentAction',
     functionRef: {
      refName: 'urgentProcessor',
      arguments: {},
     },
    },
   ],
   end: true,
  },
  {
   name: 'processNormal',
   type: 'operation',
   actions: [
    {
     name: 'normalAction',
     functionRef: {
      refName: 'normalProcessor',
      arguments: {},
     },
    },
   ],
   end: true,
  },
 ],
}; 
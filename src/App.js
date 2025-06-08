import React from 'react';
import WorkflowEditor from './components/WorkflowEditor';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Serverless Workflow Builder</h1>
      </header>
      <main className="App-main">
        <WorkflowEditor />
      </main>
    </div>
  );
}

export default App;

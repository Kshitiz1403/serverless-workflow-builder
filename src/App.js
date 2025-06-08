import React, { useState, useEffect } from 'react';
import { Moon, Sun, Github } from 'lucide-react';
import WorkflowEditor from './components/WorkflowEditor';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Serverless Workflow Builder</h1>
        <div className="header-controls">
          <a
            href="https://github.com/Kshitiz1403/serverless-workflow-builder"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            title="View on GitHub"
          >
            <Github size={16} />
          </a>
          <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>
      <main className="App-main">
        <WorkflowEditor />
      </main>
    </div>
  );
}

export default App;

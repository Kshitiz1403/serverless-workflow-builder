import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ImportModeSelector from './components/ImportModeSelector';
import FileUploadSection from './components/FileUploadSection';
import JsonInputSection from './components/JsonInputSection';
import { validateAndProcessWorkflow } from './utils/workflowValidator';
import { convertWorkflowToReactFlow } from './utils/workflowConverter';
import './JsonImporter.css';

const JsonImporter = ({ onImport, onClose }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [importMode, setImportMode] = useState('paste');
  const modalRef = useRef(null);

  const handleImport = () => {
    try {
      const { type, nodes, edges, workflowMetadata, workflowData } = validateAndProcessWorkflow(jsonInput);

      if (type === 'react-flow') {
        // Direct import of React Flow format
        onImport(nodes, edges, workflowMetadata);
      } else {
        // Convert serverless workflow format
        const retryPolicyNameToId = {};
        const retryPolicies = (workflowData.retries || workflowData.retryPolicies || []).map(policy => {
          const id = uuidv4();
          retryPolicyNameToId[policy.name] = id;
          return { ...policy, id };
        });

        const { nodes: convertedNodes, edges: convertedEdges } = convertWorkflowToReactFlow(workflowData, retryPolicyNameToId);
        const metadata = { retryPolicies };

        onImport(convertedNodes, convertedEdges, metadata);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Invalid JSON format');
    }
  };

  const handleFileUpload = (content) => {
    setJsonInput(content);
    setError('');
  };

  const handleJsonInputChange = (value) => {
    setJsonInput(value);
  };

  const clearError = () => {
    setError('');
  };

  // Handle escape key and outside click
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="json-importer-overlay">
      <div className="json-importer" ref={modalRef}>
        <div className="importer-header">
          <h2>Import Workflow</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <ImportModeSelector
          importMode={importMode}
          onModeChange={setImportMode}
        />

        <FileUploadSection
          onFileUpload={handleFileUpload}
          visible={importMode === 'file'}
        />

        <JsonInputSection
          jsonInput={jsonInput}
          onJsonInputChange={handleJsonInputChange}
          onClearError={clearError}
        />

        {error && <div className="error-message">{error}</div>}

        <div className="importer-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="import-btn"
            onClick={handleImport}
            disabled={!jsonInput.trim()}
          >
            Import Workflow
          </button>
        </div>
      </div>
    </div>
  );
};

export default JsonImporter;

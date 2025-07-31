import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './JsonExporter.css';

// Import extracted components
import ExportFormatSelector from './components/ExportFormatSelector';
import WorkflowInfoEditor from './components/WorkflowInfoEditor';
import JsonOutput from './components/JsonOutput';

// Import extracted utilities
import { createServerlessWorkflow, createReactFlowData } from './utils/workflowConverter';
import { validateWorkflow } from './utils/exportValidation';

const JsonExporter = ({ nodes, edges, workflowMetadata, onClose }) => {
  const [exportFormat, setExportFormat] = useState('serverless'); // 'serverless' or 'reactflow'
  const [workflowInfo, setWorkflowInfo] = useState({
    id: 'my-workflow',
    version: '1.0',
    name: 'My Workflow',
    description: 'Generated serverless workflow',
  });
  const modalRef = useRef(null);

  // Generate workflow data based on export format
  const serverlessWorkflow = useMemo(() => {
    return createServerlessWorkflow(nodes, edges, workflowMetadata, workflowInfo);
  }, [nodes, edges, workflowInfo, workflowMetadata]);

  const reactFlowData = useMemo(() => {
    return createReactFlowData(nodes, edges, workflowMetadata, workflowInfo);
  }, [nodes, edges, workflowMetadata, workflowInfo]);

  // Validation for missing timeouts
  const validationErrors = useMemo(() => {
    return validateWorkflow(nodes);
  }, [nodes]);

  const currentData = exportFormat === 'serverless' ? serverlessWorkflow : reactFlowData;
  const jsonString = JSON.stringify(currentData, null, 2);

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
    <div className="json-exporter-overlay">
      <div className="json-exporter" ref={modalRef}>
        <div className="exporter-header">
          <h2>Export Workflow</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <ExportFormatSelector
          exportFormat={exportFormat}
          onFormatChange={setExportFormat}
        />

        <WorkflowInfoEditor
          exportFormat={exportFormat}
          workflowInfo={workflowInfo}
          onWorkflowInfoChange={setWorkflowInfo}
        />

        <JsonOutput
          jsonString={jsonString}
          exportFormat={exportFormat}
          workflowInfo={workflowInfo}
          validationErrors={validationErrors}
        />
      </div>
    </div>
  );
};

export default JsonExporter;

import React, { useState, useCallback, useEffect } from 'react';
import JsonView from '@uiw/react-json-view';
import { AlertCircle, CheckCircle, Eye, Edit3, Maximize2, Minimize2 } from 'lucide-react';
import './JsonEditor.css';

const JsonEditor = ({
 value,
 onChange,
 placeholder = '{}',
 label,
 height = '120px',
 allowEdit = true,
 showValidation = true
}) => {
 const [mode, setMode] = useState('edit'); // 'edit' or 'view'
 const [isExpanded, setIsExpanded] = useState(false);
 const [textValue, setTextValue] = useState('');
 const [error, setError] = useState(null);
 const [isValid, setIsValid] = useState(true);

 // Convert value to display format
 const formatValue = useCallback((val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') {
   try {
    JSON.parse(val);
    return val;
   } catch {
    return val;
   }
  }
  return JSON.stringify(val, null, 2);
 }, []);

 // Initialize text value when prop changes
 useEffect(() => {
  setTextValue(formatValue(value));
 }, [value, formatValue]);

 // Parse and validate JSON
 const parseValue = useCallback((text) => {
  if (!text.trim()) {
   setError(null);
   setIsValid(true);
   return {};
  }

  try {
   const parsed = JSON.parse(text);
   setError(null);
   setIsValid(true);
   return parsed;
  } catch (err) {
   setError(err.message);
   setIsValid(false);
   return text; // Return as string if invalid JSON
  }
 }, []);

 // Handle text change in edit mode
 const handleTextChange = useCallback((e) => {
  const newValue = e.target.value;
  setTextValue(newValue);

  const parsed = parseValue(newValue);
  onChange(parsed);
 }, [onChange, parseValue]);

 // Handle JSON view edit (when user edits in the visual editor)
 const handleJsonViewEdit = useCallback((params) => {
  try {
   const newValue = JSON.stringify(params.src, null, 2);
   setTextValue(newValue);
   setError(null);
   setIsValid(true);
   onChange(params.src);
  } catch (err) {
   setError(err.message);
   setIsValid(false);
  }
 }, [onChange]);

 const toggleMode = () => {
  setMode(mode === 'edit' ? 'view' : 'edit');
 };

 const toggleExpand = () => {
  setIsExpanded(!isExpanded);
 };

 const getParsedValue = () => {
  try {
   return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
   return {};
  }
 };

 const actualHeight = isExpanded ? '400px' : height;

 return (
  <div className="json-editor">
   {label && (
    <div className="json-editor-header">
     <label className="json-editor-label">{label}</label>
     <div className="json-editor-controls">
      {showValidation && (
       <div className={`json-validation ${isValid ? 'valid' : 'invalid'}`}>
        {isValid ? (
         <CheckCircle size={14} />
        ) : (
         <AlertCircle size={14} />
        )}
        <span>{isValid ? 'Valid JSON' : 'Invalid JSON'}</span>
       </div>
      )}
      <button
       type="button"
       className="json-control-btn"
       onClick={toggleExpand}
       title={isExpanded ? 'Collapse' : 'Expand'}
      >
       {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
      {allowEdit && (
       <button
        type="button"
        className="json-control-btn"
        onClick={toggleMode}
        title={mode === 'edit' ? 'Switch to Visual View' : 'Switch to Text Editor'}
       >
        {mode === 'edit' ? <Eye size={14} /> : <Edit3 size={14} />}
       </button>
      )}
     </div>
    </div>
   )}

   <div className="json-editor-content" style={{ height: actualHeight }}>
    {mode === 'edit' ? (
     <div className="json-text-editor">
      <textarea
       value={textValue}
       onChange={handleTextChange}
       placeholder={placeholder}
       className={`json-textarea ${!isValid ? 'error' : ''}`}
       spellCheck={false}
       readOnly={!allowEdit}
      />
      {error && (
       <div className="json-error">
        <AlertCircle size={14} />
        <span>{error}</span>
       </div>
      )}
     </div>
    ) : (
     <div className="json-visual-editor">
      <JsonView
       value={getParsedValue()}
       style={{
        backgroundColor: 'var(--surface-color)',
        color: 'var(--text-color)',
        fontSize: '12px',
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
       }}
       displayDataTypes={false}
       displayObjectSize={false}
       enableClipboard={false}
       collapsed={false}
       quotesOnKeys={true}
       indentWidth={2}
       editable={allowEdit ? {
        add: true,
        edit: true,
        delete: true
       } : false}
       onEdit={allowEdit ? handleJsonViewEdit : undefined}
       onAdd={allowEdit ? handleJsonViewEdit : undefined}
       onDelete={allowEdit ? handleJsonViewEdit : undefined}
      />
     </div>
    )}
   </div>
  </div>
 );
};

export default JsonEditor; 
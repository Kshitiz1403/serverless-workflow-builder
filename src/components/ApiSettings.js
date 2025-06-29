import React, { useState, useEffect } from 'react';
import {
 Settings,
 Check,
 X,
 Loader,
 AlertTriangle,
 RefreshCw,
 RotateCcw,
 Wifi,
 WifiOff,
 Clock,
 Repeat,
} from 'lucide-react';
import { useApiConfig } from '../hooks/useApiConfig';
import './ApiSettings.css';

const ApiSettings = ({ isOpen, onClose }) => {
 const {
  config,
  isValid,
  lastValidated,
  updateConfig,
  resetToDefaults,
  validateConnection
 } = useApiConfig();

 const [formData, setFormData] = useState(config);
 const [isValidating, setIsValidating] = useState(false);
 const [validationResult, setValidationResult] = useState(null);
 const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

 useEffect(() => {
  setFormData(config);
  setHasUnsavedChanges(false);
 }, [config]);

 useEffect(() => {
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(config);
  setHasUnsavedChanges(hasChanges);
 }, [formData, config]);

 const handleInputChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  setValidationResult(null); // Clear previous validation when settings change
 };

 const handleSave = () => {
  updateConfig(formData);
  setHasUnsavedChanges(false);
 };

 const handleReset = () => {
  resetToDefaults();
  setValidationResult(null);
 };

 const handleCancel = () => {
  setFormData(config);
  setHasUnsavedChanges(false);
  onClose();
 };

 const handleTestConnection = async () => {
  // Save current changes before testing
  if (hasUnsavedChanges) {
   updateConfig(formData);
  }

  setIsValidating(true);
  setValidationResult(null);

  try {
   const result = await validateConnection();
   setValidationResult(result);
  } catch (error) {
   setValidationResult({
    success: false,
    error: 'Unexpected error during validation'
   });
  } finally {
   setIsValidating(false);
  }
 };

 const formatLastValidated = (timestamp) => {
  if (!timestamp) return 'Never';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
 };

 if (!isOpen) return null;

 return (
  <div className="api-settings-overlay">
   <div className="api-settings-modal">
    <div className="api-settings-header">
     <div className="header-title">
      <Settings size={20} />
      <h2>API Configuration</h2>
     </div>
     <button
      className="close-button"
      onClick={handleCancel}
      title="Close"
     >
      <X size={20} />
     </button>
    </div>

    <div className="api-settings-content">
     {/* Connection Status */}
     <div className="settings-section">
      <h3>Connection Status</h3>
      <div className="connection-status">
       <div className={`status-indicator ${isValid ? 'connected' : 'disconnected'}`}>
        {isValid ? (
         <>
          <Wifi size={16} />
          <span>Connected</span>
         </>
        ) : (
         <>
          <WifiOff size={16} />
          <span>Disconnected</span>
         </>
        )}
       </div>
       <div className="last-validated">
        <Clock size={14} />
        <span>Last checked: {formatLastValidated(lastValidated)}</span>
       </div>
      </div>
     </div>

     {/* API Settings Form */}
     <div className="settings-section">
      <h3>API Endpoint</h3>
      <div className="form-group">
       <label htmlFor="baseUrl">Base URL</label>
       <input
        id="baseUrl"
        type="text"
        value={formData.baseUrl}
        onChange={(e) => handleInputChange('baseUrl', e.target.value)}
        placeholder="http://localhost:3001"
        className="form-input"
       />
       <small className="form-help">
        The base URL of your operations API server
       </small>
      </div>
     </div>

     {/* Advanced Settings */}
     <div className="settings-section">
      <h3>Advanced Settings</h3>
      <div className="form-row">
       <div className="form-group">
        <label htmlFor="timeout">
         <Clock size={14} />
         Request Timeout (ms)
        </label>
        <input
         id="timeout"
         type="number"
         value={formData.timeout}
         onChange={(e) => handleInputChange('timeout', parseInt(e.target.value))}
         min="1000"
         max="120000"
         step="1000"
         className="form-input"
        />
       </div>
       <div className="form-group">
        <label htmlFor="retryAttempts">
         <Repeat size={14} />
         Retry Attempts
        </label>
        <input
         id="retryAttempts"
         type="number"
         value={formData.retryAttempts}
         onChange={(e) => handleInputChange('retryAttempts', parseInt(e.target.value))}
         min="0"
         max="10"
         className="form-input"
        />
       </div>
      </div>
     </div>

     {/* Validation Result */}
     {validationResult && (
      <div className="settings-section">
       <div className={`validation-result ${validationResult.success ? 'success' : 'error'}`}>
        {validationResult.success ? (
         <>
          <Check size={16} />
          <div>
           <strong>Connection successful!</strong>
           {validationResult.data && validationResult.data.operationsCount && (
            <p>Found {validationResult.data.operationsCount} operations available</p>
           )}
          </div>
         </>
        ) : (
         <>
          <AlertTriangle size={16} />
          <div>
           <strong>Connection failed</strong>
           <p>{validationResult.error}</p>
          </div>
         </>
        )}
       </div>
      </div>
     )}

     {/* Unsaved Changes Warning */}
     {hasUnsavedChanges && (
      <div className="settings-section">
       <div className="unsaved-changes-warning">
        <AlertTriangle size={16} />
        <span>You have unsaved changes</span>
       </div>
      </div>
     )}
    </div>

    <div className="api-settings-footer">
     <div className="footer-left">
      <button
       type="button"
       onClick={handleReset}
       className="btn btn-secondary"
       title="Reset to default settings"
      >
       <RotateCcw size={16} />
       Reset to Defaults
      </button>
     </div>

     <div className="footer-right">
      <button
       type="button"
       onClick={handleTestConnection}
       disabled={isValidating}
       className="btn btn-outline"
      >
       {isValidating ? (
        <>
         <Loader size={16} className="animate-spin" />
         Testing...
        </>
       ) : (
        <>
         <RefreshCw size={16} />
         Test Connection
        </>
       )}
      </button>

      <button
       type="button"
       onClick={handleCancel}
       className="btn btn-secondary"
      >
       Cancel
      </button>

      <button
       type="button"
       onClick={handleSave}
       disabled={!hasUnsavedChanges}
       className="btn btn-primary"
      >
       <Check size={16} />
       Save Changes
      </button>
     </div>
    </div>
   </div>
  </div>
 );
};

export default ApiSettings; 
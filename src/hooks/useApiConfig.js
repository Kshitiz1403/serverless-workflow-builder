import { useState, useEffect } from 'react';

const DEFAULT_API_CONFIG = {
 baseUrl: 'http://localhost:3001',
 timeout: 30000,
 retryAttempts: 3,
};

const STORAGE_KEY = 'serverless-workflow-api-config';

export const useApiConfig = () => {
 const [config, setConfig] = useState(() => {
  try {
   const stored = localStorage.getItem(STORAGE_KEY);
   return stored ? { ...DEFAULT_API_CONFIG, ...JSON.parse(stored) } : DEFAULT_API_CONFIG;
  } catch (error) {
   console.error('Error loading API config from localStorage:', error);
   return DEFAULT_API_CONFIG;
  }
 });

 const [isValid, setIsValid] = useState(true);
 const [lastValidated, setLastValidated] = useState(null);

 useEffect(() => {
  try {
   localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
   console.error('Error saving API config to localStorage:', error);
  }
 }, [config]);

 const updateConfig = (updates) => {
  setConfig(prev => ({ ...prev, ...updates }));
  setLastValidated(null); // Reset validation when config changes
 };

 const resetToDefaults = () => {
  setConfig(DEFAULT_API_CONFIG);
  setLastValidated(null);
 };

 const validateConnection = async () => {
  try {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), config.timeout);

   const response = await fetch(`${config.baseUrl}/health`, {
    signal: controller.signal,
    headers: {
     'Accept': 'application/json',
    },
   });

   clearTimeout(timeoutId);

   if (response.ok) {
    const data = await response.json();
    setIsValid(true);
    setLastValidated(new Date().toISOString());
    return { success: true, data };
   } else {
    setIsValid(false);
    return {
     success: false,
     error: `HTTP ${response.status}: ${response.statusText}`
    };
   }
  } catch (error) {
   setIsValid(false);
   let errorMessage = 'Connection failed';

   if (error.name === 'AbortError') {
    errorMessage = 'Connection timeout';
   } else if (error.message.includes('fetch')) {
    errorMessage = 'Network error - check if the server is running';
   } else {
    errorMessage = error.message;
   }

   return { success: false, error: errorMessage };
  }
 };

 const buildUrl = (endpoint) => {
  const baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
 };

 return {
  config,
  isValid,
  lastValidated,
  updateConfig,
  resetToDefaults,
  validateConnection,
  buildUrl,
 };
}; 
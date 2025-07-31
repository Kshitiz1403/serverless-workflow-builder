import React from 'react';

const ValidationWarnings = ({ validationErrors }) => {
 if (validationErrors.length === 0) {
  return null;
 }

 return (
  <div className="validation-warnings">
   <h4>⚠️ Validation Warnings</h4>
   <ul>
    {validationErrors.map((error, index) => (
     <li key={index}>{error}</li>
    ))}
   </ul>
   <p><strong>Note:</strong> Please fix these issues for a complete workflow configuration.</p>
  </div>
 );
};

export default ValidationWarnings; 
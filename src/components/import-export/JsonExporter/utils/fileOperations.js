export async function copyToClipboard(text) {
 try {
  await navigator.clipboard.writeText(text);
  return { success: true };
 } catch (err) {
  console.error('Failed to copy: ', err);
  return { success: false, error: err };
 }
}

export function downloadJsonFile(jsonContent, exportFormat, workflowInfo) {
 const blob = new Blob([jsonContent], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;

 const fileName = exportFormat === 'serverless'
  ? `${workflowInfo.id}.json`
  : `${workflowInfo.name.replace(/\s+/g, '-').toLowerCase()}-layout.json`;

 a.download = fileName;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
} 
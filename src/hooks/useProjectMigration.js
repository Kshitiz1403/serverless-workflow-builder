import { useEffect } from 'react';
import { ProjectStorage } from '../components/ProjectManager';

const OLD_STORAGE_KEY = 'serverless-workflow-editor-state';

export function useProjectMigration() {
 useEffect(() => {
  // Run migration only once
  const migrationCompleted = localStorage.getItem('project-migration-completed');
  if (migrationCompleted) return;

  try {
   // Check if there's existing data in the old format
   const oldData = localStorage.getItem(OLD_STORAGE_KEY);
   if (!oldData) {
    // No old data to migrate, mark migration as completed
    localStorage.setItem('project-migration-completed', 'true');
    return;
   }

   const parsedOldData = JSON.parse(oldData);

   // Check if there are any existing projects
   const existingProjects = ProjectStorage.getAllProjects();
   if (existingProjects.length > 0) {
    // Projects already exist, don't migrate
    localStorage.setItem('project-migration-completed', 'true');
    return;
   }

   // Create a migration project from the old data
   const migrationProject = ProjectStorage.createProject(
    'Migrated Workflow',
    'Workflow migrated from previous version'
   );

   // Update the project data with the old workflow data
   const projectData = {
    nodes: parsedOldData.nodes || [
     {
      id: 'start-1',
      type: 'start',
      position: { x: 100, y: 100 },
      data: { label: 'Start' },
     },
    ],
    edges: parsedOldData.edges || [],
    workflowMetadata: parsedOldData.workflowMetadata || {
     name: 'Migrated Workflow',
     description: 'Workflow migrated from previous version',
     version: '1.0.0',
    },
    lastSaved: parsedOldData.lastSaved || new Date().toISOString(),
   };

   ProjectStorage.saveProjectData(migrationProject.id, projectData);

   // Set this as the current project
   ProjectStorage.setCurrentProjectId(migrationProject.id);

   // Clean up old data
   localStorage.removeItem(OLD_STORAGE_KEY);
   localStorage.setItem('project-migration-completed', 'true');

   console.log('Successfully migrated existing workflow to new project system');
  } catch (error) {
   console.error('Error during project migration:', error);
   // Mark migration as completed even if there was an error to prevent repeated attempts
   localStorage.setItem('project-migration-completed', 'true');
  }
 }, []);
}

export default useProjectMigration; 
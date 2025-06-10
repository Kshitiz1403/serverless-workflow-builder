import React, { useState, useEffect } from 'react';
import {
 FolderOpen,
 Plus,
 Save,
 Trash2,
 Check,
 X,
 Edit3,
 Folder,
 Clock
} from 'lucide-react';
import './ProjectManager.css';

const PROJECT_LIST_KEY = 'serverless-workflow-projects';
const CURRENT_PROJECT_KEY = 'serverless-workflow-current-project';

class ProjectStorage {
 static getAllProjects() {
  try {
   const projects = localStorage.getItem(PROJECT_LIST_KEY);
   return projects ? JSON.parse(projects) : [];
  } catch (error) {
   console.error('Error loading projects:', error);
   return [];
  }
 }

 static saveProjectsList(projects) {
  try {
   localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(projects));
  } catch (error) {
   console.error('Error saving projects list:', error);
  }
 }

 static getCurrentProjectId() {
  return localStorage.getItem(CURRENT_PROJECT_KEY);
 }

 static setCurrentProjectId(projectId) {
  if (projectId) {
   localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
  } else {
   localStorage.removeItem(CURRENT_PROJECT_KEY);
  }
 }

 static getProjectData(projectId) {
  try {
   const projectData = localStorage.getItem(`project-${projectId}`);
   return projectData ? JSON.parse(projectData) : null;
  } catch (error) {
   console.error('Error loading project data:', error);
   return null;
  }
 }

 static saveProjectData(projectId, data) {
  try {
   localStorage.setItem(`project-${projectId}`, JSON.stringify(data));
  } catch (error) {
   console.error('Error saving project data:', error);
  }
 }

 static deleteProjectData(projectId) {
  localStorage.removeItem(`project-${projectId}`);
 }

 static createProject(name, description = '') {
  const projects = this.getAllProjects();
  const projectId = `project-${Date.now()}`;
  const newProject = {
   id: projectId,
   name,
   description,
   created: new Date().toISOString(),
   lastModified: new Date().toISOString(),
  };

  projects.push(newProject);
  this.saveProjectsList(projects);

  // Save initial empty project data
  this.saveProjectData(projectId, {
   nodes: [
    {
     id: 'start-1',
     type: 'start',
     position: { x: 100, y: 100 },
     data: { label: 'Start' },
    },
   ],
   edges: [],
   workflowMetadata: {
    name: name,
    description: description || 'A new serverless workflow',
    version: '1.0.0',
   },
   lastSaved: new Date().toISOString(),
  });

  return newProject;
 }

 static updateProject(projectId, updates) {
  const projects = this.getAllProjects();
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex !== -1) {
   projects[projectIndex] = {
    ...projects[projectIndex],
    ...updates,
    lastModified: new Date().toISOString(),
   };
   this.saveProjectsList(projects);
   return projects[projectIndex];
  }
  return null;
 }

 static deleteProject(projectId) {
  const projects = this.getAllProjects();
  const filteredProjects = projects.filter(p => p.id !== projectId);
  this.saveProjectsList(filteredProjects);
  this.deleteProjectData(projectId);

  // If this was the current project, clear it
  if (this.getCurrentProjectId() === projectId) {
   this.setCurrentProjectId(null);
  }
 }
}

const ProjectManager = ({
 currentProject,
 onProjectSwitch,
 onProjectSave,
 hasUnsavedChanges
}) => {
 const [projects, setProjects] = useState([]);
 const [isCreating, setIsCreating] = useState(false);
 const [isEditing, setIsEditing] = useState(null);
 const [newProjectName, setNewProjectName] = useState('');
 const [newProjectDescription, setNewProjectDescription] = useState('');
 const [editingName, setEditingName] = useState('');
 const [editingDescription, setEditingDescription] = useState('');

 useEffect(() => {
  loadProjects();
 }, []);

 const loadProjects = () => {
  const allProjects = ProjectStorage.getAllProjects();
  setProjects(allProjects);
 };

 const handleCreateProject = () => {
  if (!newProjectName.trim()) return;

  try {
   const newProject = ProjectStorage.createProject(
    newProjectName.trim(),
    newProjectDescription.trim()
   );

   setProjects(prev => [...prev, newProject]);
   setIsCreating(false);
   setNewProjectName('');
   setNewProjectDescription('');

   // Switch to the new project
   onProjectSwitch(newProject.id);
  } catch (error) {
   console.error('Error creating project:', error);
   alert('Failed to create project. Please try again.');
  }
 };

 const handleUpdateProject = (projectId) => {
  if (!editingName.trim()) return;

  try {
   const updatedProject = ProjectStorage.updateProject(projectId, {
    name: editingName.trim(),
    description: editingDescription.trim(),
   });

   if (updatedProject) {
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    setIsEditing(null);
    setEditingName('');
    setEditingDescription('');
   }
  } catch (error) {
   console.error('Error updating project:', error);
   alert('Failed to update project. Please try again.');
  }
 };

 const handleDeleteProject = (projectId) => {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
   try {
    ProjectStorage.deleteProject(projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));

    // If we deleted the current project and there are other projects, switch to the first one
    if (currentProject?.id === projectId) {
     const remainingProjects = projects.filter(p => p.id !== projectId);
     if (remainingProjects.length > 0) {
      onProjectSwitch(remainingProjects[0].id);
     } else {
      onProjectSwitch(null);
     }
    }
   } catch (error) {
    console.error('Error deleting project:', error);
    alert('Failed to delete project. Please try again.');
   }
  }
 };

 const handleSaveCurrentProject = () => {
  if (currentProject) {
   onProjectSave();
  }
 };

 const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
   return 'Just now';
  } else if (diffMinutes < 60) {
   return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
   return `${diffHours}h ago`;
  } else if (diffDays < 7) {
   return `${diffDays}d ago`;
  } else {
   return date.toLocaleDateString();
  }
 };

 const startEditing = (project) => {
  setIsEditing(project.id);
  setEditingName(project.name);
  setEditingDescription(project.description || '');
 };

 const cancelEditing = () => {
  setIsEditing(null);
  setEditingName('');
  setEditingDescription('');
 };

 const cancelCreating = () => {
  setIsCreating(false);
  setNewProjectName('');
  setNewProjectDescription('');
 };

 return (
  <div className="project-manager">
   <div className="project-manager-header">
    <div className="current-project-info">
     {currentProject ? (
      <div className="current-project">
       <Folder size={16} />
       <div className="project-details">
        <span className="project-name">{currentProject.name}</span>
        {hasUnsavedChanges && <span className="unsaved-indicator">•</span>}
       </div>
       <button
        className="save-project-btn"
        onClick={handleSaveCurrentProject}
        disabled={!hasUnsavedChanges}
        title="Save current project"
       >
        <Save size={14} />
       </button>
      </div>
     ) : (
      <div className="no-project">
       <span>No project selected</span>
      </div>
     )}
    </div>

    <button
     className="new-project-btn"
     onClick={() => setIsCreating(true)}
     title="Create new project"
    >
     <Plus size={16} />
     New Project
    </button>
   </div>

   {isCreating && (
    <div className="project-form">
     <div className="form-header">
      <h4>Create New Project</h4>
     </div>
     <div className="form-content">
      <input
       type="text"
       placeholder="Project name"
       value={newProjectName}
       onChange={(e) => setNewProjectName(e.target.value)}
       onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
       autoFocus
      />
      <textarea
       placeholder="Description (optional)"
       value={newProjectDescription}
       onChange={(e) => setNewProjectDescription(e.target.value)}
       rows={2}
      />
      <div className="form-actions">
       <button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
        <Check size={14} />
        Create
       </button>
       <button onClick={cancelCreating}>
        <X size={14} />
        Cancel
       </button>
      </div>
     </div>
    </div>
   )}

   <div className="projects-list">
    <h4>Projects ({projects.length})</h4>
    {projects.length === 0 ? (
     <div className="empty-projects">
      <p>No projects yet. Create your first project!</p>
     </div>
    ) : (
     <div className="projects-grid">
      {projects.map((project) => (
       <div
        key={project.id}
        className={`project-item ${currentProject?.id === project.id ? 'active' : ''}`}
       >
        {isEditing === project.id ? (
         <div className="project-edit-form">
          <input
           type="text"
           value={editingName}
           onChange={(e) => setEditingName(e.target.value)}
           onKeyPress={(e) => e.key === 'Enter' && handleUpdateProject(project.id)}
           autoFocus
          />
          <textarea
           value={editingDescription}
           onChange={(e) => setEditingDescription(e.target.value)}
           rows={2}
           placeholder="Description (optional)"
          />
          <div className="edit-actions">
           <button onClick={() => handleUpdateProject(project.id)} disabled={!editingName.trim()}>
            <Check size={12} />
           </button>
           <button onClick={cancelEditing}>
            <X size={12} />
           </button>
          </div>
         </div>
        ) : (
         <>
          <div
           className="project-content"
           onClick={() => onProjectSwitch(project.id)}
          >
           <div className="project-header">
            <h5>{project.name}</h5>
            <div className="project-actions">
             <button
              className="edit-project-btn"
              onClick={(e) => {
               e.stopPropagation();
               startEditing(project);
              }}
              title="Edit project"
             >
              <Edit3 size={12} />
             </button>
             <button
              className="delete-project-btn"
              onClick={(e) => {
               e.stopPropagation();
               handleDeleteProject(project.id);
              }}
              title="Delete project"
             >
              <Trash2 size={12} />
             </button>
            </div>
           </div>
           {project.description && (
            <p className="project-description">{project.description}</p>
           )}
           <div className="project-meta">
            <span className="project-modified">
             <Clock size={12} />
             {formatTimestamp(project.lastModified)}
            </span>
           </div>
          </div>
         </>
        )}
       </div>
      ))}
     </div>
    )}
   </div>
  </div>
 );
};

export { ProjectStorage };
export default ProjectManager; 
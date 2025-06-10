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
 Clock,
 ChevronLeft,
 ChevronRight,
 Search,
 MoreVertical
} from 'lucide-react';
import { ProjectStorage } from './ProjectManager';
import './ProjectSidebar.css';

const ProjectSidebar = ({
 currentProject,
 onProjectSwitch,
 onProjectSave,
 hasUnsavedChanges,
 isCollapsed,
 onToggleCollapse
}) => {
 const [projects, setProjects] = useState([]);
 const [isCreating, setIsCreating] = useState(false);
 const [isEditing, setIsEditing] = useState(null);
 const [newProjectName, setNewProjectName] = useState('');
 const [newProjectDescription, setNewProjectDescription] = useState('');
 const [editingName, setEditingName] = useState('');
 const [editingDescription, setEditingDescription] = useState('');
 const [searchTerm, setSearchTerm] = useState('');
 const [activeDropdown, setActiveDropdown] = useState(null);

 useEffect(() => {
  loadProjects();
 }, []);

 // Close dropdown when clicking outside
 useEffect(() => {
  const handleClickOutside = () => setActiveDropdown(null);
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
 }, []);

 const loadProjects = () => {
  const allProjects = ProjectStorage.getAllProjects();
  setProjects(allProjects);
 };

 const filteredProjects = projects.filter(project =>
  project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
 );

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
    setActiveDropdown(null);
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
    setActiveDropdown(null);

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
  setActiveDropdown(null);
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

 const toggleDropdown = (e, projectId) => {
  e.stopPropagation();
  setActiveDropdown(activeDropdown === projectId ? null : projectId);
 };

 if (isCollapsed) {
  return (
   <div className="project-sidebar collapsed">
    <div className="project-sidebar-header collapsed">
     <button
      className="toggle-btn"
      onClick={onToggleCollapse}
      title="Expand Projects"
     >
      <ChevronRight size={16} />
     </button>
     <div className="projects-indicator">
      <Folder size={16} />
      <span className="project-count">{projects.length}</span>
     </div>
    </div>

    <div className="collapsed-projects">
     {projects.slice(0, 8).map((project) => (
      <div
       key={project.id}
       className={`collapsed-project-item ${currentProject?.id === project.id ? 'active' : ''}`}
       onClick={() => onProjectSwitch(project.id)}
       title={project.name}
      >
       <div className="project-icon">
        <Folder size={14} />
        {hasUnsavedChanges && currentProject?.id === project.id && (
         <div className="unsaved-dot" />
        )}
       </div>
      </div>
     ))}
     {projects.length > 8 && (
      <div className="more-projects" title={`${projects.length - 8} more projects`}>
       <MoreVertical size={14} />
      </div>
     )}
    </div>
   </div>
  );
 }

 return (
  <div className="project-sidebar">
   <div className="project-sidebar-header">
    <div className="header-title">
     <Folder size={16} />
     <h3>Projects</h3>
     <span className="project-count">({projects.length})</span>
    </div>
    <div className="header-actions">
     <button
      className="new-project-btn"
      onClick={() => setIsCreating(true)}
      title="Create new project"
     >
      <Plus size={16} />
     </button>
     <button
      className="toggle-btn"
      onClick={onToggleCollapse}
      title="Collapse sidebar"
     >
      <ChevronLeft size={16} />
     </button>
    </div>
   </div>

   {currentProject && (
    <div className="current-project-banner">
     <div className="current-project-info">
      <div className="project-name">
       {currentProject.name}
       {hasUnsavedChanges && <span className="unsaved-indicator">•</span>}
      </div>
      <div className="project-status">
       {hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
      </div>
     </div>
     <button
      className="save-current-btn"
      onClick={handleSaveCurrentProject}
      disabled={!hasUnsavedChanges}
      title="Save current project"
     >
      <Save size={14} />
     </button>
    </div>
   )}

   <div className="search-section">
    <div className="search-input-wrapper">
     <Search size={14} />
     <input
      type="text"
      placeholder="Search projects..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="search-input"
     />
    </div>
   </div>

   {isCreating && (
    <div className="create-project-form">
     <div className="form-header">
      <h4>New Project</h4>
     </div>
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
      <button
       onClick={handleCreateProject}
       disabled={!newProjectName.trim()}
       className="create-btn"
      >
       <Check size={14} />
       Create
      </button>
      <button onClick={cancelCreating} className="cancel-btn">
       <X size={14} />
       Cancel
      </button>
     </div>
    </div>
   )}

   <div className="projects-list">
    {filteredProjects.length === 0 ? (
     <div className="empty-projects">
      {searchTerm ? (
       <p>No projects match "{searchTerm}"</p>
      ) : (
       <p>No projects yet. Create your first project!</p>
      )}
     </div>
    ) : (
     <div className="projects-container">
      {filteredProjects.map((project) => (
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
           <button
            onClick={() => handleUpdateProject(project.id)}
            disabled={!editingName.trim()}
            className="save-edit-btn"
           >
            <Check size={12} />
           </button>
           <button onClick={cancelEditing} className="cancel-edit-btn">
            <X size={12} />
           </button>
          </div>
         </div>
        ) : (
         <div
          className="project-content"
          onClick={() => onProjectSwitch(project.id)}
         >
          <div className="project-header">
           <div className="project-title">
            <Folder size={16} />
            <h5>{project.name}</h5>
            {hasUnsavedChanges && currentProject?.id === project.id && (
             <span className="unsaved-dot">•</span>
            )}
           </div>
           <button
            className="project-menu-btn"
            onClick={(e) => toggleDropdown(e, project.id)}
            title="Project options"
           >
            <MoreVertical size={14} />
           </button>

           {activeDropdown === project.id && (
            <div className="project-dropdown">
             <button onClick={() => startEditing(project)}>
              <Edit3 size={12} />
              Edit
             </button>
             <button
              onClick={() => handleDeleteProject(project.id)}
              className="delete-option"
             >
              <Trash2 size={12} />
              Delete
             </button>
            </div>
           )}
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
        )}
       </div>
      ))}
     </div>
    )}
   </div>
  </div>
 );
};

export default ProjectSidebar; 
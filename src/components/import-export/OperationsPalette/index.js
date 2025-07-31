import React, { useState, useEffect, useMemo } from 'react';
import {
 Search,
 Filter,
 Loader,
 RefreshCw,
 Mail,
 Database,
 Zap,
 Globe,
 Settings,
 AlertTriangle,
 Plus,
 Tag,
 ChevronDown,
 ChevronRight,
} from 'lucide-react';
import { useApiConfig } from '../../../hooks/useApiConfig';
import './OperationsPalette.css';

// Icon mapping for operation categories/types
const iconMap = {
 mail: Mail,
 database: Database,
 zap: Zap,
 globe: Globe,
 settings: Settings,
 // Add more icons as needed
};

const OperationsPalette = ({ onDragStart, onAddNode }) => {
 const { buildUrl } = useApiConfig();
 const [operations, setOperations] = useState([]);
 const [categories, setCategories] = useState([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [searchTerm, setSearchTerm] = useState('');
 const [selectedCategory, setSelectedCategory] = useState('all');
 const [expandedCategories, setExpandedCategories] = useState(new Set(['all']));

 // Fetch operations from backend
 const fetchOperations = async () => {
  setLoading(true);
  setError(null);

  try {
   const params = new URLSearchParams();
   if (selectedCategory !== 'all') {
    params.append('category', selectedCategory);
   }
   if (searchTerm) {
    params.append('search', searchTerm);
   }
   params.append('limit', '100'); // Get more operations

   const url = buildUrl(`/api/v1/operations?${params}`);
   const response = await fetch(url);

   if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
   }

   const data = await response.json();
   setOperations(data.operations || []);
   setCategories(data.categories || []);
  } catch (err) {
   console.error('Error fetching operations:', err);
   setError('Failed to load operations. Please check your API configuration.');

   // Fallback to empty state - you might want to show cached/default operations
   setOperations([]);
   setCategories([]);
  } finally {
   setLoading(false);
  }
 };

 // Initial fetch
 useEffect(() => {
  fetchOperations();
 }, []);

 // Refetch when search or category changes (with debounce)
 useEffect(() => {
  const timeoutId = setTimeout(() => {
   fetchOperations();
  }, 300);

  return () => clearTimeout(timeoutId);
 }, [searchTerm, selectedCategory]);

 // Filter and group operations
 const groupedOperations = useMemo(() => {
  const filtered = operations.filter(operation => {
   const matchesSearch = !searchTerm ||
    operation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operation.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

   const matchesCategory = selectedCategory === 'all' || operation.category === selectedCategory;

   return matchesSearch && matchesCategory;
  });

  // Group by category
  const grouped = filtered.reduce((acc, operation) => {
   const category = operation.category || 'uncategorized';
   if (!acc[category]) {
    acc[category] = [];
   }
   acc[category].push(operation);
   return acc;
  }, {});

  return grouped;
 }, [operations, searchTerm, selectedCategory]);

 const handleDragStart = (event, operation) => {
  // Create operation data that will be used to populate the node
  const operationData = {
   id: operation.id,
   name: operation.name,
   description: operation.description,
   category: operation.category,
   tags: operation.tags,
   template: operation.template,
   errorHandling: operation.errorHandling,
   metadata: operation.metadata,
  };

  onDragStart(event, 'operation', operationData);
 };

 const handleAddOperation = (operation) => {
  const operationData = {
   id: operation.id,
   name: operation.name,
   description: operation.description,
   category: operation.category,
   tags: operation.tags,
   template: operation.template,
   errorHandling: operation.errorHandling,
   metadata: operation.metadata,
  };

  onAddNode(operationData);
 };

 const toggleCategory = (categoryId) => {
  const newExpanded = new Set(expandedCategories);
  if (newExpanded.has(categoryId)) {
   newExpanded.delete(categoryId);
  } else {
   newExpanded.add(categoryId);
  }
  setExpandedCategories(newExpanded);
 };

 const getOperationIcon = (operation) => {
  const iconName = operation.icon || 'settings';
  const IconComponent = iconMap[iconName] || Settings;
  return IconComponent;
 };

 const getCategoryInfo = (categoryId) => {
  return categories.find(cat => cat.id === categoryId) || {
   id: categoryId,
   name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
   description: '',
   count: 0
  };
 };

 if (loading && operations.length === 0) {
  return (
   <div className="operations-palette">
    <div className="loading-state">
     <Loader className="animate-spin" size={24} />
     <p>Loading operations...</p>
    </div>
   </div>
  );
 }

 return (
  <div className="operations-palette">
   <div className="operations-header">
    <h3>Operations Library</h3>
    <button
     className="refresh-btn"
     onClick={fetchOperations}
     disabled={loading}
     title="Refresh operations"
    >
     <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
    </button>
   </div>

   <div className="operations-filters">
    <div className="search-box">
     <Search size={16} />
     <input
      type="text"
      placeholder="Search operations..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
     />
    </div>

    <div className="category-filter">
     <Filter size={16} />
     <select
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
     >
      <option value="all">All Categories</option>
      {categories.map(category => (
       <option key={category.id} value={category.id}>
        {category.name} ({category.count})
       </option>
      ))}
     </select>
    </div>
   </div>

   {error && (
    <div className="error-state">
     <AlertTriangle size={20} />
     <p>{error}</p>
     <button onClick={fetchOperations} className="retry-btn">
      Try Again
     </button>
    </div>
   )}

   <div className="operations-list">
    {Object.keys(groupedOperations).length === 0 && !loading && (
     <div className="empty-state">
      <p>No operations found.</p>
      {searchTerm && (
       <button
        onClick={() => setSearchTerm('')}
        className="clear-search-btn"
       >
        Clear search
       </button>
      )}
     </div>
    )}

    {Object.entries(groupedOperations).map(([categoryId, categoryOperations]) => {
     const categoryInfo = getCategoryInfo(categoryId);
     const isExpanded = expandedCategories.has(categoryId);

     return (
      <div key={categoryId} className="operations-category">
       <div
        className="category-header"
        onClick={() => toggleCategory(categoryId)}
       >
        {isExpanded ? (
         <ChevronDown size={16} />
        ) : (
         <ChevronRight size={16} />
        )}
        <span className="category-name">{categoryInfo.name}</span>
        <span className="category-count">({categoryOperations.length})</span>
       </div>

       {isExpanded && (
        <div className="category-operations">
         {categoryOperations.map((operation) => {
          const IconComponent = getOperationIcon(operation);

          return (
           <div
            key={operation.id}
            className="operation-item"
            draggable
            onDragStart={(e) => handleDragStart(e, operation)}
            onClick={() => handleAddOperation(operation)}
            title={operation.description}
           >
            <div className="operation-header">
             <IconComponent size={16} />
             <span className="operation-name">{operation.name}</span>
             <Plus size={14} className="add-icon" />
            </div>

            <p className="operation-description">
             {operation.description}
            </p>

            {operation.tags && operation.tags.length > 0 && (
             <div className="operation-tags">
              {operation.tags.slice(0, 3).map((tag) => (
               <span key={tag} className="operation-tag">
                <Tag size={10} />
                {tag}
               </span>
              ))}
              {operation.tags.length > 3 && (
               <span className="operation-tag more">
                +{operation.tags.length - 3}
               </span>
              )}
             </div>
            )}

            <div className="operation-meta">
             <span className="operation-version">v{operation.version}</span>
             {operation.template && operation.template.actions && (
              <span className="action-count">
               {operation.template.actions.length} action{operation.template.actions.length !== 1 ? 's' : ''}
              </span>
             )}
            </div>
           </div>
          );
         })}
        </div>
       )}
      </div>
     );
    })}
   </div>
  </div>
 );
};

export default OperationsPalette; 
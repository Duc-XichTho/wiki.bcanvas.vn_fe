import React, { useState, useEffect } from 'react';
import { Edit3, Eye, Plus, Pin } from 'lucide-react';
import ResourceCard from './ResourceCard';
import ResourceModal from './ResourceModal';
import EditResourceModal from './EditResourceModal';
import { getSchemaResources, createSetting, updateSetting } from '../../apis/settingService';
import styles from './ResourcePanel.module.css';

const ResourcePanel = ({ currentUser }) => {
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [resources, setResources] = useState([]);
  const [pinnedResourceId, setPinnedResourceId] = useState(null);
  const [resourcesSettingId, setResourcesSettingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load resources from backend
  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoading(true);
        
        const resourcesData = await getSchemaResources('master');
        
        if (resourcesData && resourcesData.setting) {
          
          // Check if the setting is the new format (with pinnedResourceId) or old format (just resources array)
          if (resourcesData.setting.resources && resourcesData.setting.pinnedResourceId !== undefined) {
            // New format: { resources: [...], pinnedResourceId: "..." }
            
            setResources(resourcesData.setting.resources);
            setPinnedResourceId(resourcesData.setting.pinnedResourceId);
            
          } else if (Array.isArray(resourcesData.setting)) {
            // Old format: just resources array
            
            setResources(resourcesData.setting);
            setPinnedResourceId(null);
            
          } else {
            setResources(resourcesData.setting);
            setPinnedResourceId(null);
          }
          setResourcesSettingId(resourcesData.id); // Store the setting ID
        } else {
          // Create DASHBOARD_RESOURCES setting if it doesn't exist
          const defaultResources = [
            {
              id: '1',
              name: 'Dashboard Resources',
              description: 'Comprehensive resource management for dashboard tools and utilities.',
              content1: `# Dashboard Resource Features

## Core Features
- **Resource Management**: Create, edit, and delete resources
- **Markdown Support**: Rich text editing with live preview
- **Icon Integration**: Choose from available icon library
- **Schema Integration**: Resources tied to specific schemas

## Usage
- Click cards to view detailed information
- Edit resources with inline editing
- Add new resources with the "Add New" button`,
              content2: `## Integration Benefits

### For Administrators
- **Centralized Management**: All resources in one place
- **Schema-specific**: Resources can be configured per schema
- **Easy Updates**: Quick editing and content management

### For Users
- **Quick Access**: Find resources easily
- **Rich Content**: Markdown support for detailed information
- **Visual Interface**: Intuitive card-based layout`,
              icon: 'icon1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          
          const newSetting = await updateSetting({
            id: resourcesSettingId,
            type: 'DASHBOARD_RESOURCES',
            setting: {
              resources: defaultResources,
              pinnedResourceId: null
            }
          });
          setResources(defaultResources);
          setPinnedResourceId(null);
          setResourcesSettingId(newSetting.id); // Store the new setting ID
        }
      } catch (error) {
        console.error('Error loading resources:', error);
        setResources([]);
        setPinnedResourceId(null);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  // Sort resources: pinned first, then by created_at (newest first)
  const sortedResources = [...(Array.isArray(resources) ? resources : [])].sort((a, b) => {
    const aIsPinned = a.id === pinnedResourceId;
    const bIsPinned = b.id === pinnedResourceId;
    
    
    // Pinned items come first
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    
    // If both pinned or both not pinned, sort by date
    const dateA = new Date(a.createdAt || a.created_at || 0);
    const dateB = new Date(b.createdAt || b.created_at || 0);
    return dateB - dateA; // Descending order (newest first)
  });


  const handleCardClick = (resource) => {
    setSelectedResource(resource);
    setShowResourceModal(true);
  };

  const handleEditClick = (e, resource) => {
    e.stopPropagation(); // Prevent card click
    setEditingResource(resource);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (e, resource) => {
    e.stopPropagation(); // Prevent card click
    if (window.confirm(`Are you sure you want to delete "${resource.name}"?`)) {
      // Update local state immediately
      const updatedResources = resources.filter(r => r.id !== resource.id);
      setResources(updatedResources);
      
      // If the deleted resource was pinned, unpin it
      const newPinnedResourceId = pinnedResourceId === resource.id ? null : pinnedResourceId;
      setPinnedResourceId(newPinnedResourceId);

      // Save to backend
      try {
        const resourceData = {
          resources: updatedResources,
          pinnedResourceId: newPinnedResourceId
        };
        
        await updateSetting({
          id: resourcesSettingId,
          type: 'DASHBOARD_RESOURCES',
          setting: resourceData
        });
      } catch (error) {
        console.error('Error deleting resource:', error);
        // Rollback on error
        setResources(resources);
        setPinnedResourceId(pinnedResourceId);
      }
    }
  };

  const handlePinClick = async (e, resource) => {
    e.stopPropagation(); // Prevent card click
    const isCurrentlyPinned = resource.id === pinnedResourceId;
    
    if (isCurrentlyPinned) {
      // Unpin the resource
      setPinnedResourceId(null);
      
      // Save to backend
      await savePinnedResourceToBackend(null);
    } else {
      // Pin the resource (unpin any previously pinned resource)
      setPinnedResourceId(resource.id);
      
      // Save to backend
      await savePinnedResourceToBackend(resource.id);
    }
  };

  const savePinnedResourceToBackend = async (newPinnedResourceId) => {
    try {
      const resourceData = {
        resources: resources,
        pinnedResourceId: newPinnedResourceId
      };
      
      await updateSetting({
        id: resourcesSettingId,
        type: 'DASHBOARD_RESOURCES',
        setting: resourceData
      });
    } catch (error) {
      console.error('Error saving pinned resource:', error);
    }
  };

  const handleCloseResourceModal = () => {
    setShowResourceModal(false);
    setSelectedResource(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingResource(null);
  };

  const handleSaveResource = async (updatedResource) => {
    // Update local state immediately
    const updatedResources = resources.map(resource => 
      resource.id === updatedResource.id ? updatedResource : resource
    );
    setResources(updatedResources);

    // Save to backend
    try {
      const resourceData = {
        resources: updatedResources,
        pinnedResourceId: pinnedResourceId
      };
      
      await updateSetting({
        id: resourcesSettingId,
        type: 'DASHBOARD_RESOURCES',
        setting: resourceData
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      // Rollback on error
      setResources(resources);
    }
    
    handleCloseEditModal();
  };

  const handleAddNewResource = async () => {
    const newResource = {
      id: Date.now().toString(), // Simple ID generation
      name: 'New Resource',
      description: 'Enter description here',
      content1: '',
      content2: '',
      icon: 'icon1', // Default icon
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Update local state immediately
    const updatedResources = [...resources, newResource];
    setResources(updatedResources);

    // Save to backend
    try {
      const resourceData = {
        resources: updatedResources,
        pinnedResourceId: pinnedResourceId
      };
      
      await updateSetting({
        id: resourcesSettingId,
        type: 'DASHBOARD_RESOURCES',
        setting: resourceData
      });
    } catch (error) {
      console.error('Error creating resource:', error);
      // Rollback on error
      setResources(resources);
    }
    
    // Open edit modal for the new resource
    setEditingResource(newResource);
    setShowEditModal(true);
  };

  return (
    <div className={styles.resourcePanel}>
      {/*<h3 className={styles.resourcePanelTitle}>*/}
      {/*  Resource Panel*/}
      {/*</h3>*/}

      {/* Always visible red pin indicator in top right corner */}
      {pinnedResourceId && Array.isArray(resources) && (
        <div className={styles.pinnedIndicator}>
          <Pin className={styles.pinnedIndicatorIcon} />
        </div>
      )}

      <div className={styles.resourceList}>
        {loading ? (
          <div className={styles.emptyState}>
            Loading resources...
          </div>
        ) : sortedResources.length === 0 ? (
          <div className={styles.emptyState}>
            No resources available
          </div>
        ) : (
          sortedResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onClick={() => handleCardClick(resource)}
              onEdit={(e) => handleEditClick(e, resource)}
              onDelete={(e) => handleDeleteClick(e, resource)}
              onPin={(e) => handlePinClick(e, resource)}
              isSuperAdmin={currentUser?.isSuperAdmin}
              isPinned={resource.id === pinnedResourceId}
            />
          ))
        )
        }
        
        {/* Add New Card Button - Only visible for superAdmin */}
        {currentUser?.isSuperAdmin && (
          <button
            className={styles.addNewCard}
            onClick={handleAddNewResource}
            title="Add new resource"
          >
            <Plus className={styles.addIcon} />
          </button>
        )}
      </div>

      {/* Resource Detail Modal */}
      {showResourceModal && selectedResource && (
        <ResourceModal
          resource={selectedResource}
          onClose={handleCloseResourceModal}
        />
      )}

      {/* Edit Resource Modal */}
      {showEditModal && editingResource && (
        <EditResourceModal
          resource={editingResource}
          onSave={handleSaveResource}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  );
};

export default ResourcePanel;

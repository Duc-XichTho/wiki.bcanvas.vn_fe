import React from 'react';
import { Edit3, Eye, Trash2, Pin, PinOff } from 'lucide-react';
import styles from './ResourcePanel.module.css';
import { ICON_RESOURCE_LIST } from '../../icon/svg/IconSvg.jsx';

const ResourceCard = ({ resource, onClick, onEdit, onDelete, onPin, isSuperAdmin, isPinned }) => {
  // Helper function to get icon source by ID
  const getIconSrcById = (iconId) => {
    const found = ICON_RESOURCE_LIST.find(item => item.id === iconId);
    return found ? found.icon : undefined;
  };

  return (
    <div
      onClick={onClick}
      className={styles.resourceCard}
    >
      {/* Edit Button - Only visible for superAdmin */}
      {isSuperAdmin && (
        <button
          onClick={onEdit}
          className={styles.toolEditBtn}
          title="Edit resource"
        >
          <Edit3 className={styles.iconEdit} />
        </button>
      )}

      {/* Pin Button - Only visible for superAdmin */}
      {isSuperAdmin && (
        <button
          onClick={onPin}
          className={styles.toolPinBtn}
          title={isPinned ? "Unpin resource" : "Pin resource"}
        >
          {isPinned ? (
            <PinOff className={styles.iconPin} />
          ) : (
            <Pin className={styles.iconPin} />
          )}
        </button>
      )}

      {/* Delete Button - Only visible for superAdmin */}
      {isSuperAdmin && (
        <button
          onClick={onDelete}
          className={styles.toolDeleteBtn}
          title="Delete resource"
        >
          <Trash2 className={styles.iconDelete} />
        </button>
      )}

      {/* Logo/Icon and Name on same line */}
      <div className={styles.headerRow}>
        <div className={styles.logoContainer}>
          {resource.logo ? (
            <img
              src={resource.logo}
              alt="Resource logo"
              className={styles.logoImage}
            />
          ) : resource.icon ? (
            (() => {
              const iconSrc = getIconSrcById(resource.icon);
              return iconSrc ? (
                <img
                  src={iconSrc}
                  alt="Resource icon"
                  className={styles.logoImage}
                />
              ) : (
                <span style={{ fontSize: '20px' }}>{resource.icon}</span>
              );
            })()
          ) : (
            <span>📄</span>
          )}
        </div>

        {/* Name */}
        <h4 className={styles.resourceName}>
          {resource.name}
        </h4>
      </div>

      {/* Description */}
      <p className={styles.resourceDescription}>
        {resource.description}
      </p>

    </div>
  );
};

export default ResourceCard;

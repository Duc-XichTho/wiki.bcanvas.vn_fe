import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import styles from './DropdownMenu.module.css';

const DropdownMenu = ({ onEdit, onDelete, itemName = 'item' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEdit = () => {
    setIsOpen(false);
    onEdit();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete();
  };

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button
        className={styles.dropdownTrigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More options"
      >
        <MoreVertical size={16} />
      </button>
      
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <button
            className={styles.dropdownItem}
            onClick={handleEdit}
          >
            <Edit size={14} />
            <span>Sửa {itemName}</span>
          </button>
          <button
            className={`${styles.dropdownItem} ${styles.deleteItem}`}
            onClick={handleDelete}
          >
            <Trash2 size={14} />
            <span>Xóa {itemName}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;

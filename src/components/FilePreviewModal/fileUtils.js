// File utility functions

// Check if file is previewable
export const isFilePreviewable = (fileExtension) => {
  const supportedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'];
  return supportedExtensions.includes(fileExtension.toLowerCase());
};

// Get file type category
export const getFileTypeCategory = (fileExtension) => {
  const ext = fileExtension.toLowerCase();
  
  if (ext === '.pdf') return 'pdf';
  if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) return 'image';
  if (['.doc', '.docx'].includes(ext)) return 'document';
  return 'unsupported';
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file icon based on extension
export const getFileIcon = (fileExtension) => {
  const ext = fileExtension.toLowerCase();
  
  if (ext === '.pdf') return '📄';
  if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) return '🖼️';
  if (['.doc', '.docx'].includes(ext)) return '📝';
  if (['.xls', '.xlsx'].includes(ext)) return '📊';
  if (['.ppt', '.pptx'].includes(ext)) return '📽️';
  if (['.txt'].includes(ext)) return '📄';
  if (['.zip', '.rar', '.7z'].includes(ext)) return '📦';
  
  return '📎';
};

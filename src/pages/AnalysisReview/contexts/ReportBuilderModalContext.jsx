import React, { createContext, useContext, useState } from 'react';

const ReportBuilderModalContext = createContext();

export const useReportBuilderModal = () => {
  const context = useContext(ReportBuilderModalContext);
  if (!context) {
    throw new Error('useReportBuilderModal must be used within a ReportBuilderModalProvider');
  }
  return context;
};

export const ReportBuilderModalProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
    setIsMinimized(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsMinimized(false);
  };

  const minimizeModal = () => {
    setIsMinimized(true);
  };

  const maximizeModal = () => {
    setIsMinimized(false);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setIsMinimized(false);
  };

  const value = {
    isModalOpen,
    isMinimized,
    openModal,
    closeModal,
    minimizeModal,
    maximizeModal,
    resetModal,
  };

  return (
    <ReportBuilderModalContext.Provider value={value}>
      {children}
    </ReportBuilderModalContext.Provider>
  );
}; 
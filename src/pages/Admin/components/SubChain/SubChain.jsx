import React from 'react';

const SubChain = ({ subChain, onClick, isSelected }) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#d3f4ff' : '#f9f9f9',
        border: '1px solid #ccc',
        borderRadius: '5px',
      }}
    >
      {subChain.name}
    </div>
  );
};

export default SubChain;

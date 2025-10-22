import React from 'react';

const Chain = ({ chain, onClick, isSelected }) => {
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
      {chain.name}
    </div>
  );
};

export default Chain;

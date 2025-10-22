import React from 'react';

const Section = ({ section }) => {
  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ccc',
        borderRadius: '5px',
      }}
    >
      {section.name}
    </div>
  );
};

export default Section;

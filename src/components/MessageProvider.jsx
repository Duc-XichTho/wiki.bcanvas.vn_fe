import React from 'react';
import { useMessageConfig } from '../hooks/useMessageConfig';

const MessageProvider = ({ children }) => {
  useMessageConfig();
  return <>{children}</>;
};

export default MessageProvider; 
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AIJobQueueContext = createContext();

export const useAIJobQueue = () => useContext(AIJobQueueContext);

export const AIJobQueueProvider = ({ children }) => {
  const [queue, setQueue] = useState([]); // [{id, ...jobData}]
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [jobCount, setJobCount] = useState(0);
  const abortControllerRef = useRef(null);
  const isCancelledRef = useRef(false);

  // Add a job to the queue
  const addJob = (job) => {
    const jobWithId = { ...job, id: Date.now() + Math.random() };
    setQueue(q => [...q, jobWithId]);
    setJobCount(q => q + 1);
    return jobWithId.id;
  };

  // Cancel all jobs (including current)
  const cancelAllJobs = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQueue([]);
    setCurrentJob(null);
    setIsProcessing(false);
    setJobCount(0);
  };

  // Cancel a specific job (if running, abort, else remove from queue)
  const cancelJob = (jobId) => {
    if (currentJob && currentJob.id === jobId) {
      isCancelledRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setCurrentJob(null);
      setIsProcessing(false);
    } else {
      setQueue(q => q.filter(j => j.id !== jobId));
      setJobCount(q => Math.max(0, q - 1));
    }
  };

  // Internal: process the queue
  useEffect(() => {
    const processQueue = async () => {
      if (isProcessing || queue.length === 0) return;
      setIsProcessing(true);
      isCancelledRef.current = false;
      const job = queue[0];
      setCurrentJob(job);
      // Example: simulate async job with abort support
      abortControllerRef.current = new AbortController();
      try {
        // Replace this with your actual job logic, pass abortControllerRef.current.signal if needed
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 3000); // Simulate 3s job
          abortControllerRef.current.signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Job cancelled'));
          });
        });
      } catch (e) {
        // Job cancelled or error
      }
      setQueue(q => q.slice(1));
      setCurrentJob(null);
      setIsProcessing(false);
      setJobCount(q => Math.max(0, q - 1));
    };
    if (!isProcessing && queue.length > 0) {
      processQueue();
    }
    // eslint-disable-next-line
  }, [queue, isProcessing]);

  return (
    <AIJobQueueContext.Provider value={{
      queue,
      isProcessing,
      currentJob,
      jobCount: queue.length,
      addJob,
      cancelAllJobs,
      cancelJob,
    }}>
      {children}
    </AIJobQueueContext.Provider>
  );
}; 
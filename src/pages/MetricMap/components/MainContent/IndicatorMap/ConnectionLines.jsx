import React, { useEffect, useRef, useCallback, useState } from 'react';

const ConnectionLines = ({ 
  selectedKPI, 
  currentData, 
  containerRef,
  kpiRefs,
  measureRefs,
  visibleKpiIds = [],
  visibleMeasureIds = []
}) => {
  const svgRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [containerRect, setContainerRect] = useState(null);



  // Main effect to handle container setup and observers
  useEffect(() => {
    if (!containerRef.current) return;

    // Initial container rect setup
    const rect = containerRef.current.getBoundingClientRect();
    setContainerRect(rect);

    // Create ResizeObserver for container
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        const newRect = containerRef.current.getBoundingClientRect();
        setContainerRect(newRect);
      }
    });

    // Create IntersectionObserver for elements
    const intersectionObserver = new IntersectionObserver(() => {
      // Use requestAnimationFrame to avoid excessive updates
      requestAnimationFrame(() => {
        // Recalculate lines directly here to avoid dependency issues
        if (selectedKPI && containerRef.current) {
          const currentRect = containerRef.current.getBoundingClientRect();
          const kpi = currentData.kpis?.find(k => k.id === selectedKPI);
          if (kpi && kpi.measures && Array.isArray(kpi.measures)) {
            const kpiElement = kpiRefs.current[selectedKPI];
            const kpiVisible = visibleKpiIds.length === 0 || visibleKpiIds.includes(selectedKPI);
            if (kpiElement && kpiVisible) {
              const newLines = [];
              kpi.measures.forEach(measureId => {
                const measureElement = measureRefs.current[measureId];
                const measureVisible = visibleMeasureIds.length === 0 || visibleMeasureIds.includes(measureId);
                if (measureElement && measureVisible) {
                  const kpiRect = kpiElement.getBoundingClientRect();
                  const measureRect = measureElement.getBoundingClientRect();
                  const kpiStartX = kpiRect.right - currentRect.left;
                  const kpiStartY = kpiRect.top - currentRect.top + kpiRect.height / 2;
                  const measureEndX = measureRect.left - currentRect.left;
                  const measureEndY = measureRect.top - currentRect.top + measureRect.height / 2;
                  newLines.push({
                    id: `${selectedKPI}-${measureId}`,
                    x1: kpiStartX,
                    y1: kpiStartY,
                    x2: measureEndX,
                    y2: measureEndY
                  });
                }
              });
              setLines(newLines);
            }
          }
        }
      });
    }, {
      root: containerRef.current,
      threshold: 0
    });

    // Observe container
    resizeObserver.observe(containerRef.current);

    // Observe all KPI and measure elements
    Object.values(kpiRefs.current).forEach(el => {
      if (el) intersectionObserver.observe(el);
    });
    Object.values(measureRefs.current).forEach(el => {
      if (el) intersectionObserver.observe(el);
    });

    // Handle scroll events on scrollable containers
    const handleScroll = () => {
      requestAnimationFrame(() => {
        // Recalculate lines directly here to avoid dependency issues
        if (selectedKPI && containerRef.current) {
          const currentRect = containerRef.current.getBoundingClientRect();
          const kpi = currentData.kpis?.find(k => k.id === selectedKPI);
          if (kpi && kpi.measures && Array.isArray(kpi.measures)) {
            const kpiElement = kpiRefs.current[selectedKPI];
            const kpiVisible = visibleKpiIds.length === 0 || visibleKpiIds.includes(selectedKPI);
            if (kpiElement && kpiVisible) {
              const newLines = [];
              kpi.measures.forEach(measureId => {
                const measureElement = measureRefs.current[measureId];
                const measureVisible = visibleMeasureIds.length === 0 || visibleMeasureIds.includes(measureId);
                if (measureElement && measureVisible) {
                  const kpiRect = kpiElement.getBoundingClientRect();
                  const measureRect = measureElement.getBoundingClientRect();
                  const kpiStartX = kpiRect.right - currentRect.left;
                  const kpiStartY = kpiRect.top - currentRect.top + kpiRect.height / 2;
                  const measureEndX = measureRect.left - currentRect.left;
                  const measureEndY = measureRect.top - currentRect.top + measureRect.height / 2;
                  newLines.push({
                    id: `${selectedKPI}-${measureId}`,
                    x1: kpiStartX,
                    y1: kpiStartY,
                    x2: measureEndX,
                    y2: measureEndY
                  });
                }
              });
              setLines(newLines);
            }
          }
        }
      });
    };

    const scrollableContainers = containerRef.current.querySelectorAll('.scrollableContainer');
    scrollableContainers.forEach(container => {
      container.addEventListener('scroll', handleScroll, { passive: true });
    });

    // Handle window resize
    const handleWindowResize = () => {
      if (containerRef.current) {
        const newRect = containerRef.current.getBoundingClientRect();
        setContainerRect(newRect);
      }
    };
    window.addEventListener('resize', handleWindowResize);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      scrollableContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
      });
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [containerRef, kpiRefs, measureRefs, selectedKPI, currentData.kpis]);

  // Update lines when selectedKPI or data changes
  useEffect(() => {
    if (selectedKPI && containerRef.current) {
      const currentRect = containerRef.current.getBoundingClientRect();
      const kpi = currentData.kpis?.find(k => k.id === selectedKPI);
      if (kpi && kpi.measures && Array.isArray(kpi.measures)) {
        const kpiElement = kpiRefs.current[selectedKPI];
        const kpiVisible = visibleKpiIds.length === 0 || visibleKpiIds.includes(selectedKPI);
        if (kpiElement && kpiVisible) {
          const newLines = [];
          kpi.measures.forEach(measureId => {
            const measureElement = measureRefs.current[measureId];
            const measureVisible = visibleMeasureIds.length === 0 || visibleMeasureIds.includes(measureId);
            if (measureElement && measureVisible) {
              const kpiRect = kpiElement.getBoundingClientRect();
              const measureRect = measureElement.getBoundingClientRect();
              const kpiStartX = kpiRect.right - currentRect.left;
              const kpiStartY = kpiRect.top - currentRect.top + kpiRect.height / 2;
              const measureEndX = measureRect.left - currentRect.left;
              const measureEndY = measureRect.top - currentRect.top + measureRect.height / 2;
              newLines.push({
                id: `${selectedKPI}-${measureId}`,
                x1: kpiStartX,
                y1: kpiStartY,
                x2: measureEndX,
                y2: measureEndY
              });
            }
          });
          setLines(newLines);
        }
      }
    } else {
      setLines([]);
    }
  }, [selectedKPI, currentData.kpis, currentData.measures, containerRef, kpiRefs, measureRefs, visibleKpiIds, visibleMeasureIds]);

  if (!containerRef.current || !containerRect) return null;

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerRect.width,
        height: containerRect.height,
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'visible'
      }}
    >
      <defs>
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="30%" stopColor="#16a34a" />
          <stop offset="70%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {lines.map(line => {
        const distance = Math.abs(line.x2 - line.x1);
        const controlPoint1X = line.x1 + distance * 0.3;
        const controlPoint1Y = line.y1;
        const controlPoint2X = line.x2 - distance * 0.3;
        const controlPoint2Y = line.y2;
        
        const pathData = `M ${line.x1} ${line.y1} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${line.x2} ${line.y2}`;
        
        return (
          <g key={line.id}>
            {/* Glow effect */}
            <path
              d={pathData}
              stroke="#22c55e"
              strokeWidth="1.5"
              fill="none"
              filter="url(#glow)"
              opacity="0.4"
            />
            {/* Main line */}
            <path
              d={pathData}
              stroke="url(#connectionGradient)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            {/* Arrow */}
            <defs>
              <marker
                id={`arrow-${line.id}`}
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#15803d" />
              </marker>
            </defs>
            <path
              d={pathData}
              stroke="url(#connectionGradient)"
              strokeWidth="1"
              fill="none"
              markerEnd={`url(#arrow-${line.id})`}
              opacity="0"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default ConnectionLines;

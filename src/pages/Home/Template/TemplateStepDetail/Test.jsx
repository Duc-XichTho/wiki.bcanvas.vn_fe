import React, { useState, useEffect } from 'react';

const MappingInterface = () => {
    // Sample data
    const masterItems = [
        { id: 'M1', name: 'Bán hàng hóa', color: '#3b82f6' },  // blue
        { id: 'M2', name: 'Bán dịch vụ', color: '#10b981' },   // green
        { id: 'M3', name: 'Thu tiền khách hàng', color: '#f59e0b' }, // yellow
    ];

    const childItems = [
        { id: 'C1', name: '511 - Doanh thu bán hàng', masterId: null },
        { id: 'C2', name: '131 - Phải thu khách hàng', masterId: null },
        { id: 'C3', name: '111 - Tiền mặt', masterId: null },
    ];

    const [mappedItems, setMappedItems] = useState(childItems);
    const [connections, setConnections] = useState([]);

    useEffect(() => {
        const newConnections = mappedItems
            .filter(item => item.masterId && item.masterId !== 'none')
            .map(item => ({
                from: masterItems.find(m => m.id === item.masterId),
                to: item
            }));
        setConnections(newConnections);
    }, [mappedItems]);

    const handleMapping = (childId, masterId) => {
        setMappedItems(prev =>
            prev.map(item =>
                item.id === childId
                    ? { ...item, masterId: masterId === 'none' ? null : masterId }
                    : item
            )
        );
    };

    const containerStyle = {
        width: '100%',
        maxWidth: '1400px', // Increased max-width
        margin: '24px auto',
        padding: '24px',
        position: 'relative',
        minHeight: '600px',
    };

    const panelContainerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '200px', // Increased gap between panels
        position: 'relative',
    };

    const panelStyle = {
        width: '45%', // Slightly reduced width to account for larger gap
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        position: 'relative',
        zIndex: 1,
    };

    const itemStyle = {
        padding: '12px',
        margin: '8px 0',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        position: 'relative',
        zIndex: 1,
    };

    const gridContainerStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        alignItems: 'center',
    };

    const headerStyle = {
        fontWeight: 'bold',
        fontSize: '18px',
        marginBottom: '16px',
    };

    const selectStyle = {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #dee2e6',
        backgroundColor: 'white',
        position: 'relative',
        zIndex: 2,
    };

    const svgContainerStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
    };

    return (
        <div style={containerStyle}>
            <svg style={svgContainerStyle}>
                {connections.map((conn, idx) => {
                    const fromEl = document.getElementById(conn.from?.id);
                    const toEl = document.getElementById(conn.to?.id);
                    if (!fromEl || !toEl) return null;

                    const fromRect = fromEl.getBoundingClientRect();
                    const toRect = toEl.getBoundingClientRect();
                    const containerRect = document
                        .querySelector(`[style*="position: relative"]`)
                        ?.getBoundingClientRect() || { left: 0, top: 0 };

                    // Curved line parameters
                    const startX = fromRect.right - containerRect.left;
                    const startY = fromRect.top + fromRect.height / 2 - containerRect.top;
                    const endX = toRect.left - containerRect.left;
                    const endY = toRect.top + toRect.height / 2 - containerRect.top;
                    const controlX = startX + (endX - startX) / 2;

                    return (
                        <path
                            key={idx}
                            d={`M ${startX} ${startY} 
                  C ${controlX} ${startY}, 
                    ${controlX} ${endY}, 
                    ${endX} ${endY}`}
                            fill="none"
                            stroke={conn.from.color}
                            strokeWidth="2"
                            style={{
                                transition: 'stroke 0.3s ease',
                            }}
                        />
                    );
                })}
            </svg>

            <div style={panelContainerStyle}>
                {/* Master Panel */}
                <div style={panelStyle}>
                    <div style={headerStyle}>Master Listing</div>
                    <div>
                        {masterItems.map(item => (
                            <div
                                key={item.id}
                                id={item.id}
                                style={{
                                    ...itemStyle,
                                    borderLeft: `4px solid ${item.color}`,
                                }}
                            >
                                {item.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Child Panel */}
                <div style={panelStyle}>
                    <div style={headerStyle}>Child Listing</div>
                    <div style={gridContainerStyle}>
                        <div style={{fontWeight: 'bold'}}>Tên</div>
                        <div style={{fontWeight: 'bold'}}>Map với Master</div>
                    </div>
                    {mappedItems.map(item => (
                        <div key={item.id} style={gridContainerStyle}>
                            <div
                                id={item.id}
                                style={{
                                    ...itemStyle,
                                    borderLeft: `4px solid ${
                                        item.masterId ?
                                            masterItems.find(m => m.id === item.masterId)?.color :
                                            '#dee2e6'
                                    }`,
                                }}
                            >
                                {item.name}
                            </div>
                            <select
                                value={item.masterId || 'none'}
                                onChange={(e) => handleMapping(item.id, e.target.value)}
                                style={selectStyle}
                            >
                                <option value="none">Không map</option>
                                {masterItems.map(master => (
                                    <option key={master.id} value={master.id}>
                                        {master.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MappingInterface;

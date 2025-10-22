// PreviewMap.jsx
import React, { useRef, useEffect, useState } from 'react';
import { Col, Layout, Space, Button, Divider, List, Card, Tag, Popover, Alert } from 'antd';
import { LinkOutlined, CloseOutlined, EditOutlined, PlusOutlined, UpOutlined, DownOutlined, FilePdfOutlined } from '@ant-design/icons'; // Thêm icon PDF
import { CircleHelp, CircleSlash2, Copy } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { toSvg, toCanvas } from 'html-to-image'; // Thư viện chuyển đổi HTML thành SVG
import { jsPDF } from 'jspdf'; // Thư viện tạo PDF
import css from "./DataMappingKpi.module.css";
import { IconDR, IconMetric, IconOS } from "../../../icon/IconSVG.js";

const PreviewMap = ({
                        nganhRealSelected,
                        containerRef,
                        paths,
                        nganh,
                        objectives,
                        kpi,
                        dataInputs,
                    }) => {
    const [svgSrc, setSvgSrc] = useState(null); // State để lưu SVG
    const [loading, setLoading] = useState(false); // State để lưu SVG
    // Hàm chuyển đổi nội dung thành SVG
    const convertToSvg = async () => {
        setLoading(true)
        if (containerRef.current) {
            try {
                const dataUrl = await toSvg(containerRef.current, {
                    includeQueryParams: true,
                    scrollY: -window.scrollY, // Add this to capture full height
                    height: containerRef.current.scrollHeight, // Add this to ensure full height
                    width: containerRef.current.scrollWidth, // Add this to ensure full width
                    style: {
                        transform: 'none' // Reset any transforms
                    }
                });
                setSvgSrc(dataUrl);
                setLoading(false);
            } catch (error) {
                console.error('Lỗi khi chuyển đổi thành SVG:', error);
            }
        }
    };

    // Update PDF export function similarly
    const exportToPDF = async () => {
        if (containerRef.current) {
            try {
                // Get the full dimensions of the content
                const originalElement = containerRef.current;
                const fullWidth = originalElement.scrollWidth;
                const fullHeight = originalElement.scrollHeight;

                const canvas = await toCanvas(containerRef.current, {
                    includeQueryParams: true,
                    scrollY: -window.scrollY,
                    height: fullHeight,
                    width: fullWidth,
                    style: {
                        transform: 'none',
                        transformOrigin: 'top left',
                        width: `${fullWidth}px`,
                        height: `${fullHeight}px`
                    },
                    pixelRatio: 2 // Increase quality
                });

                // Calculate PDF dimensions to fit the content properly
                const pdf = new jsPDF({
                    orientation: fullWidth > fullHeight ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [fullWidth, fullHeight]
                });

                // Add image with full dimensions
                pdf.addImage(
                    canvas.toDataURL('image/png'),
                    'PNG',
                    0,
                    0,
                    fullWidth,
                    fullHeight
                );

                pdf.save('preview-map.pdf');
            } catch (error) {
                console.error('Lỗi khi xuất PDF:', error);
            }
        }
    };

    useEffect(() => {
        convertToSvg();
    }, [nganhRealSelected, paths, nganh, objectives, kpi, dataInputs]);

    return (
        <Col md={24} style={{ height: '100%', overflow: 'hidden' }}>
            <TransformWrapper
                initialScale={1}
                initialPositionX={0}
                initialPositionY={0}
                minScale={0.1}
                maxScale={2}
                limitToBounds={false}
                centerZoomedOut={true}
            >
                {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
                            <Button onClick={() => zoomIn()}>+</Button>
                            <Button onClick={() => zoomOut()}>-</Button>
                            <Button onClick={() => resetTransform()}>Reset</Button>
                            <Button
                                icon={<FilePdfOutlined />}
                                onClick={exportToPDF}
                                style={{ marginLeft: 10 }}
                            >
                                Xuất PDF
                            </Button>
                        </div>
                        <TransformComponent
                            wrapperStyle={{
                                width: '100%',
                                height: '100%',
                                overflow: 'visible'
                            }}
                            contentStyle={{
                                width: 'fit-content',
                                height: 'fit-content',
                                minWidth: '100%',
                                minHeight: '100%'
                            }}
                        >
                            {svgSrc && !loading ? (
                                <img
                                    src={svgSrc}
                                    alt="Preview"
                                    style={{ 
                                        width: 'auto',
                                        height: 'auto',
                                        maxWidth: 'none',
                                        objectFit: 'contain'
                                    }}
                                />
                            ) : (
                                <div style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center' 
                                }}>
                                    <Alert
                                        style={{ 
                                            marginTop: 16, 
                                            backgroundColor: '#F3F4F6', 
                                            border: 'none', 
                                            fontSize: '30px' 
                                        }}
                                        message={
                                            <span className="rainbow-text">Đang tải hình ảnh...</span>
                                        }
                                        type="info"
                                        showIcon
                                    />
                                </div>
                            )}
                        </TransformComponent>
                    </div>
                )}
            </TransformWrapper>
        </Col>
    );
};

export default PreviewMap;

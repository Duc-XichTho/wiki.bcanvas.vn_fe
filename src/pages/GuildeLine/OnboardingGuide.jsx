import React, {useState, useEffect, useContext, useRef} from "react";
import {MyContext} from "../../MyContext.jsx";
import ReactQuill, {Quill} from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Carousel as AntCarousel } from "antd";
// Ant Design 5 no longer requires CSS imports at the app level
import SlideManager from "./SlideManager";
import {
    getOnboardingGuideByComponent, 
    createOnboardingGuide, 
    updateOnboardingGuideSlides, 
    updateOnboardingGuideTabs, 
    updateTabContent
} from "../../apis/onboardingGuideService";
import {DragDropContext, Droppable, Draggable} from "react-beautiful-dnd";
import css from "./guide.module.css";
import './guide.module.css'
import { X, Pencil, Save } from 'lucide-react';
import {
    Button,
    Input,
    Modal,
    Typography,
    Space,
    Dropdown,
    Menu,
    Popconfirm
} from "antd";
import RichNoteKTQTRI from "../Home/SelectComponent/RichNoteKTQTRI.jsx";
// const FontSize = Quill.import("formats/size");
// FontSize.whitelist = ["small", "normal", "large", "huge"]; // Danh sách các kích thước
// Quill.register(FontSize, true);


const OnboardingGuide = ({openSlideManager, setOpenSlideManager, componentName}) => {
    const [slides, setSlides] = useState([]);
    const [tabs, setTabs] = useState([{order: 1, title: "Guide slides", type: "slides"}]);
    const [activeTab, setActiveTab] = useState(1);
    const [tabContents, setTabContents] = useState({});
    const [guideId, setGuideId] = useState(null);
    const quillRef = useRef(null);
    const [editingTabTitle, setEditingTabTitle] = useState(null);
    const [tempTabTitle, setTempTabTitle] = useState("");
    const [deleteMenuVisible, setDeleteMenuVisible] = useState(false);
    const [tabToDelete, setTabToDelete] = useState(null);
    const [draftContent, setDraftContent] = useState("");
    const [isContentChanged, setIsContentChanged] = useState(false);
    const [renderKey, setRenderKey] = useState(0); // Key để buộc re-render

    // Create a ref for the carousel
    const carouselRef = useRef(null);

    const handlePasteImage = (pastedImage) => {
        const range = quillRef.current?.getEditor().getSelection();
        if (range) {
            quillRef.current?.getEditor().insertEmbed(range.index, 'image', pastedImage);
            quillRef.current?.getEditor().setSelection(range.index + 1);
        }
    };
   



    const {currentUser} = useContext(MyContext);

    const fetchData = async () => {
        try {
            const guideData = await getOnboardingGuideByComponent(componentName);
            console.log(guideData)
            if (guideData) {
                setGuideId(guideData.id);
                setSlides(guideData.slides || []);
                setTabs(guideData.tabs || [{order: 1, title: "Guide slides", type: "slides"}]);
                
                // Process tab contents
                const initialContents = {};
                (guideData.tabs || []).forEach((tab) => {
                    initialContents[tab.order] = tab.content || "";
                });
                setTabContents(initialContents);
            } else {
                // Create new guide if it doesn't exist
                const newGuide = await createOnboardingGuide({
                    component_name: componentName,
                    slides: [],
                    tabs: [{order: 1, title: "Guide slides", type: "slides"}]
                });
                
                setGuideId(newGuide.id);
            }
        } catch (error) {
            console.error("Error fetching guide data:", error);
        }
    };
    
    const saveSlidesToAPI = async (updatedSlides) => {
        if (guideId) {
            try {
                await updateOnboardingGuideSlides(guideId, updatedSlides);
                console.log('Slides updated successfully:', updatedSlides);
            } catch (error) {
                console.error('Error updating slides:', error);
            }
        }
    };

    useEffect(() => {
        setDraftContent(tabContents[activeTab] || "");
    }, [activeTab, tabContents]);
    
    useEffect(() => {
        // So sánh nội dung draftContent với nội dung ban đầu
        setIsContentChanged(draftContent !== (tabContents[activeTab] || ""));
    }, [draftContent, tabContents, activeTab]);
    
    useEffect(() => {
        fetchData();
    }, [componentName, renderKey]);
    
    // Hàm lưu nội dung
    const handleSaveContent = async () => {
        const updatedContents = {...tabContents, [activeTab]: draftContent};
        setTabContents(updatedContents);
        setIsContentChanged(false); // Reset trạng thái sau khi lưu

        // Lưu vào API
        await saveContentToAPI(activeTab, draftContent, updatedContents);
    };

    const saveDataToAPI = async (updatedTabs) => {
        if (guideId) {
            try {
                await updateOnboardingGuideTabs(guideId, updatedTabs);
                console.log('Tabs updated successfully:', updatedTabs);
            } catch (error) {
                console.error('Error updating tabs:', error);
            }
        }
    };

    const handleAddTab = async () => {
        const newOrder = tabs.length + 1;
        console.log(newOrder)
        const newTab = {order: newOrder, title: `Tab ${newOrder}`, content: ""};

        const updatedTabs = [...tabs, newTab];
        const updatedTabContents = {...tabContents, [newOrder]: ""};

        setTabs(updatedTabs);
        setTabContents(updatedTabContents);
        setActiveTab(newOrder);

        await saveDataToAPI(updatedTabs);
    };

    const handleEditTabTitle = (order) => {
        setEditingTabTitle(order);
        setTempTabTitle(tabs.find((tab) => tab.order === order)?.title || "");
    };

    const handleSaveTabTitle = async (order) => {
        const updatedTabs = tabs.map((tab) =>
            tab.order === order ? {...tab, title: tempTabTitle} : tab
        );
        setTabs(updatedTabs);
        setEditingTabTitle(null);
        await saveDataToAPI(updatedTabs);
    };

    const handleCancelEditTabTitle = () => {
        setEditingTabTitle(null);
        setTempTabTitle("");
    };

    const handleTabChange = (order) => {
        setActiveTab(order); // Cập nhật tab hiện tại
        const newContent = tabContents[order] || ""; // Lấy nội dung của tab
        setDraftContent(newContent); // Cập nhật nội dung của Quill
    };

    useEffect(() => {
        // Chạy mã sau khi Quill render lại nội dung
        const images = document.querySelectorAll('.ql-editor img');
        images.forEach((img) => {
            // Cập nhật lại kích thước của ảnh nếu cần
            img.style.maxWidth = '100%'; // Hoặc kích thước cố định nếu cần
        });
    }, [draftContent]); // Khi nội dung thay đổi, chạy lại mã này

    const handleQuillChange = async (content) => {
        setDraftContent(content);
        setIsContentChanged(true);
    };
    
    const saveContentToAPI = async (tabOrder, content, updatedContents) => {
        if (guideId) {
            try {
                await updateTabContent(guideId, tabOrder, content);
                console.log("Tab content updated successfully");
            } catch (error) {
                console.error("Error updating tab content:", error);
            }
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return; // Nếu không có điểm đến, thoát

        // Kiểm tra nếu đang cố gắng kéo vào vị trí của tab 1 (index = 0)
        if (tabs[result.destination.index].order === 1) {
            console.log("Không thể di chuyển tab vào vị trí tab 1.");
            return; // Nếu destination là tab 1, không thực hiện thay đổi
        }

        const reorderedTabs = Array.from(tabs);

        // Kiểm tra nếu việc kéo không làm thay đổi vị trí (cùng index)
        if (result.source.index === result.destination.index) return;

        // Nếu không phải tab 1, thực hiện di chuyển
        const [movedTab] = reorderedTabs.splice(result.source.index, 1);
        reorderedTabs.splice(result.destination.index, 0, movedTab);

        // Cập nhật lại thứ tự cho các tab (bắt đầu từ 1)
        reorderedTabs.forEach((tab, index) => {
            if (tab.order !== 1) {
                tab.order = index + 1; // Thứ tự bắt đầu từ 1, tab 1 không thay đổi
            }
        });

        setTabs(reorderedTabs); // Cập nhật thứ tự tab trong state

        await saveDataToAPI(reorderedTabs); // Lưu lại thứ tự mới vào API

        // Trigger re-render để cập nhật lại giao diện
        setRenderKey((prevKey) => prevKey + 1);
    };

    const handleOpenDeleteMenu = (event, tab) => {
        setDeleteMenuVisible(true);
        setTabToDelete(tab);
    };

    const handleCloseDeleteMenu = () => {
        setDeleteMenuVisible(false);
        setTabToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (tabToDelete) {
            const updatedTabs = tabs
                .filter((tab) => tab.order !== tabToDelete.order)
                .map((tab, index) => ({...tab, order: index + 1})); // Cập nhật thứ tự mới
            setTabs(updatedTabs);
            setTabContents((prevContents) => {
                const {[tabToDelete.order]: _, ...rest} = prevContents;
                return rest;
            });
            
            await saveDataToAPI(updatedTabs); // Lưu thay đổi vào API
        }
        handleCloseDeleteMenu();
    };

    // Add this useEffect to debug slides data
    useEffect(() => {
        console.log("Current slides:", slides);
    }, [slides]);

    // Add these useEffect hooks for debugging
    useEffect(() => {
        console.log(`Active tab changed to: ${activeTab}`);
        if (activeTab === 1) {
            console.log(`Slides data for Tab 1:`, slides);
            // Force re-render of carousel when switching to tab 1
            setRenderKey(prevKey => prevKey + 1);
        }
    }, [activeTab]);

    useEffect(() => {
        if (slides.length > 0) {
            console.log(`Slides updated, count: ${slides.length}`);
        }
    }, [slides]);

    // Carousel settings with custom arrows
    const carouselSettings = {
        dots: true,
        arrows: false, // Disable default arrows
        autoplay: false
    };
    
    // Custom navigation functions
    const goToPrev = () => {
        if (carouselRef.current) {
            carouselRef.current.prev();
        }
    };
    
    const goToNext = () => {
        if (carouselRef.current) {
            carouselRef.current.next();
        }
    };

    return (
        <>
            {/* <div
                style={{
                    width: "20%",
                    borderRight: "1px solid #ddd",
                    display: "flex",
                    flexDirection: "column",
                    padding: "10px",
                    backgroundColor: "#f8f8f8",
                    height: "95%",
                }}
            >
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="order">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                style={{
                                    overflowY: "auto",
                                    maxHeight: "calc(100vh - 50px)",
                                }}
                            >
                                {tabs
                                    .slice()
                                    .sort((a, b) => a.order - b.order) // Sort tabs by order
                                    .map((tab, index) => (
                                        <Draggable
                                            key={tab.order}
                                            draggableId={`${tab.order}`}
                                            index={index}
                                            isDragDisabled={
                                                tab.order === 1 ||
                                                !(currentUser?.isAdmin || currentUser?.isSecretary)
                                            }
                                        >
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                        padding: "10px",
                                                        marginBottom: "10px",
                                                        borderRadius: "5px",
                                                        cursor:
                                                            tab.order !== 1 && (currentUser?.isAdmin || currentUser?.isSecretary)
                                                                ? "grab"
                                                                : "pointer",
                                                        backgroundColor: tab.order === activeTab ? "#e0e0e0" : "#fff",
                                                    }}
                                                    onClick={() => handleTabChange(tab.order)}
                                                >
                                                    {editingTabTitle === tab.order ? (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                width: "100%",
                                                            }}
                                                        >
                                                                                                                                    <Input
                                                                    value={tempTabTitle}
                                                                    onChange={(e) =>
                                                                        setTempTabTitle(e.target.value)
                                                                    }
                                                                    style={{
                                                                        width: "75%",
                                                                        marginRight: "10px",
                                                                        padding: "8px 10px",
                                                                        fontSize: "14px",
                                                                    }}
                                                            />
                                                            <div
                                                                style={{
                                                                    flex: 1,
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                }}
                                                            >
                                                                {(currentUser?.isAdmin || currentUser?.isSecretary) && (
                                                                    <>
                                                                        <Button
                                                                            type="primary"
                                                                            size="small"
                                                                            onClick={() =>
                                                                                handleSaveTabTitle(tab.order)
                                                                            }
                                                                            style={{
                                                                                marginRight: "5px",
                                                                                padding: "5px 10px",
                                                                            }}
                                                                        >
                                                                            Lưu
                                                                        </Button>
                                                                        <Button
                                                                            type="default"
                                                                            size="small"
                                                                            onClick={handleCancelEditTabTitle}
                                                                            style={{
                                                                                padding: "5px 10px",
                                                                            }}
                                                                        >
                                                                            Hủy
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                                width: "100%",
                                                            }}
                                                        >
                                            <span
                                                style={{
                                                    flex: 3,
                                                    fontSize: "14px",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {tab.title}
                                            </span>
                                                            {tab.order !== 1 &&
                                                                (currentUser?.isAdmin || currentUser?.isSecretary) && (
                                                                    <>
                                                                        <Button
                                                                            type="text"
                                                                            size="small"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEditTabTitle(tab.order);
                                                                            }}
                                                                            style={{
                                                                                flex: 1,
                                                                                textAlign: "right",
                                                                            }}
                                                                        >
                                                                            <Pencil size={16} />
                                                                        </Button>
                                                                        <Button
                                                                            type="text"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleOpenDeleteMenu(e, tab);
                                                                            }}
                                                                            style={{
                                                                                padding: 0,
                                                                                minWidth: "auto",
                                                                                color: "red",
                                                                            }}
                                                                        >
                                                                            <X size={16} />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <Modal
                    title="Xác nhận xóa"
                    open={deleteMenuVisible}
                    onCancel={handleCloseDeleteMenu}
                    footer={[
                        <Button key="cancel" onClick={handleCloseDeleteMenu}>
                            Hủy
                        </Button>,
                        <Button key="delete" type="primary" danger onClick={handleConfirmDelete}>
                            Xóa
                        </Button>,
                    ]}
                >
                    <Typography.Text>Bạn có chắc chắn muốn xóa tab này?</Typography.Text>
                </Modal>


                {(currentUser?.isAdmin || currentUser?.isSecretary) && (
                    <Button
                        style={{
                            marginTop: "auto",
                            padding: "10px",
                            cursor: "pointer",
                            backgroundColor: "#007bff",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                        }}
                        onClick={handleAddTab}
                    >
                        Thêm Tab mới
                    </Button>
                )}

            </div> */}

            {/* Main Content */}
            {/* <div style={{flex: 1, padding: "20px", height: "100%", overflow: "hidden", width:'100%', display: 'flex', flexDirection: 'column'  }}> */}
                {activeTab === 1 && (
                    <div style={{
                        height: "100%", 
                        width: "100%", 
                        display: 'flex', 
                        flexDirection: 'column', 
                        flex: 1,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                    }}>
                        <AntCarousel
                            key={`carousel-${slides.length}-${renderKey}`}
                            ref={carouselRef}
                            {...carouselSettings}
                            className="guide-carousel"
                            style={{ 
                                width: '100%', 
                                height: '100%',
                                overflow: 'hidden'
                            }}
                            adaptiveHeight={true}
                        >
                            {slides
                                .sort((a, b) => a.order - b.order)
                                .map((slide, index) => (
                                    <div
                                        key={`slide-${slide.order}-${index}`}
                                        className="carousel-slide"
                                        style={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
                                            padding: 0
                                        }}
                                    >
                                        <div className="slide-container" style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            overflow: 'hidden',
                                            height: '100%',
                                            width: '100%',
                                            padding: '0',
                                            margin: '0',
                                            backgroundColor: '#fff'
                                        }}>
                                            <div className="slide-content" style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                overflow: 'hidden',
                                                width: 'auto',
                                                height: 'auto',
                                                maxHeight: '75vh',
                                                margin: '0 auto'
                                            }}>
                                                {slide.type === "iframe" ? (
                                                    <iframe
                                                        src={slide.src}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            maxHeight: '75vh',
                                                            border: 'none'
                                                        }}
                                                    />
                                                ) : (
                                                    <img
                                                        src={slide.src}
                                                        alt={slide.title}
                                                        className={slide.objectFit ? `img-${slide.objectFit}` : ''}
                                                        style={{
                                                            maxWidth: '100%',
                                                            maxHeight: '75vh',
                                                            width: 'auto',
                                                            height: 'auto',
                                                            objectFit: 'contain',
                                                            margin: '0 auto',
                                                            display: 'block'
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            {slide.title && (
                                                <div className="slide-text" style={{
                                                    width: '90%',
                                                    textAlign: 'left',
                                                    padding: '20px',
                                                    overflow: 'auto',
                                                    maxHeight: '25%'
                                                }}>
                                                    <h2 style={{
                                                        fontSize: '18px',
                                                        marginBottom: '10px',
                                                        fontWeight: 'bold'
                                                    }}>{slide.title}</h2>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </AntCarousel>
                        
                        {/* Custom navigation buttons */}
                        {slides.length > 1 && (
                            <>
                                <div 
                                    className="nav-button prev" 
                                    onClick={goToPrev}
                                    style={{
                                        position: 'absolute',
                                        left: '20px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        cursor: 'pointer',
                                        zIndex: 100,
                                        fontSize: '20px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {'<'}
                                </div>
                                <div 
                                    className="nav-button next" 
                                    onClick={goToNext}
                                    style={{
                                        position: 'absolute',
                                        right: '20px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        cursor: 'pointer',
                                        zIndex: 100,
                                        fontSize: '20px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {'>'}
                                </div>
                            </>
                        )}
                        
                        {slides.length === 0 && (
                            <div style={{
                                display: "flex", 
                                justifyContent: "center", 
                                alignItems: "center", 
                                height: "100%",
                                flexDirection: "column",
                                gap: "16px"
                            }}>
                                <Typography.Title level={4}>Chưa có slide nào</Typography.Title>
                                {(currentUser?.isAdmin || currentUser?.isSecretary) && (
                                    <Button 
                                        type="primary" 
                                        onClick={() => setOpenSlideManager(true)}
                                    >
                                        Thêm slide
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                    
                )}
            {/*     
                : (
                    <div style={{position: "relative", height: "100%", boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', width: "100%", marginLeft: "10px", padding: "5px 10px", borderRadius: "5px"}}>
                       
                       <RichNoteKTQTRI
                        table={tabContents[activeTab]}
                        />
                    </div>


                )}
            </div>*/}

           {/*   Slide Manager */}
            <Modal
                open={openSlideManager}
                onCancel={() => setOpenSlideManager(false)}
                width={800}
                footer={null}
            >
                <Typography.Title level={3}>Manage Slides</Typography.Title>
                <SlideManager
                    slides={slides}
                    setSlides={(updatedSlides) => {
                        setSlides(updatedSlides);
                        saveSlidesToAPI(updatedSlides);
                    }}
                />
            </Modal>
        </>
    );
};

export default OnboardingGuide;


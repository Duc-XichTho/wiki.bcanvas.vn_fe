import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Input,
    Layout,
    List,
    message,
    Modal, Popover,
    Row,
    Select,
    Space,
    Tag,
    Typography
} from 'antd';
import {CloseOutlined, DownOutlined, EditOutlined, LinkOutlined, PlusOutlined, UpOutlined} from "@ant-design/icons";
import {createNewNganh, deleteNganh, getAllNganh, updateNganh} from "../../../apis/nganhService.jsx";
import {CircleSlash2, PencilLine, HousePlus, Trash2, Copy, CircleHelp} from 'lucide-react';
import {
    createNewBusinessObjectives, deleteBusinessObjectives,
    getAllBusinessObjectives,
    updateBusinessObjectives
} from "../../../apis/businessObjectivesService.jsx";
import {createNewMetrics, deleteMetrics, getAllMetrics, updateMetrics} from "../../../apis/metricsService.jsx";
import {
    createNewDataMapping,
    deleteDataMapping,
    getAllDataMapping,
    updateDataMapping
} from "../../../apis/dataMappingService.jsx";
import css from './DataMappingKpi.module.css'
import {
    createNewNganhReal,
    deleteNganhReal,
    getAllNganhReal,
    updateNganhReal
} from "../../../apis/nganhRealService.jsx";
import {MyContext} from "../../../MyContext.jsx";
import {IconDR, IconMetric, IconOB, IconOS} from "../../../icon/IconSVG.js";
import RichNoteKTQTRI from "../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import {createPhanTichNote, getAllPhanTichNote} from "../../../apisKTQT/phantichNoteService.jsx";
import {getAllQuanLyTag} from "../../../apis/quanLyTagService.jsx";
import PreviewMap from "./PreviewMap.jsx";

const {Title, Text} = Typography;
const {Option} = Select;

const ObjectiveMetricsDataPanel = ({nganhRealSelected,selectedTags,loadList}) => {
        const {
            currentYearCanvas,
            setCurrentYearCanvas,
            isUpdateNoti, setIsUpdateNoti
        } = useContext(MyContext) || {};
        const [editMode, setEditMode] = useState(false);
        const [scrollPos, setScrollPos] = useState({x: 0, y: 0});
        const [showAllConnections, setShowAllConnections] = useState(true);
        const [forceUpdate, setForceUpdate] = useState(0);
        const [loading, setLoading] = useState(true);
        const [listTag, setListTag] = useState([]);
        const [objectives, setObjectives] = useState([]);
        const [kpi, setMetrics] = useState([]);
        const [dataInputs, setDataInputs] = useState([]);
        const [nganh, setNganh] = useState([]);
        const [nganhReal, setNganhReal] = useState([]);
        const [typeSelected, setTypeSelected] = useState(null);
        const [searchValue, setSearchValue] = useState('');
        const [isModalVisible, setIsModalVisible] = useState(false); // State để hiển thị/ẩn Modal

        const [isModalEditVisible, setIsModalEditVisible] = useState(false); // State để hiển thị/ẩn Modal
        const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
        const [newItemData, setNewItemData] = useState({ // State để lưu dữ liệu nhập từ form
            name: '',
            code: '',
            mo_ta: '',
        });

        const [editData, setEditData] = useState(null);

// State for selected item and view all mode
        const [selectedItem, setSelectedItem] = useState(null);

        const [paths, setPaths] = useState([]);
        const [selectedPath, setSelectedPath] = useState(null); // State để lưu đường nối được chọn
        const [showAllTags, setShowAllTags] = useState(false);
// Hàm xử lý khi người dùng nhấp vào đường nối
        const handlePathClick = (path, index) => {
            setSelectedPath(prev => (prev?.index == index ? null : {...path, index}));
        };

// Refs to store card elements
        const objRefs = useRef({});
        const kpiRefs = useRef({});
        const dataRefs = useRef({});
        const nganhRefs = useRef({});
        const containerRef = useRef(null);

        const handleScroll = () => {
            if (containerRef.current) {
                setScrollPos({
                    x: containerRef.current.scrollLeft,
                    y: containerRef.current.scrollTop
                });
            }
        };

        // Relationship data
        const [nganhToObj, setNganhToObj] = useState([]);
        const [objToKpi, setObjToKpi] = useState([]);
        const [kpiToData, setKpiToData] = useState([]);
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const nganhRealRes = await getAllNganhReal();
                const nganhRes = await getAllNganh();
                const metricsRes = await getAllMetrics();
                const boRes = await getAllBusinessObjectives();
                const dataMappingRes = await getAllDataMapping();
                const notes = await getAllPhanTichNote(); // Lấy danh sách notes
                let tags = await getAllQuanLyTag();
                setListTag(tags)

                let filteredNganhReal = nganhRealRes.sort((a, b) => a?.position - b?.position);
                if (selectedTags && selectedTags.length > 0) {
                    console.log(filteredNganhReal)
                    console.log(filteredNganhReal)
                    filteredNganhReal = filteredNganhReal.filter(e =>
                        selectedTags.every(tag => e?.tabs?.includes(tag))
                    );
                }
                setNganhReal(filteredNganhReal);

                if (nganhRealSelected && currentYearCanvas) {
                    const filteredNganh = nganhRes.filter(e => e.year == currentYearCanvas && e.nganhReal == nganhRealSelected.id).sort((a, b) => a.position - b.position);
                    const filteredObjectives = boRes.filter(e => e.year == currentYearCanvas && e.nganhReal == nganhRealSelected.id).sort((a, b) => a.position - b.position);
                    const filteredMetrics = metricsRes.filter(e => e.year == currentYearCanvas && e.nganhReal == nganhRealSelected.id).sort((a, b) => a.position - b.position);
                    const filteredDataInputs = dataMappingRes.filter(e => e.year == currentYearCanvas && e.nganhReal == nganhRealSelected.id).sort((a, b) => a.position - b.position);

                    // Cập nhật state
                    setNganh(filteredNganh);
                    setObjectives(filteredObjectives);
                    setMetrics(filteredMetrics);
                    setDataInputs(filteredDataInputs);

                    // Hàm kiểm tra xem có note tồn tại không
                    const hasNote = (fromType, toType, fromId, toId) =>
                        notes.some(note => note.body && note.body != '<div><br></div>' && note.body != '<div></div>' && note.body != '<p></p>' && note.table == `${fromType}_${toType}_${fromId}_${toId}`);

                    // Cập nhật mối quan hệ kèm trạng thái note
                    const newObjToKpi = filteredObjectives.flatMap(obj =>
                        obj.metrics.map(metricId => ({
                            objId: obj.id.toString(),
                            kpiId: metricId.toString(),
                            hasNote: hasNote("METRICS", "DATA_REQUIREMENT", obj.id, metricId) // Kiểm tra note
                        }))
                    );
                    setObjToKpi(newObjToKpi);

                    const newKpiToData = filteredMetrics.flatMap(metric =>
                        metric.data_mapping.map(dataId => ({
                            kpiId: metric.id.toString(),
                            dataId: dataId.toString(),
                            hasNote: hasNote("DATA_REQUIREMENT", "ORIGINAL_SOURCE", metric.id, dataId) // Kiểm tra note
                        }))
                    );
                    setKpiToData(newKpiToData);

                    const newNganhToObj = filteredNganh.flatMap(nganh =>
                        nganh.bo.map(objId => ({
                            nganhId: nganh.id.toString(),
                            objId: objId.toString(),
                            hasNote: hasNote("OBJECTIVES", "METRICS", nganh.id, objId) // Kiểm tra note
                        }))
                    );
                    setNganhToObj(newNganhToObj);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            fetchAllData()
        }, [forceUpdate, currentYearCanvas, nganhRealSelected, selectedTags, isUpdateNoti]);

        useEffect(() => {
            const handleScrollOrResize = () => {
                setForceUpdate(prev => prev + 1);
            };

            const container = containerRef.current;
            if (container) {
                container.addEventListener('scroll', handleScrollOrResize);
                window.addEventListener('resize', handleScrollOrResize);
            }

            return () => {
                if (container) {
                    container.removeEventListener('scroll', handleScrollOrResize);
                }
                window.removeEventListener('resize', handleScrollOrResize);
            };
        }, [objectives, kpi, dataInputs, nganh]);
        // Sample data - tag1 serves as the related department

        const handleAddNew = async (type) => {
            setTypeSelected(type)
            setIsModalVisible(true)
        };
        const handleEdit = (type) => {
            setTypeSelected(type)
            setIsModalEditVisible(true)
        };
        const handleTagClick = (tagName) => {
            if (selectedTags.includes(tagName)) {
                setSelectedTags(selectedTags.filter(t => t !== tagName));
            } else {
                setSelectedTags([...selectedTags, tagName]);
            }
        };
        const handleModalOk = async () => {
            try {
                if (typeSelected) {
                    if (typeSelected == 'nganh') {
                        if (nganh?.length > 0) {
                            await createNewNganh({
                                ...newItemData,
                                year: currentYearCanvas,
                                nganhReal: nganhRealSelected.id,
                                position: Math.max(...nganh.map(e => e.position || 0)) + 1
                            });
                        } else {
                            await createNewNganh({
                                ...newItemData,
                                year: currentYearCanvas,
                                nganhReal: nganhRealSelected.id, position: 0
                            });
                        }

                    }
                    if (typeSelected == 'objective') {
                        if (objectives?.length > 0) {
                            await createNewBusinessObjectives({
                                ...newItemData,
                                year: currentYearCanvas,
                                nganhReal: nganhRealSelected.id,
                                position: Math.max(...objectives.map(e => e.position || 0)) + 1
                            });
                        } else {
                            await createNewBusinessObjectives({
                                ...newItemData,
                                nganhReal: nganhRealSelected.id,
                                year: currentYearCanvas,
                                position: 0
                            });
                        }
                    }

                    if (typeSelected == 'metrics') {
                        if (kpi.length > 0) {
                            await createNewMetrics({
                                ...newItemData,
                                year: currentYearCanvas,
                                nganhReal: nganhRealSelected.id,
                                position: Math.max(...kpi.map(e => e.position || 0)) + 1
                            });
                        } else {
                            await createNewMetrics({
                                ...newItemData, position: 0,
                                nganhReal: nganhRealSelected.id,
                                year: currentYearCanvas,
                            });
                        }
                    }
                    if (typeSelected == 'data') {
                        if (dataInputs.length > 0) {
                            await createNewDataMapping({
                                ...newItemData,
                                year: currentYearCanvas,
                                nganhReal: nganhRealSelected.id,
                                position: Math.max(...dataInputs.map(e => e.position || 0)) + 1
                            });
                        } else {
                            await createNewDataMapping({
                                ...newItemData,
                                nganhReal: nganhRealSelected.id,
                                year: currentYearCanvas,
                                position: 0
                            });
                        }
                    }
                }
                setIsModalVisible(false); // Đóng Modal sau khi tạo thành công
                await fetchAllData(); // Làm mới dữ liệu
                setNewItemData({name: '', code: '', mo_ta: ''});
            } catch
                (error) {
                console.error('Error creating new nganh:', error);
            }
        };

        const cloneNganhReal = async () => {
            if (!nganhRealSelected) return;

            try {
                // 1. Nhân bản `nganhReal`
                const clonedNganhReal = {
                    ...nganhRealSelected,
                    id: null, // Đặt ID thành null để API tạo ID mới
                    name: `${nganhRealSelected.name} (Copy)`,
                    code: `${nganhRealSelected.code}-Copy`,
                };

                // Tạo `nganhReal` mới và lấy ID trả về từ API
                const newNganhReal = await createNewNganhReal(clonedNganhReal);

                // 2. Tạo bản đồ ánh xạ ID cũ sang ID mới
                const idMap = {
                    dataInputs: {}, // Ánh xạ ID cũ sang ID mới của dataInputs
                    kpi: {},       // Ánh xạ ID cũ sang ID mới của kpi
                    objectives: {}, // Ánh xạ ID cũ sang ID mới của objectives
                    nganh: {},     // Ánh xạ ID cũ sang ID mới của nganh
                };

                // 3. Nhân bản các `dataInputs`
                const clonedDataInputs = dataInputs
                    .filter(dataInput => dataInput.nganhReal == nganhRealSelected.id)
                    .map(dataInput => ({
                        ...dataInput,
                        nganhReal: newNganhReal.data.id, // Cập nhật ID của `nganhReal` mới
                        year: currentYearCanvas,
                    }));

                // Tạo các `dataInputs` mới và lưu ánh xạ ID
                for (const dataInput of clonedDataInputs) {
                    const newDataInput = await createNewDataMapping({...dataInput, id: null});
                    idMap.dataInputs[dataInput.id] = newDataInput.data.id; // Lưu ánh xạ ID cũ -> ID mới
                }

                // 4. Nhân bản các `kpi`
                const clonedKpi = kpi
                    .filter(metric => metric.nganhReal == nganhRealSelected.id)
                    .map(metric => ({
                        ...metric,
                        nganhReal: newNganhReal.data.id,
                        year: currentYearCanvas,
                        data_mapping: metric.data_mapping.map(dataId => {
                            // Cập nhật ID của `dataInput` mới trong trường `data_mapping`
                            return idMap.dataInputs[dataId] || dataId;
                        }),
                    }));

                // Tạo các `kpi` mới và lưu ánh xạ ID
                for (const metric of clonedKpi) {
                    const newMetric = await createNewMetrics({...metric, id: null});
                    idMap.kpi[metric.id] = newMetric.data.id; // Lưu ánh xạ ID cũ -> ID mới
                }

                // 5. Nhân bản các `objectives`
                const clonedObjectives = objectives
                    .filter(obj => obj.nganhReal == nganhRealSelected.id)
                    .map(obj => ({
                        ...obj,
                        nganhReal: newNganhReal.data.id,
                        year: currentYearCanvas,
                        metrics: obj.metrics.map(metricId => {
                            // Cập nhật ID của `kpi` mới trong trường `metrics`
                            return idMap.kpi[metricId] || metricId;
                        }),
                    }));

                // Tạo các `objectives` mới và lưu ánh xạ ID
                for (const obj of clonedObjectives) {
                    const newObjective = await createNewBusinessObjectives({...obj, id: null});
                    idMap.objectives[obj.id] = newObjective.data.id; // Lưu ánh xạ ID cũ -> ID mới
                }

                // 6. Nhân bản các `nganh`
                const clonedNganh = nganh
                    .filter(nganhItem => nganhItem.nganhReal == nganhRealSelected.id)
                    .map(nganhItem => ({
                        ...nganhItem,
                        id: null, // Đặt ID thành null để API tạo ID mới
                        nganhReal: newNganhReal.data.id,
                        year: currentYearCanvas,
                        bo: nganhItem.bo.map(objId => {
                            // Cập nhật ID của `objective` mới trong trường `bo`
                            return idMap.objectives[objId] || objId;
                        }),
                    }));
                // Tạo các `nganh` mới
                for (const nganhItem of clonedNganh) {
                    await createNewNganh(nganhItem);
                }

                // 7. Fetch lại toàn bộ dữ liệu
                await fetchAllData();

                message.success("Nhân bản thành công!");
            } catch (error) {
                console.error("Lỗi khi nhân bản ngành:", error);
            }
        };

// Hàm tạo ID mới (ví dụ đơn giản)
        const generateNewId = () => {
            return Math.random().toString(36).substr(2, 9);
        };
        const handleModalEditOk = async () => {
            try {
                if (typeSelected) {
                    if (typeSelected == 'nganh') {
                        if (nganh?.length > 0) {
                            await updateNganh(editData);
                        }
                    }
                    if (typeSelected == 'objective') {
                        if (objectives?.length > 0) {
                            await updateBusinessObjectives(editData);
                        }
                    }
                    if (typeSelected == 'kpi') {
                        if (kpi?.length > 0) {
                            await updateMetrics(editData);
                        }
                    }
                    if (typeSelected == 'data') {
                        if (dataInputs?.length > 0) {
                            await updateDataMapping(editData);
                        }
                    }
                }
                setIsModalEditVisible(false); // Đóng Modal sau khi tạo thành công
                await fetchAllData(); // Làm mới dữ liệu
                setEditData(null);
            } catch (error) {
                console.error('Error creating new nganh:', error);
            }
        };



        const handleInputChange = (e) => {
            const {name, value} = e.target;
            setNewItemData(prev => ({...prev, [name]: value}));
        };
        const handleInputTabsChange = (e) => {
            setNewItemData(prev => ({...prev, tabs: e}));
        };



        const handleInputEditChange = (e) => {
            const {name, value} = e.target;
            setEditData(prev => ({...prev, [name]: value}));
        };
        const handleInputEditTagChange = (e) => {
            setEditData(prev => ({...prev, tabs: e}));
        };


// Determine if an item should be highlighted and matches the filtered department
        const isHighlighted = (type, id) => {
            // Check if item matches the filtered department
            // If in view all mode, highlight all items
            if (showAllConnections) return true;

            // If no item is selected, check by department
            if (!selectedItem) return true;

            // If current item is the selected item, highlight it
            if (selectedItem.type == type && selectedItem.id == id) return true;

            if (selectedItem.type == 'objective') {
                if (type == 'kpi') {
                    return objToKpi.some(conn => conn.objId == selectedItem.id && conn.kpiId == id);
                }
                if (type == 'data') {
                    const relatedKpis = objToKpi
                        .filter(conn => conn.objId == selectedItem.id)
                        .map(conn => conn.kpiId);
                    return kpiToData.some(
                        conn => relatedKpis.includes(conn.kpiId) && conn.dataId == id
                    );
                }
                if (type == 'nganh') {
                    return nganhToObj.some(conn => conn.objId == selectedItem.id && conn.nganhId == id);
                }
            }

            if (selectedItem.type == 'kpi') {
                if (type == 'objective') {
                    return objToKpi.some(conn => conn.kpiId == selectedItem.id && conn.objId == id);
                }
                if (type == 'data') {
                    return kpiToData.some(conn => conn.kpiId == selectedItem.id && conn.dataId == id);
                }
                if (type == 'nganh') {
                    const relatedObjs = objToKpi
                        .filter(conn => conn.kpiId == selectedItem.id)
                        .map(conn => conn.objId);
                    return nganhToObj.some(
                        conn => relatedObjs.includes(conn.objId) && conn.nganhId == id
                    );
                }
            }

            if (selectedItem.type == 'data') {
                if (type == 'kpi') {
                    // Kiểm tra kết nối từ data đến kpi
                    return kpiToData.some(conn => conn.dataId == selectedItem.id && conn.kpiId == id);
                }
                if (type == 'objective') {
                    // Lấy tất cả kpi liên quan đến data
                    const relatedKpis = kpiToData
                        .filter(conn => conn.dataId == selectedItem.id)
                        .map(conn => conn.kpiId);

                    // Kiểm tra kết nối từ kpi đến objective
                    return objToKpi.some(
                        conn => relatedKpis.includes(conn.kpiId) && conn.objId == id
                    );
                }
                if (type == 'nganh') {
                    // Lấy tất cả kpi liên quan đến data
                    const relatedKpis = kpiToData
                        .filter(conn => conn.dataId == selectedItem.id)
                        .map(conn => conn.kpiId);

                    // Lấy tất cả objective liên quan đến các kpi đó
                    const relatedObjs = objToKpi
                        .filter(conn => relatedKpis.includes(conn.kpiId))
                        .map(conn => conn.objId);

                    // Kiểm tra kết nối từ objective đến nganh
                    return nganhToObj.some(
                        conn => relatedObjs.includes(conn.objId) && conn.nganhId == id
                    );
                }
            }

            if (selectedItem.type == 'nganh') {
                if (type == 'objective') {
                    // Kiểm tra kết nối từ ngành đến objective
                    return nganhToObj.some(conn => conn.nganhId == selectedItem.id && conn.objId == id);
                }
                if (type == 'kpi') {
                    // Lấy tất cả objective liên quan đến ngành
                    const relatedObjs = nganhToObj
                        .filter(conn => conn.nganhId == selectedItem.id)
                        .map(conn => conn.objId);

                    // Kiểm tra kết nối từ objective đến kpi
                    return objToKpi.some(
                        conn => relatedObjs.includes(conn.objId) && conn.kpiId == id
                    );
                }
                if (type == 'data') {
                    // Lấy tất cả objective liên quan đến ngành
                    const relatedObjs = nganhToObj
                        .filter(conn => conn.nganhId == selectedItem.id)
                        .map(conn => conn.objId);

                    // Lấy tất cả kpi liên quan đến các objective đó
                    const relatedKpis = objToKpi
                        .filter(conn => relatedObjs.includes(conn.objId))
                        .map(conn => conn.kpiId);

                    // Kiểm tra kết nối từ kpi đến data
                    return kpiToData.some(
                        conn => relatedKpis.includes(conn.kpiId) && conn.dataId == id
                    );
                }
            }

            return false;
        }

// Thêm event listener
        useEffect(() => {
            const container = containerRef.current;
            if (container) {
                container.addEventListener('scroll', handleScroll);
                return () => container.removeEventListener('scroll', handleScroll);
            }
        }, [selectedItem, nganhToObj, kpiToData, objToKpi, showAllConnections, nganhRealSelected]);
// Redraw connection lines when there are changes
        useEffect(() => {
            // Đảm bảo containerRef tồn tại
            if (!containerRef.current) return;
            const newPaths = [];


            const createCurvePath = (sourceRef, targetRef) => {

                if (!sourceRef || !targetRef || !containerRef.current) return null;

                // Lấy thông tin vị trí container
                const container = containerRef.current;
                const containerRect = container?.getBoundingClientRect();
                const containerScrollLeft = container?.scrollLeft;
                const containerScrollTop = container?.scrollTop;

                // Tính toán vị trí tương đối với container
                const getRelativePosition = (element) => {
                    const rect = element.getBoundingClientRect();
                    return {
                        left: rect.left - containerRect.left + containerScrollLeft,
                        top: rect.top - containerRect.top + containerScrollTop,
                        right: rect.right - containerRect.left + containerScrollLeft,
                        bottom: rect.bottom - containerRect.top + containerScrollTop,
                        width: rect.width,
                        height: rect.height,
                    };
                };

                const sourcePos = getRelativePosition(sourceRef);
                const targetPos = getRelativePosition(targetRef);

                // Tính toán điểm bắt đầu và kết thúc
                const start = {
                    x: sourcePos.right,
                    y: sourcePos.top + sourcePos.height / 2,
                };

                const end = {
                    x: targetPos.left,
                    y: targetPos.top + targetPos.height / 2,
                };

                // Tính toán điểm điều khiển Bezier
                const cpOffset = Math.abs(end.x - start.x) / 2;
                const cp1 = {x: start.x + cpOffset, y: start.y};
                const cp2 = {x: end.x - cpOffset, y: end.y};

                return {
                    path: `M ${start.x},${start.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`,
                    color: '#599BD1',
                };
            };

            // Draw all connections if in view all mode
            if (showAllConnections) {
                // Draw all connections from Objective to Metrics
                objToKpi.forEach(conn => {
                    const pathData = {
                        ...createCurvePath(objRefs.current[conn.objId], kpiRefs.current[conn.kpiId]),
                        objId: conn.objId,
                        kpiId: conn.kpiId,
                        hasNote: conn.hasNote,
                    };
                    if (pathData) {
                        newPaths.push(pathData);
                    }
                });

                // Draw connections from Metrics to Data Input
                kpiToData.forEach(conn => {
                    const pathData = {
                        ...createCurvePath(kpiRefs.current[conn.kpiId], dataRefs.current[conn.dataId]),
                        kpiId: conn.kpiId,
                        dataId: conn.dataId,
                        hasNote: conn.hasNote,
                    }
                    if (pathData) {
                        newPaths.push({
                            ...pathData,
                            color: '#599BD1', // antd orange
                        });
                    }
                });

                // Draw connections from Nganh to Objective
                nganhToObj.forEach(conn => {
                    const pathData = {
                        ...createCurvePath(nganhRefs.current[conn.nganhId], objRefs.current[conn.objId]),
                        nganhId: conn.nganhId,
                        objId: conn.objId,
                        hasNote: conn.hasNote,
                    }
                    if (pathData) {
                        newPaths.push({
                            ...pathData,
                            color: '#599BD1', // antd green
                        });
                    }
                });
            } else if (selectedItem) {
                // Draw connections based on selected item
                if (selectedItem.type == 'objective') {
                    // Draw connections from selected Objective to Metrics
                    objToKpi
                        .filter(conn => conn.objId == selectedItem.id)
                        .forEach(conn => {
                            const pathData = {
                                ...createCurvePath(objRefs.current[conn.objId], kpiRefs.current[conn.kpiId]),
                                objId: conn.objId,
                                kpiId: conn.kpiId,
                                hasNote: conn.hasNote,
                            }
                            if (pathData) {
                                newPaths.push(pathData);
                            }
                        });

                    // Draw connections from Metrics to Data Input
                    const relatedKpis = objToKpi
                        .filter(conn => conn.objId == selectedItem.id)
                        .map(conn => conn.kpiId);
                    kpiToData
                        .filter(conn => relatedKpis.includes(conn.kpiId))
                        .forEach(conn => {

                            const pathData = {
                                ...createCurvePath(kpiRefs.current[conn.kpiId], dataRefs.current[conn.dataId]),
                                kpiId: conn.kpiId,
                                dataId: conn.dataId,
                                hasNote: conn.hasNote,
                            }
                            if (pathData) {
                                newPaths.push({
                                    ...pathData,
                                    color: '#599BD1', // antd orange
                                });
                            }
                        });

                    // Draw connections from Nganh to selected Objective
                    nganhToObj
                        .filter(conn => conn.objId == selectedItem.id)
                        .forEach(conn => {

                            const pathData = {
                                ...createCurvePath(nganhRefs.current[conn.nganhId], objRefs.current[conn.objId]),
                                nganhId: conn.nganhId,
                                objId: conn.objId,
                                hasNote: conn.hasNote,
                            }
                            if (pathData) {
                                newPaths.push({
                                    ...pathData,
                                    color: '#599BD1', // antd green
                                });
                            }
                        });
                } else if (selectedItem.type == 'kpi') {
                    // Draw connections from selected KPI to Objective
                    objToKpi
                        .filter(conn => conn.kpiId == selectedItem.id)
                        .forEach(conn => {
                            const pathData = {
                                ...createCurvePath(objRefs.current[conn.objId], kpiRefs.current[conn.kpiId]),
                                kpiId: conn.kpiId,
                                objId: conn.objId,
                                hasNote: conn.hasNote,
                            }
                            if (pathData) {
                                newPaths.push(pathData);
                            }
                        });

                    // Draw connections from selected KPI to Data Input
                    kpiToData
                        .filter(conn => conn.kpiId == selectedItem.id)
                        .forEach(conn => {
                            const pathData = {
                                ...createCurvePath(kpiRefs.current[conn.kpiId], dataRefs.current[conn.dataId]),
                                kpiId: conn.kpiId,
                                dataId: conn.dataId,
                                hasNote: conn.hasNote,
                            }
                            if (pathData) {
                                newPaths.push({
                                    ...pathData,
                                    color: '#599BD1', // antd orange
                                });
                            }
                        });

                    // Draw connections from Objective to Nganh
                    const relatedObjs = objToKpi
                        .filter(conn => conn.kpiId == selectedItem.id)
                        .map(conn => conn.objId);
                    nganhToObj
                        .filter(conn => relatedObjs.includes(conn.objId))
                        .forEach(conn => {
                            const pathData = {
                                ...createCurvePath(nganhRefs.current[conn.nganhId], objRefs.current[conn.objId]),
                                nganhId: conn.nganhId,
                                objId: conn.objId,
                                hasNote: conn.hasNote,
                            }
                            if (pathData) {
                                newPaths.push({
                                    ...pathData,
                                    color: '#599BD1', // antd green
                                });
                            }
                        });
                } else if (selectedItem.type == 'data') {
                    // Draw connections from selected Data to KPI
                    kpiToData
                        .filter(conn => conn.dataId == selectedItem.id)
                        .forEach(conn => {
                            const pathData = {
                                ...createCurvePath(kpiRefs.current[conn.kpiId], dataRefs.current[conn.dataId]),
                                kpiId: conn.kpiId,
                                dataId: conn.dataId,
                                hasNote: conn.hasNote,
                            }
                            if (pathData) {
                                newPaths.push({
                                    ...pathData,
                                    color: '#599BD1', // antd orange
                                });
                            }
                        });

                    // Draw connections from KPI to Objective
                    const relatedKpis = kpiToData
                        .filter(conn => conn.dataId == selectedItem.id)
                        .map(conn => conn.kpiId);
                    objToKpi
                        .filter(conn => relatedKpis.includes(conn.kpiId))
                        .forEach(conn => {
                            const pathData = {
                                ...createCurvePath(objRefs.current[conn.objId], kpiRefs.current[conn.kpiId]),
                                objId: conn.objId,
                                kpiId: conn.kpiId,
                                hasNote: conn.hasNote,
                            }
                            if (pathData) {
                                newPaths.push(pathData);
                            }
                        });

                    // Draw connections from Objective to Nganh
                    const relatedObjs = objToKpi
                        .filter(conn => relatedKpis.includes(conn.kpiId))
                        .map(conn => conn.objId);
                    nganhToObj
                        .filter(conn => relatedObjs.includes(conn.objId))
                        .forEach(conn => {
                            const pathData = {
                                ...createCurvePath(nganhRefs.current[conn.nganhId], objRefs.current[conn.objId]),
                                nganhId: conn.nganhId,
                                objId: conn.objId,
                                hasNote: conn.hasNote,
                            }
                            if (pathData) {
                                newPaths.push({
                                    ...pathData,
                                    color: '#599BD1', // antd green
                                });
                            }
                        });
                } else if (selectedItem.type == 'nganh') {
                    // Draw connections from selected Nganh to Objective
                    nganhToObj
                        .filter(conn => conn.nganhId == selectedItem.id)
                        .forEach(conn => {
                            const pathData = {
                                ...createCurvePath(nganhRefs.current[conn.nganhId], objRefs.current[conn.objId]),
                                nganhId: conn.nganhId,
                                objId: conn.objId,
                                hasNote: conn.hasNote,
                            }
                            if (pathData) {
                                newPaths.push({
                                    ...pathData,
                                    color: '#599BD1', // antd green
                                });
                            }
                        });

                    // Draw connections from Objective to Metrics
                    const relatedObjs = nganhToObj
                        .filter(conn => conn.nganhId == selectedItem.id)
                        .map(conn => conn.objId);
                    objToKpi
                        .filter(conn => relatedObjs.includes(conn.objId))
                        .forEach(conn => {
                            const pathData = {
                                ...createCurvePath(objRefs.current[conn.objId], kpiRefs.current[conn.kpiId]),
                                kpiId: conn.kpiId,
                                objId: conn.objId,
                                hasNote: conn.hasNote,
                            }
                            if (pathData) {
                                newPaths.push(pathData);
                            }
                        });

                    // Draw connections from Metrics to Data Input
                    const relatedKpis = objToKpi
                        .filter(conn => relatedObjs.includes(conn.objId))
                        .map(conn => conn.kpiId);
                    kpiToData
                        .filter(conn => relatedKpis.includes(conn.kpiId))
                        .forEach(conn => {
                            const pathData = {
                                ...createCurvePath(kpiRefs.current[conn.kpiId], dataRefs.current[conn.dataId]),
                                kpiId: conn.kpiId,
                                dataId: conn.dataId,
                                hasNote: conn.hasNote,
                            }

                            if (pathData) {
                                newPaths.push({
                                    ...pathData,
                                    color: '#599BD1', // antd orange
                                });
                            }
                        });
                }
            }
            setPaths(newPaths);
        }, [selectedItem, objToKpi, kpiToData, nganhToObj, showAllConnections, scrollPos, forceUpdate, nganhRealSelected]);

// Re-render connections when window size changes
        useEffect(() => {
            const handleResize = () => {
                // Force re-render paths
                setPaths([...paths]);
            };


            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, [selectedItem, showAllConnections, objectives, kpi, dataInputs, nganh]);

// Handle item click
        const handleItemClick = (type, id) => {
            if (showAllConnections) {
                setShowAllConnections(false);
            }
            setSelectedItem({type, id});
        };

// Handle toggle view all connections
        const toggleShowAllConnections = () => {
            setShowAllConnections(!showAllConnections);
        };


// Handle edit mode toggle
        const toggleEditMode = () => {
            setEditMode(!editMode);
            // When exiting edit mode, reset selected item
            if (editMode) {
                setSelectedItem(null);
            }
        };

// Handle move item up
        // Hàm tổng quát để di chuyển item
        const moveItem = async (type, id, direction) => {
            const config = {
                objective: {array: objectives, setArray: setObjectives, updateFn: updateBusinessObjectives},
                kpi: {array: kpi, setArray: setMetrics, updateFn: updateMetrics},
                data: {array: dataInputs, setArray: setDataInputs, updateFn: updateDataMapping},
                nganh: {array: nganh, setArray: setNganh, updateFn: updateNganh},
            };

            const {array, setArray, updateFn} = config[type] || {};
            const item = array.find(i => i.id == id);
            if (!item) return;

            const index = item.position;
            const isUp = direction == 'up';
            const newIndex = isUp ? index - 1 : index + 1;

            // Kiểm tra giới hạn di chuyển
            if (index == undefined || (isUp && index <= 0) || (!isUp && index >= array.length - 1)) return;

            const newArray = [...array];
            const temp = newArray[index];
            newArray[index] = newArray[newIndex];
            newArray[newIndex] = temp;

            try {
                await Promise.all([
                    updateFn({...newArray[index], position: index}),
                    updateFn({...newArray[newIndex], position: newIndex}),
                ]);
                setArray(newArray);
                await fetchAllData()
            } catch (error) {
                console.error('Error updating position:', error);
            }
        };
        const handlePreviewMap = () => {
            setIsPreviewModalVisible(true);
        };
// Hàm gọi di chuyển lên
        const moveItemUp = (type, id) => moveItem(type, id, 'up');

// Hàm gọi di chuyển xuống
        const moveItemDown = (type, id) => moveItem(type, id, 'down');

        const removeItem = async (type, id) => {


            if (type == 'objective') {
                const item = objectives.find(i => i.id == id);
                if (item) {
                    await deleteBusinessObjectives(id)
                }
            } else if (type == 'kpi') {
                const item = kpi.find(i => i.id == id);
                if (item) {
                    await deleteMetrics(id)
                }
            } else if (type == 'data') {
                const item = dataInputs.find(i => i.id == id);
                if (item) {
                    await deleteDataMapping(id)
                }
            } else if (type == 'nganh') {
                const item = nganh.find(i => i.id == id);
                if (item) {
                    await deleteNganh(id)
                }
            }
            await fetchAllData()
        };
        const renderPopoverContent = (path) => {
            if (!selectedPath) {
                return
            }
            const {objId, kpiId, dataId, nganhId} = selectedPath;
            let fromId, toId, fromName, toName, totb, fromtb;

            if (objId && kpiId) {
                // Đường nối từ Objective đến KPI
                const from = objectives.find(obj => obj.id == objId);
                const to = kpi.find(metric => metric.id == kpiId);
                fromId = objId;
                toId = kpiId;
                fromName = from?.name || 'Unknown';
                toName = to?.name || 'Unknown';
                fromtb = 'METRICS';
                totb = 'DATA_REQUIREMENT';
            } else if (kpiId && dataId) {
                // Đường nối từ KPI đến Data Input
                const from = kpi.find(metric => metric.id == kpiId);
                const to = dataInputs.find(data => data.id == dataId);
                fromId = kpiId;
                toId = dataId;
                fromName = from?.name || 'Unknown';
                toName = to?.name || 'Unknown';
                fromtb = 'DATA_REQUIREMENT';
                totb = 'ORIGINAL_SOURCE';
            } else if (nganhId && objId) {
                // Đường nối từ Nganh đến Objective
                const from = nganh.find(nganhItem => nganhItem.id == nganhId);
                const to = objectives.find(obj => obj.id == objId);
                fromId = nganhId;
                toId = objId;
                fromName = from?.name || 'Unknown';
                toName = to?.name || 'Unknown';
                fromtb = 'OBJECTIVES';
                totb = 'METRICS';
            }
            return (
                <div>
                    <p><strong>From:</strong> {fromtb} ({fromName})</p>
                    <p><strong>To:</strong> {totb} ({toName})</p>

                    <RichNoteKTQTRI table={`${fromtb}_${totb}_${fromId}_${toId}`} fromMapping={true}
                                    fetchData={fetchAllData}/>
                </div>
            );
        };
        // useEffect(() => {
        //     if(selectedTags && selectedTags.length == 0){
        //         setNganhReal()
        //     }
        //     const filteredNganhReal = nganhReal.filter(nganh =>
        //         selectedTags.length == 0 || selectedTags.some(tag => nganh.tags?.includes(tag))
        //     );
        //     setNganhReal(filteredNganhReal);
        // }, [selectedTags, nganhReal]);

        const listItemStyle = () => ({
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: 0,
            padding: 0,
            margin: 0,
            minHeight: '40px',

        });

        const cardStyle = (isHighlighted) => ({
            backgroundColor: isHighlighted ? '#f3f7ff' : 'transparent',
            border: isHighlighted ? '1px solid #599BD1' : '',
            opacity: isHighlighted ? '1' : '0.5',
            width: '100%',
            height: '100%',
            borderRadius: '10px',
            margin: '0 0 5px 0',
        });

        const columnsStyle = {
            width: 350,
        };
        const handleModalCancel = () => {
            setIsModalVisible(false); // Đóng Modal mà không lưu
            setNewItemData({name: '', code: '', mo_ta: ''});
        };
// Nhóm các phần tử nganh theo tags
        const groupByTags = (items) => {
            const grouped = {};

            items.forEach(item => {
                // Kiểm tra nếu không có tag thì nhóm vào "Không có tag"
                const tags = item.tabs && item.tabs.length > 0 ? item.tabs : ["Không có tag"];

                tags.forEach(tag => {
                    if (!grouped[tag]) {
                        grouped[tag] = [];
                    }
                    grouped[tag].push(item);
                });
            });

            return grouped;
        };

        const groupedNganh = groupByTags(nganh);
        const groupedObjectives = groupByTags(objectives);
        const groupedKpi = groupByTags(kpi);
        const groupedDataInputs = groupByTags(dataInputs);

        return (
            <>
                <div style={{height: '100%', width: '100%'}}>
                        {(nganhRealSelected && nganhRealSelected.id) ?
                            <Layout style={{height: 'calc(100% - 40px)', width: '100%', backgroundColor: '#F9F9F9',}}>

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end', // căn bên phải
                                        alignItems: 'center',
                                        height: '50px',
                                        width: '100%',
                                    }}
                                >
                                    <Space
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'flex-end', // cũng căn phải trong space
                                            gap: '10px',
                                        }}
                                    >
                                        <Button
                                            icon={<LinkOutlined />}
                                            type="text" // loại bỏ border, nền
                                            onClick={toggleShowAllConnections}
                                            style={{
                                                color: '#262626',
                                            }}
                                        >
                                            {showAllConnections ? 'Ẩn kết nối' : 'Hiện tất cả'}
                                        </Button>

                                        <Button
                                            icon={editMode ? <CloseOutlined /> : <EditOutlined />}
                                            type="text"
                                            onClick={toggleEditMode}
                                            style={{
                                                color: '#262626',
                                            }}
                                        >
                                            {editMode ? 'Dừng chỉnh sửa' : 'Chỉnh sửa'}
                                        </Button>

                                        <Button
                                            type="text"
                                            onClick={cloneNganhReal}
                                            style={{
                                                color: '#262626',
                                            }}
                                        >
                                            Nhân bản <Copy size={20} strokeWidth={1.5} />
                                        </Button>

                                        <Button
                                            type="text"
                                            onClick={handlePreviewMap}
                                            style={{
                                                color: '#262626',
                                            }}
                                        >
                                            Preview Map
                                        </Button>
                                    </Space>
                                </div>



                                {/*<Alert*/}
                                {/*    style={{backgroundColor: 'transparent', border: 'none', margin: '10px 0 0 0', borderRadius:0 }}*/}
                                {/*    message={*/}
                                {/*        <>*/}
                                {/*            <strong>Hướng dẫn:</strong> Nhấp vào một thẻ để xem các liên kết.*/}
                                {/*            {showAllConnections && ' Đang hiển thị tất cả kết nối.'}*/}
                                {/*            {editMode && ' Trong chế độ chỉnh sửa, sử dụng các nút mũi tên để sắp xếp, bấm 2 lần vào thẻ để chỉnh sửa nội dung.'}*/}
                                {/*        </>*/}
                                {/*    }*/}
                                {/*    type='info'*/}
                                {/*    showIcon*/}
                                {/*/>*/}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        height: '730px',
                                        gap: '60px',
                                        position: 'relative',
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        padding: '0 15px',
                                    }}
                                    ref={containerRef}
                                >
                                    {/* SVG Connections (giữ nguyên) */}
                                    <svg
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: `${containerRef.current?.scrollWidth}px`,
                                            height: `${containerRef.current?.scrollHeight}px`,
                                            pointerEvents: 'auto', // Đổi từ 'none' sang 'auto'
                                            zIndex: 0
                                        }}
                                    >
                                        {paths.map((path, index, value) => (
                                            <Popover
                                                key={`popover-${index}`}
                                                content={renderPopoverContent(value)}
                                                trigger="click"
                                                open={selectedPath?.index == index} // Kiểm soát hiển thị Popover
                                                onOpenChange={(visible) => {
                                                    if (!visible) setSelectedPath(null); // Đóng Popover khi không còn hiển thị
                                                }}
                                            >
                                                <path
                                                    key={`path-${index}`}
                                                    d={path.path}
                                                    stroke={path.color}
                                                    fill="transparent" // Đảm bảo có vùng nhấn rộng hơn
                                                    strokeWidth="2" // Tăng độ dày của stroke để dễ nhấn hơn
                                                    strokeOpacity="0.6"
                                                    strokeLinecap="round"
                                                    strokeDasharray={path.hasNote ? "0" : "5,5"}
                                                    style={{cursor: 'pointer'}}
                                                    onClick={() => handlePathClick(path, index)}
                                                />

                                            </Popover>

                                        ))}
                                    </svg>

                                    {/* Nganh Column */}
                                    <List
                                        className={css.header_list}
                                        style={columnsStyle}
                                        header={
                                            <div
                                                style={{
                                                    fontWeight: 500,
                                                    display: "flex",
                                                    justifyContent: "start",
                                                    alignItems: "center",
                                                    gap: "20px",
                                                }}
                                            >
                                                <div className={css.titleColumn}>
                                                    Mục tiêu
                                                </div>
                                                {editMode && (
                                                    <Button
                                                        type="primary"
                                                        style={{ backgroundColor: "#259c63" }}
                                                        icon={<PlusOutlined />}
                                                        onClick={() => handleAddNew("nganh")}
                                                    />
                                                )}
                                            </div>
                                        }
                                        dataSource={Object.keys(groupedNganh)} // Duyệt qua các tag
                                        renderItem={(tag) => (
                                            <div key={tag}>
                                                <div style={{ fontWeight: 600, marginBottom: "5px", fontSize: 18, color:'#262626'}}>
                                                    {tag === "Không có tag" ? "Không có tag" : `Tag ${tag}`}
                                                </div>
                                                <List
                                                    dataSource={groupedNganh[tag]} // Các phần tử thuộc tag này
                                                    renderItem={(nganh) => (
                                                        <List.Item
                                                            ref={(el) => (nganhRefs.current[nganh?.id] = el)}
                                                            style={listItemStyle()}
                                                            onClick={() => handleItemClick("nganh", nganh?.id)}
                                                            onDoubleClick={() => {
                                                                if (editMode) {
                                                                    handleEdit("nganh");
                                                                    setEditData(nganh);
                                                                }
                                                            }}
                                                        >
                                                            <Card className={css.cardBody} size="small" style={cardStyle(isHighlighted("nganh", nganh?.id))}>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <div>
                                                                        <div style={{ fontWeight: 500 }}>{nganh?.name}</div>
                                                                        <Space
                                                                            style={{
                                                                                marginTop: 4,
                                                                                display: "flex",
                                                                                flexWrap: "wrap", // Cho phép xuống dòng
                                                                                gap: "4px", // Thêm khoảng cách nhỏ giữa các tag
                                                                            }}
                                                                        >
                                                                            {/*<Tag color="#259c63">{nganh?.code}</Tag>*/}
                                                                            {/*{nganh.tabs &&*/}
                                                                            {/*    nganh.tabs.length > 0 &&*/}
                                                                            {/*    nganh.tabs.map((e) => <Tag color="green" key={e}>{e}</Tag>)}*/}
                                                                        </Space>
                                                                    </div>
                                                                    {!editMode && nganh?.mo_ta && (
                                                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center"}}>
                                                                            <Popover content={nganh.mo_ta} title="Thông tin" trigger="hover">
                                                                                <CircleHelp size={15} />
                                                                            </Popover>
                                                                        </div>
                                                                    )}
                                                                    {editMode && (
                                                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                                            <Button
                                                                                type="text"
                                                                                icon={<UpOutlined />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    moveItemUp("nganh", nganh?.id);
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                type="text"
                                                                                icon={<DownOutlined />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    moveItemDown("nganh", nganh?.id);
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                type="text"
                                                                                icon={<CircleSlash2 color={"red"} size={16} />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    removeItem("nganh", nganh?.id);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Card>
                                                        </List.Item>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    />

                                    {/* Objectives Column */}
                                    <List
                                        className={css.header_list}
                                        style={columnsStyle}
                                        header={
                                            <div
                                                style={{
                                                    fontWeight: 500,
                                                    display: "flex",
                                                    justifyContent: "start",
                                                    alignItems: "center",
                                                    gap: "20px",
                                                }}
                                            >
                                                <div className={css.titleColumn}>
                                                    KPI
                                                </div>
                                                {editMode && (
                                                    <Button
                                                        type="primary"
                                                        style={{ backgroundColor: "#259c63" }}
                                                        icon={<PlusOutlined />}
                                                        onClick={() => handleAddNew("objective")}
                                                    />
                                                )}
                                            </div>
                                        }
                                        dataSource={Object.keys(groupedObjectives)} // Duyệt qua các tag
                                        renderItem={(tag) => (
                                            <div key={tag}>
                                                <div style={{ fontWeight: 600, marginBottom: "5px", fontSize: 18, color:'#262626' }}>
                                                    {tag === "Không có tag" ? "Không có tag" : `Tag ${tag}`}
                                                </div>
                                                <List
                                                    dataSource={groupedObjectives[tag]}
                                                    renderItem={(obj) => (
                                                        <List.Item
                                                            ref={(el) => (objRefs.current[obj?.id] = el)}
                                                            style={listItemStyle()}
                                                            onClick={() => handleItemClick("objective", obj?.id)}
                                                            onDoubleClick={() => {
                                                                if (editMode) {
                                                                    handleEdit("objective");
                                                                    setEditData(obj);
                                                                }
                                                            }}
                                                        >
                                                            <Card className={css.cardBody} size="small" style={cardStyle(isHighlighted("objective", obj?.id))}>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <div>
                                                                        <div style={{ fontWeight: 500 }}>{obj?.name}</div>
                                                                        <Space
                                                                            style={{
                                                                                marginTop: 4,
                                                                                display: "flex",
                                                                                flexWrap: "wrap",
                                                                                gap: "4px",
                                                                            }}
                                                                        >
                                                                            {/*<Tag color="#259c63">{obj?.code}</Tag>*/}
                                                                            {/*{obj.tabs &&*/}
                                                                            {/*    obj.tabs.length > 0 &&*/}
                                                                            {/*    obj.tabs.map((e) => <Tag color="green" key={e}>{e}</Tag>)}*/}
                                                                        </Space>
                                                                    </div>
                                                                    {!editMode && obj?.mo_ta && (
                                                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center"}}>
                                                                            <Popover content={obj.mo_ta} title="Thông tin" trigger="hover">
                                                                                <CircleHelp size={15} />
                                                                            </Popover>
                                                                        </div>
                                                                    )}
                                                                    {editMode && (
                                                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                                            <Button
                                                                                type="text"
                                                                                icon={<UpOutlined />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    moveItemUp("objective", obj?.id);
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                type="text"
                                                                                icon={<DownOutlined />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    moveItemDown("objective", obj?.id);
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                type="text"
                                                                                icon={<CircleSlash2 color={"red"} size={16} />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    removeItem("objective", obj?.id);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Card>
                                                        </List.Item>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    />

                                    {/* Xử lý thông tin Column */}
                                    <List
                                        className={css.header_list}
                                        style={columnsStyle}
                                        header={
                                            <div
                                                style={{
                                                    fontWeight: 500,
                                                    display: "flex",
                                                    justifyContent: "start",
                                                    alignItems: "center",
                                                    gap: "20px",
                                                }}
                                            >
                                                <div className={css.titleColumn}>
                                                    Dữ liệu nhóm 1
                                                </div>
                                                {editMode && (
                                                    <Button
                                                        type="primary"
                                                        style={{ backgroundColor: "#259c63" }}
                                                        icon={<PlusOutlined />}
                                                        onClick={() => handleAddNew("metrics")}
                                                    />
                                                )}
                                            </div>
                                        }
                                        dataSource={Object.keys(groupedKpi)} // Duyệt qua các tag
                                        renderItem={(tag) => (
                                            <div key={tag}>
                                                <div style={{ fontWeight: 600, marginBottom: "5px", fontSize: 18, color:'#262626' }}>
                                                    {tag === "Không có tag" ? "Không có tag" : `Tag ${tag}`}
                                                </div>
                                                <List
                                                    dataSource={groupedKpi[tag]}
                                                    renderItem={(kpi) => (
                                                        <List.Item
                                                            ref={(el) => (kpiRefs.current[kpi.id] = el)}
                                                            style={listItemStyle()}
                                                            onClick={() => handleItemClick("kpi", kpi.id)}
                                                            onDoubleClick={() => {
                                                                if (editMode) {
                                                                    handleEdit("kpi");
                                                                    setEditData(kpi);
                                                                }
                                                            }}
                                                        >
                                                            <Card className={css.cardBody} size="small" style={cardStyle(isHighlighted("kpi", kpi.id))}>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <div>
                                                                        <div style={{ fontWeight: 500 }}>{kpi.name}</div>
                                                                        <Space
                                                                            style={{
                                                                                marginTop: 4,
                                                                                display: "flex",
                                                                                flexWrap: "wrap",
                                                                                gap: "4px",
                                                                            }}
                                                                        >
                                                                            {/*<Tag color="#259c63">{kpi?.code}</Tag>*/}
                                                                            {/*{kpi.tabs &&*/}
                                                                            {/*    kpi.tabs.length > 0 &&*/}
                                                                            {/*    kpi.tabs.map((e) => <Tag color="green" key={e}>{e}</Tag>)}*/}
                                                                        </Space>
                                                                    </div>
                                                                    {!editMode && kpi?.mo_ta && (
                                                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                                            <Popover content={kpi.mo_ta} title="Thông tin" trigger="hover">
                                                                                <CircleHelp size={15} />
                                                                            </Popover>
                                                                        </div>
                                                                    )}
                                                                    {editMode && (
                                                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                                            <Button
                                                                                type="text"
                                                                                icon={<UpOutlined />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    moveItemUp("kpi", kpi.id);
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                type="text"
                                                                                icon={<DownOutlined />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    moveItemDown("kpi", kpi.id);
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                type="text"
                                                                                icon={<CircleSlash2 color={"red"} size={16} />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    removeItem("kpi", kpi?.id);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Card>
                                                        </List.Item>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    />

                                    {/* Dữ liệu đầu vào Column */}
                                    <List
                                        className={css.header_list}
                                        style={columnsStyle}
                                        header={
                                            <div
                                                style={{
                                                    fontWeight: 500,
                                                    display: "flex",
                                                    justifyContent: "start",
                                                    alignItems: "center",
                                                    gap: "20px",
                                                }}
                                            >
                                                <div className={css.titleColumn}>
                                                    Dữ liệu nhóm 2
                                                </div>
                                                {editMode && (
                                                    <Button
                                                        type="primary"
                                                        style={{ backgroundColor: "#259c63" }}
                                                        icon={<PlusOutlined />}
                                                        onClick={() => handleAddNew("data")}
                                                    />
                                                )}
                                            </div>
                                        }
                                        dataSource={Object.keys(groupedDataInputs)} // Duyệt qua các tag
                                        renderItem={(tag) => (
                                            <div key={tag}>
                                                <div style={{ fontWeight: 600, marginBottom: "5px", fontSize: 18, color:'#262626' }}>
                                                    {tag === "Không có tag" ? "Không có tag" : `Tag ${tag}`}
                                                </div>
                                                <List
                                                    dataSource={groupedDataInputs[tag]}
                                                    renderItem={(data) => (
                                                        <List.Item
                                                            ref={(el) => (dataRefs.current[data?.id] = el)}
                                                            style={listItemStyle()}
                                                            onClick={() => handleItemClick("data", data?.id)}
                                                            onDoubleClick={() => {
                                                                if (editMode) {
                                                                    handleEdit("data");
                                                                    setEditData(data);
                                                                }
                                                            }}
                                                        >
                                                            <Card className={css.cardBody} size="small" style={cardStyle(isHighlighted("data", data?.id))}>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    <div>
                                                                        <div style={{ fontWeight: 500 }}>{data?.name}</div>
                                                                        <Space
                                                                            style={{
                                                                                marginTop: 4,
                                                                                display: "flex",
                                                                                flexWrap: "wrap",
                                                                                gap: "4px",
                                                                            }}
                                                                        >
                                                                            {/*<Tag color="#259c63">{data?.code}</Tag>*/}
                                                                            {/*{data.tabs &&*/}
                                                                            {/*    data.tabs.length > 0 &&*/}
                                                                            {/*    data.tabs.map((e) => <Tag color="green" key={e}>{e}</Tag>)}*/}
                                                                        </Space>
                                                                    </div>
                                                                    {!editMode && data?.mo_ta && (
                                                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                                            <Popover content={data.mo_ta} title="Thông tin" trigger="hover">
                                                                                <CircleHelp size={15} />
                                                                            </Popover>
                                                                        </div>
                                                                    )}
                                                                    {editMode && (
                                                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                                            <Button
                                                                                type="text"
                                                                                icon={<UpOutlined />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    moveItemUp("data", data?.id);
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                type="text"
                                                                                icon={<DownOutlined />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    moveItemDown("data", data?.id);
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                type="text"
                                                                                icon={<CircleSlash2 color={"red"} size={16} />}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    removeItem("data", data?.id);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Card>
                                                        </List.Item>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    />
                                </div>


                                {/*CREATE ITEM*/}
                                <Modal
                                    title={`Thêm mới ${typeSelected ?
                                        typeSelected == 'metrics' ? 'Data requirement' :
                                            typeSelected == 'objective' ? 'Metrics' :
                                                typeSelected == 'nganh' ? 'Objectives' :
                                                    typeSelected == 'data' ? 'Original source' : '' : ''}`}
                                    open={isModalVisible}
                                    onOk={handleModalOk}
                                    onCancel={handleModalCancel}
                                    okText="Lưu"
                                    cancelText="Hủy"
                                >
                                    <Space direction="vertical" style={{width: '100%'}}>
                                        <Input
                                            placeholder="Tên"
                                            name="name"
                                            value={newItemData.name}
                                            onChange={handleInputChange}
                                        />
                                        <Input
                                            placeholder="Mã"
                                            name="code"
                                            value={newItemData.code}
                                            onChange={handleInputChange}
                                        />
                                        {/* Quản lý Tag */}
                                        <Typography>Tags</Typography>

                                        <Select
                                            mode="multiple"
                                            style={{width: '100%'}}
                                            name="tabs"
                                            placeholder="Thêm tags"
                                            onChange={handleInputTabsChange}
                                        >
                                            {listTag && listTag.length > 0 && typeSelected && listTag.filter(e => e.nhom == typeSelected).map((tag) => (
                                                <Select.Option key={tag.id} value={tag.name}>
                                                    {tag.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                        <Input.TextArea
                                            placeholder="Mô tả"
                                            name="mo_ta"
                                            value={newItemData.mo_ta}
                                            onChange={handleInputChange}
                                            rows={4}
                                        />


                                    </Space>
                                </Modal>



                                {/*EDIT*/}
                                <Modal
                                    title={`Chỉnh sửa ${typeSelected ?
                                        typeSelected == 'metrics' ? 'Metrics' :
                                            typeSelected == 'objective' ? 'Objectives' :
                                                typeSelected == 'nganh' ? 'Ngành' :
                                                    typeSelected == 'data' ? 'Data mapping' : '' : ''} - ${editData?.name}`}
                                    open={isModalEditVisible}
                                    onOk={handleModalEditOk}
                                    onCancel={() => setIsModalEditVisible(false)}
                                    okText="Lưu"
                                    cancelText="Hủy"
                                >
                                    <Space direction="vertical" style={{width: '100%'}}>
                                        <Typography>Tên</Typography>
                                        <Input
                                            placeholder="Tên"
                                            name="name"
                                            value={editData?.name}
                                            onChange={handleInputEditChange}
                                        />
                                        <Typography>Mã</Typography>
                                        <Input
                                            placeholder="Mã"
                                            name="code"
                                            value={editData?.code}
                                            onChange={handleInputEditChange}
                                        />
                                        <Typography>Tags</Typography>
                                        <Select
                                            mode="multiple"
                                            style={{width: '100%'}}
                                            name="tabs"
                                            value={editData?.tabs || []}
                                            placeholder="Thêm tags"
                                            onChange={handleInputEditTagChange}
                                        >
                                            {listTag && listTag.length > 0 && typeSelected && listTag.filter(e => e.nhom == typeSelected).map((tag) => (
                                                <Select.Option key={tag.id} value={tag.name}>
                                                    {tag.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                        <Typography>Mô tả</Typography>
                                        <Input.TextArea
                                            placeholder="Mô tả"
                                            name="mo_ta"
                                            value={editData?.mo_ta}
                                            onChange={handleInputEditChange}
                                            rows={4}
                                        />
                                        {/* Quản lý Tag */}


                                        {(typeSelected && typeSelected == 'nganh') &&
                                            <>
                                                <Typography>Chọn Metrics</Typography>
                                                <Select
                                                    style={{width: '100%'}}
                                                    onChange={(value) => {
                                                        setEditData(pre => ({...pre, bo: value}))
                                                    }}
                                                    value={editData?.bo}
                                                    mode={'multiple'}
                                                    allowClear
                                                >
                                                    {objectives.map(e => (
                                                        <Option value={e?.id}>{e.name} | {e?.code}</Option>
                                                    ))}
                                                </Select>
                                            </>
                                        }
                                        {(typeSelected && typeSelected == 'objective') &&
                                            <>
                                                <Typography>Chọn Data requirement</Typography>
                                                <Select
                                                    style={{width: '100%'}}
                                                    onChange={(value) => {
                                                        setEditData(pre => ({...pre, metrics: value}))
                                                    }}
                                                    value={editData?.metrics}
                                                    mode={'multiple'}
                                                    allowClear
                                                >
                                                    {kpi.map(e => (
                                                        <Option value={e?.id}>{e.name} | {e?.code}</Option>
                                                    ))}
                                                </Select>
                                            </>
                                        }
                                        {(typeSelected && typeSelected == 'kpi') &&
                                            <>

                                                <Typography>Chọn Original source</Typography>
                                                <Select
                                                    style={{width: '100%'}}
                                                    onChange={(value) => {
                                                        setEditData(pre => ({...pre, data_mapping: value}))
                                                    }}
                                                    value={editData?.data_mapping}
                                                    mode={'multiple'}
                                                    allowClear
                                                >
                                                    {dataInputs.map(e => (
                                                        <Option value={e?.id}>{e.name} | {e?.code}</Option>
                                                    ))}
                                                </Select>
                                            </>
                                        }

                                    </Space>
                                </Modal>


                                {/* Modal Preview Map */}
                                <Modal
                                    title="Preview Map"
                                    open={isPreviewModalVisible}
                                    onCancel={() => setIsPreviewModalVisible(false)}
                                    footer={null}
                                    centered
                                    width="90%"
                                    bodyStyle={{
                                        height: '75vh'
                                    }}
                                >
                                    <PreviewMap
                                        nganhRealSelected={nganhRealSelected}
                                        containerRef={containerRef}
                                        paths={paths}
                                        nganh={nganh}
                                        objectives={objectives}
                                        kpi={kpi}
                                        dataInputs={dataInputs}
                                    />
                                </Modal>


                            </Layout> :
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: "flex",
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <Alert
                                    style={{marginTop: 16, backgroundColor: '#F3F4F6', border: 'none', fontSize: '30px'}}
                                    message={
                                        <span className="rainbow-text">Vui lòng chọn ngành</span>
                                    }
                                    type="info"
                                    showIcon
                                />

                            </div>
                        }


                   
                </div>
            </>
        );
    }
;

export default ObjectiveMetricsDataPanel

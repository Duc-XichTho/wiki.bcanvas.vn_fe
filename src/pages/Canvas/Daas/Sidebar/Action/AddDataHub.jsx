import { Modal, Input, Select, Typography, Row, Col, Button, message, Divider } from "antd";
import React, { useState, useMemo, useEffect, useContext, useRef } from 'react';
import css from "./AddData.module.css";
import {
    Accounting,
    API,
    EmptyPaper,
    KPI,
    Note,
    ReportBuilder,
    ReportCanvas, TaoMoiDuLieu_Icon,
    Template,
    UserUpload,
} from '../../../../../icon/svg/IconSvg.jsx';
import { MyContext } from "../../../../../MyContext.jsx";
import { Folder_Icon } from '../../../../../icon/svg/IconSvg.jsx';
import { createTimestamp } from "../../../../../generalFunction/format.js";
import {
    createNewFileNotePad, getAllFileNotePad, updateFileNotePad,
} from "../../../../../apis/fileNotePadService.jsx";
import { NotepadTextDashed, Dot } from 'lucide-react';
import { getAllKpi2Calculator } from "../../../../../apis/kpi2CalculatorService.jsx";
import { CANVAS_DATA_PACK } from "../../../../../CONST.js";
import TooltipHeaderIcon from "../../../../KeToanQuanTri/HeaderTooltip/TooltipHeaderIcon.jsx";
import { getCurrentUserLogin } from "../../../../../apis/userService.jsx";
import { getAllSettingGroup } from "../../../../../apisKTQT/settingGroupService.jsx";
import { getAllChartTemplate } from "../../../../../apis/chartTemplateService.jsx";
import RichNoteKTQTRI from "../../../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import { getAllTemplateSheetTable } from '../../../../../apis/templateSettingService.jsx';
import ChartTemplateElement
    from '../../Content/Template/SettingChart/ChartTemplate/ChartTemplateElement/ChartTemplateElement.jsx';

const { Title } = Typography;


export default function AddDataHub({
    isModalVisible,
    handleCloseModal,
    tabs,
    listUC_CANVAS,
    uCSelected_CANVAS,
    fetchData,
    kpiList,
    ctList,
    listFileNote,
    loadFileTab
}) {
    const { currentUser, } = useContext(MyContext);
    const inputRef = useRef(null);
    const [templateOptions, setTemplateOptions] = useState([
        {
            value: 'temp_empty',
            label: 'Template trống',
            icon: <EmptyPaper />,
        }
    ]);
    const [dataOptions, setDataOptions] = useState([
        {
            value: 'B',
            label: 'Báo cáo',
            icon: <Accounting height={18} width={18} />,
        },
        {
            value: 'C',
            label: 'Biểu đồ',
            icon: <ReportCanvas height={16} width={16} />,
        },
        {
            value: 'DM',
            label: 'Danh mục',
            icon: <NotepadTextDashed color={'#444444'} size={18} />,
        },
    ]);
    // Replace formData with individual states
    const [name, setName] = useState(null);
    const [folder, setFolder] = useState(null);
    const [type, setType] = useState(null);

    const [detailTypeSelected, setDetailTypeSelected] = useState(null);
    const [description, setDescription] = useState(null);
    const [newCardCode, setNewCardCode] = useState(null);
    const [selectedDataType, setSelectedDataType] = useState(null);
    const [selectedDetailData, setSelectedDetailData] = useState(null);
    const [detailTypeOptions, setDetailTypeOptions] = useState([]);
    const [detailTypeDataOptions, setDetailTypeDataOptions] = useState([]);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedChart, setSelectedChart] = useState(null);

    // Update useEffect for reset
    useEffect(() => {
        setName(null);
        setFolder(null);
        setType(null);
        setDetailTypeSelected(null);
        setDescription(null);
        setNewCardCode(null);
        setSelectedDataType(null);
        setSelectedDetailData(null);
        setDetailTypeOptions([])
        setDetailTypeDataOptions([])
        if (isModalVisible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isModalVisible]);

    const typeDescriptions = {
        FileUpLoad: "Tải lên tệp tin từ máy tính của bạn",
        // NotePad: "Tạo tài liệu mới",
        Tiptap: "Tạo tài liệu mới",
        Template: "Tạo mẫu template tùy chỉnh",
        KPI: "Thiết lập chỉ số KPI",
        Data: "Quản lý dữ liệu tài chính",
        ChartTemplate: "Tạo biểu đồ từ template có sẵn"
    };

    const tables1 = [
        {
            value: 'FileUpLoad',
            label: 'File upload',
            icon: <UserUpload height={20} width={20} />
        },
        // {
        //     value: 'NotePad',
        //     label: 'Document',
        //     icon: <Note height={20} width={17}/>
        // },
        {
            value: 'Tiptap',
            label: 'Document',
            icon: <Note height={20} width={17} />
        },
        {
            value: 'Template',
            label: 'Bảng dữ liệu',
            icon: <Template height={20} width={15}></Template>
        },
    ];

    const tables2 = [
        {
            value: 'KPI',
            label: 'KPI',
            icon: <KPI height={20} width={18} />
        },
        {
            value: 'ChartTemplate',
            label: 'Biểu đồ từ bảng dữ liệu',
            icon: <ReportCanvas style={{ width: '30px' }} />
        },
        ...(currentUser?.isAdmin ? [
            // {
            //     value: 'Data',
            //     label: 'Dữ liệu tài chính',
            //     icon: <API height={20} width={19} />
            // },
        ] : [])
    ];

    const [errors, setErrors] = useState({
        name: '',
        folder: '',
        type: ''
    });

    // Update handleChange
    const handleChange = (field, value) => {
        switch (field) {
            case 'name':
                setName(value);
                break;
            case 'type':
                setType(value);
                setDetailTypeSelected('');
                setDescription(typeDescriptions[value] || '');
                setSelectedDataType(value);
                break;
            case 'detailType':
                setDetailTypeSelected(value);
                break;
            case 'description':
                setDescription(value);
                break;
        }
    };
    const handleChangeDetailData = async (value) => {
        setSelectedDetailData(value);

    };
    const handleChangeDetailType = async (option) => {
        setSelectedDetailData(null)
        setDetailTypeSelected(option)
        if (option.value === 'B' || option.value === 'C' || option.value === 'DM') {
            console.log(CANVAS_DATA_PACK.filter(e => option.value && option.value === 'C' ? e.isChart :
                option.value && option.value === 'DM' ? e.isDM :
                    option.value && option.value === 'B' ? !e.isDM && !e.isChart : null
            ))
            let list = CANVAS_DATA_PACK.filter(e => option.value && option.value === 'C' ? e.isChart :
                option.value && option.value === 'DM' ? e.isDM :
                    option.value && option.value === 'B' ? !e.isDM && !e.isChart : null
            ).map((type) => (
                {
                    id: type.id,
                    value: type.value,
                    label: type.name,
                }
            ))
            setDetailTypeDataOptions(list)
        }

    };
    const handleDetailClick = (chartValue) => {
        setSelectedChart(chartValue);
        setIsDetailModalVisible(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalVisible(false);
        setSelectedChart(null);
    };
    const handleChangeType = async (value) => {
        setDetailTypeOptions([])
        setDetailTypeDataOptions([])
        setDetailTypeSelected(null)
        setType(value);
        if (value == 'Template') {
            setDetailTypeOptions(templateOptions)
        }
        if (value == 'KPI') {
            const data = await getAllKpi2Calculator()
            const list = data.map((item) => {
                return {
                    id: item.id,
                    value: item.name,
                    label: item.name,
                    icon: <KPI height={18} width={18} />
                }
            })
            setDetailTypeOptions(list)
        }
        if (value == 'ChartTemplate') {
            const data = await getAllChartTemplate();
            const listFileNotepad = await getAllFileNotePad();

            // Group templates by their parent template name
            const groupedTemplates = data.reduce((acc, item) => {
                const tempName = listFileNotepad?.find(e => item?.id_filenote == e.id)?.name || 'Other';
                if (!acc[tempName]) {
                    acc[tempName] = [];
                }
                acc[tempName].push({
                    id: item.id,
                    value: item,
                    label: item.name,
                    icon: <ReportCanvas height={18} width={18} />
                });
                return acc;
            }, {});

            // Convert grouped data to flat list with headers
            const list = Object.entries(groupedTemplates).flatMap(([groupName, items]) => [
                // Group header
                {
                    id: `group_${groupName}`,
                    value: groupName,
                    label: (<div style={{display: 'flex', justifyContent:'start', alignItems:'center', gap: '5px', color: '#259c63'}}> <Dot/>{groupName}</div>),
                    isHeader: true
                },
                // Group items
                ...items
            ]);

            setDetailTypeOptions(list);
        }
        if (value == 'Data') {
            setDetailTypeOptions(dataOptions)
        }

        if (value == 'Tiptap') {

        }

    };

    const handleChangeFolder = (value) => {
        setType(null)
        setFolder(value);
    };

    // Update validation
    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        if (!name.trim()) {
            newErrors.name = 'Vui lòng nhập tên';
            isValid = false;
        }
        if (!folder) {
            newErrors.folder = 'Vui lòng chọn folder';
            isValid = false;
        }
        if (!type) {
            newErrors.type = 'Vui lòng chọn kiểu';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };
    const handleCreate = async () => {

        if (!name) {
            message.error("Vui lòng điền tên");
            return;
        }
        if (!folder) {
            message.error("Vui lòng chọn folder bạn muốn");
            return;
        }
        if (!type) {
            message.error("Vui lòng chọn kiểu dữ liệu");
            return;
        }

        const itemsInSelectedTab = listFileNote
            ?.filter(item => item.tab === folder)
            ?.map(item => item.position || 0) || [];

        const minPosition = itemsInSelectedTab.length > 0
            ? Math.min(...itemsInSelectedTab)
            : 0;

        const newPosition = minPosition - 1;
        let nameUC = listUC_CANVAS?.find(item => item.id == uCSelected_CANVAS)?.name;
        let newData = {
            name,
            code: newCardCode,
            tab: folder,
            table: type,
            type: type === "Data" ? selectedDataType : null,
            userClass: [uCSelected_CANVAS],
            position: newPosition,
            user_create: currentUser?.email,
            created_at: createTimestamp(),
        }


        if ((type === 'FileUpLoad' || type === 'NotePad' || type == 'Tiptap' || type === 'Template' || type === 'KPI' || type === 'ChartTemplate' || type === 'Data') && nameUC) {
            newData.userClass = [nameUC];
        }
        if (type == 'KPI') {
            newData.type = detailTypeSelected.id || null;
        }
        if (type == 'ChartTemplate') {
            newData.type = detailTypeSelected.id || null;
        }
        if (type == 'Data') {
            newData.type = selectedDetailData.value || null;
        }

        try {
            console.log(detailTypeSelected);
            await createNewFileNotePad(newData).then(data => {
                if (type === 'Data') {
                    data.data.code = `${detailTypeSelected?.value}_${data.data.id}`
                }
                else {
                    data.data.code = `${type}_${data.data.id}`
                }
                updateFileNotePad(data.data)
            })
            handleCloseModal();
            fetchData()
            message.success('Tạo mới thành công');
        } catch (error) {
            message.error('Có lỗi xảy ra khi tạo mới');
            console.error("Error creating new data:", error);
        } finally {
            loadFileTab()
        }
    };

    const ModalTitle = (
        <div className={css.modal_title}>
            <TaoMoiDuLieu_Icon width={30} height={28}/>
                <span>TẠO MỚI DỮ LIỆU</span>

            <TooltipHeaderIcon table={'AddCPN_CANVAS'} />
        </div>
    );
    const ModalFooter = (
        <div className={css.modal_footer}>
            <Button onClick={handleCloseModal}>Hủy</Button>
            <Button
                type="primary"
                onClick={handleCreate}
            // disabled={!formData.name || !formData.folder || !formData.type}
            >
                Tạo
            </Button>
        </div>
    );

    return (
        <Modal
            title={ModalTitle}
            open={isModalVisible}
            onCancel={handleCloseModal}
            footer={ModalFooter}
            onOk={handleCreate}
            width={1500}
            centered
            className={css.main_modal}
        >
            <Row gutter={20} style={{ height: '600px', padding: '0 20px', borderBottom: '1px solid lightgray' }}>
                <Col span={5} className={css.main_column}>
                    <div style={{ marginBottom: 16 }}>
                        <div className={css.title_column}>
                            Nhập tên
                        </div>
                        <Input
                            placeholder="Tên data"
                            value={name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            ref={inputRef}
                            autoFocus
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <div className={css.title_column}>
                            Chọn folder muốn thêm
                        </div>
                        <div className={css.option_list}>
                            {tabs && tabs.filter(e => !e.hide && e.id != 0)
                                .sort((a, b) => (a.position || 0) - (b.position || 0))
                                .map(option => (
                                    <div
                                        key={option.id}
                                        className={`${folder === option.key ? css.selected : css.option_item}`}
                                        onClick={() => handleChangeFolder(option.key)}
                                    >
                                        <Folder_Icon width={18} /> {option.label}
                                    </div>
                                ))}
                        </div>
                    </div>
                </Col>

                <Col span={9} className={css.main_column}>
                    {folder && (
                        <div style={{ marginBottom: 16 }}>
                            <div className={css.title_column}>
                                Kiểu
                            </div>
                            <div className={css.option_list}>
                                {tables1.map(option => (
                                    <div
                                        key={option.value}
                                        className={`${type === option.value ? css.selected : css.option_item}`}
                                        onClick={() => handleChangeType(option.value)}
                                    >
                                        {option.icon} {option.label}
                                    </div>
                                ))}
                                <Divider />
                                {tables2.map(option => (
                                    <div
                                        key={option.value}
                                        className={` ${type === option.value ? css.selected : css.option_item}`}
                                        onClick={() => handleChangeType(option.value)}
                                    >
                                        {option.icon} {option.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Col>

                <Col span={10} className={css.main_column}>
                    {type && !(type == 'FileUpLoad' || type == 'NotePad' || type == 'Tiptap') && detailTypeOptions && (
                        <div style={{ marginBottom: 16 }}>
                            <div className={css.title_column}>Loại chi tiết</div>
                            <div className={css.option_list}>
                                {detailTypeOptions.map(option => (
                                    <div
                                        key={option.id}
                                        className={`${option.isHeader
                                            ? css.groupHeader
                                            : detailTypeSelected?.value === option.value
                                                ? css.selected
                                                : css.option_item
                                        }`}
                                        onClick={() => !option.isHeader && handleChangeDetailType(option)}
                                    >
                                        {!option.isHeader && option.icon} {option.label}
                                        {/*{!option.isHeader && (*/}
                                        {/*    <button*/}
                                        {/*        className={css.detail_button}*/}
                                        {/*        onClick={(e) => {*/}
                                        {/*            e.stopPropagation(); // Prevent triggering the parent div's onClick*/}
                                        {/*            handleDetailClick(option.value); // Open modal with chart*/}
                                        {/*        }}*/}
                                        {/*    >*/}
                                        {/*        Chi tiết*/}
                                        {/*    </button>*/}
                                        {/*)}*/}
                                    </div>
                                ))}
                            </div>
                            <Modal
                                title="Chi tiết"
                                open={isDetailModalVisible}
                                onCancel={closeDetailModal}
                                footer={[

                                ]}
                                width={800}
                                centered
                            >
                                {selectedChart && (
                                    <ChartTemplateElement selectedItem={selectedChart} justShow={true} />
                                )}
                            </Modal>
                            {detailTypeDataOptions && detailTypeDataOptions.length > 0 && (<>
                                <div className={css.title_column}>Chọn dữ liệu chi tiết</div>
                                <div className={css.option_list} style={{ height: '350px' }}>
                                    {detailTypeDataOptions.map(option => (
                                        <div
                                            key={option.value}
                                            className={` ${selectedDetailData?.value === option.value ? css.selected : css.option_item}`}
                                            onClick={() => handleChangeDetailData(option)}
                                        >
                                            {option.label}
                                        </div>
                                    ))}
                                </div>
                            </>)}

                        </div>
                    )}
                </Col>

                {/*<Col span={9}>*/}
                {/*    <div style={{ marginBottom: '30px', height: '100px' }}>*/}
                {/*        <div className={css.title_column}>Mô tả</div>*/}
                {/*        <RichNoteKTQTRI table={`CreateDataForm_${folder ? 'CHECK' : 'CHUNG'}_${type ? type : 'CHUNG'}_${detailTypeSelected && detailTypeSelected?.value ? detailTypeSelected?.value : 'CHUNG'}`} />*/}
                {/*    </div>*/}
                {/*    {type =='ChartTemplate' && detailTypeSelected &&(*/}
                {/*    <div style={{ height: 'calc(100% - 150px)', padding: '10px 0' }}>*/}
                {/*        <div className={css.title_column}>Xem trước</div>*/}

                {/*            <>*/}
                {/*            <ChartTemplateElement selectedItem={detailTypeSelected?.value} justShow={true}/>*/}
                {/*            </>*/}

                {/*    </div>*/}
                {/*    )}*/}
                {/*</Col>*/}
            </Row>
        </Modal>
    );
}

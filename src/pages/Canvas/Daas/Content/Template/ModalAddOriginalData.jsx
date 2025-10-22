import { useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Input, Menu, message, Modal, Popconfirm } from 'antd';
import { DeleteOutlined, DownOutlined } from '@ant-design/icons';
import { getAllUserClass } from '../../../../../apis/userClassService.jsx';
import { getFileNotePadByIdController } from '../../../../../apis/fileNotePadService.jsx';
import {
    createTemplateColumn,
    getTemplateByFileNoteId,
    getTemplateColumn,
} from '../../../../../apis/templateSettingService.jsx';
import {
    createNewBCanvasDataOriginal,
    deleteAllTemplateDataByDataOriginal,
    deleteBCanvasDataOriginal,
    getAllBCanvasDataOriginal,
} from '../../../../../apis/bCanvasDataOriginalService.jsx';
import { n8nWebhook } from '../../../../../apis/n8nWebhook.jsx';
import {
    createTimestamp,
    formatDateTimestamp,
    generateFormNameFromNow,
    getEmailPrefix,
} from '../../../../../generalFunction/format.js';
import css from './ModalAddOriginalData.module.css';
import { MyContext } from '../../../../../MyContext.jsx';
import { Card_Icon } from '../../../../../icon/svg/IconSvg.jsx';
import { toast } from 'react-toastify';

const ModalAddOriginalData = ({ isModalVisible, setIsModalVisible }) => {
    const { companySelect, buSelect, id, idThongKe } = useParams();
    const navigate = useNavigate();
    const [itemSelected, setItemSelected] = useState(null);
    const [fileNotePad, setFileNotePad] = useState('');
    const { currentUser } = useContext(MyContext);
    const [templateData, setTemplateData] = useState(null);
    const [templateColumns, setTemplateColumns] = useState([]);
    const [showSettingsPopup, setShowSettingsPopup] = useState(false);
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [listUC, setListUC] = useState([]);
    const [isApiModalVisible, setIsApiModalVisible] = useState(false);
    useEffect(() => {
        getAllUserClass().then((data) => {
            setListUC(data.filter((e) => e.module == 'CANVAS'));
        });
    }, []);
    const [allTable, setAllTable] = useState([]);
    const [isShowCreateModal, setIsShowCreateModal] = useState(false);
    const [newTableName, setNewTableName] = useState('');
    const [searchText, setSearchText] = useState('');
    const inputRef = useRef(null);
    const [webhookPopVisible, setWebhookPopVisible] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookModalVisible, setWebhookModalVisible] = useState(false);
    const [webhookTableName, setWebhookTableName] = useState('');

    const handleItemClick = async (item) => {
        try {
            setItemSelected(item);

        } catch (error) {
            console.error('Lỗi khi xử lý item:', error);
        }
    };
    useEffect(() => {
        if(isModalVisible){
            setItemSelected(null);
        }
    }, [isModalVisible]);


    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };
    const handleApiClick = () => {
        setIsApiModalVisible(true);
    };

    const handleCloseApiModal = () => {
        setIsApiModalVisible(false);
    };

    async function fetchTable() {
        const fullTable = await getAllBCanvasDataOriginal();
        if (id) {
            let tableOfFileNote = fullTable.filter(e => e.fileNote_id == id);
            console.log(tableOfFileNote);
            if (tableOfFileNote.length > 0) {
                setAllTable(tableOfFileNote);
            } else setAllTable([]);
        }
    }

    const fetchData = async () => {
        try {
            const data = await getFileNotePadByIdController(id);
            const templateInfo = await getTemplateByFileNoteId(id);
            const template = templateInfo[0];
            const templateColumn = await getTemplateColumn(template.id);
            setTemplateColumns(templateColumn);
            setTemplateData(template);
            setFileNotePad(data);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        }
    };


    useEffect(() => {
        if (isShowCreateModal) {
            inputRef.current?.focus();
        }
    }, [isShowCreateModal]);


    useEffect(() => {
        fetchData();
        fetchTable();
    }, [isModalVisible]);


    const handleDelete = async (e, item) => {
        e.stopPropagation(); // Prevent triggering the parent onClick
        try {
            // Add your delete API call here
            await deleteBCanvasDataOriginal(item.id);
            await deleteAllTemplateDataByDataOriginal(item.id);
            message.success('Xóa thành công');
            await fetchTable();
            setItemSelected(null);
        } catch (error) {
            message.error('Có lỗi khi xóa bảng');
        }
    };


    const handleCreateTable = async () => {
        try {
            await createNewBCanvasDataOriginal({ name: newTableName, fileNote_id: id, user_create: currentUser.email, created_at: createTimestamp(), });
            setNewTableName('');
            setIsShowCreateModal(false);
            await fetchTable();
        } catch (error) {
            console.error('Error creating table:', error);
        }
    };

    // Xử lý khi người dùng nhấn Enter
    const handleInputKeyPress = async (e) => {
        if (e.key === 'Enter' && newTableName.trim()) {
            await handleCreateTable();
        }
    };

    const handleFormButtonClick = async () => {
        const newDataOriginal = {
            fileNote_id: id,
            user_create: currentUser.email,
            created_at: createTimestamp(),
            name: generateFormNameFromNow(),
            columns: templateColumns.map(field => field.columnName),
            type: 'Form',

        };

        const response = await createNewBCanvasDataOriginal(newDataOriginal);
        setAllTable([response, ...allTable]);
        setItemSelected(response);
        fetchTable();   
    };


    const handleShareLink = () => {
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/form-template/${id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            message.success('Link đã được sao chép vào clipboard!');
        }).catch((err) => {
            message.error('Có lỗi khi sao chép đường dẫn!');
        });
    };


    const removeVietnameseTones = (str) => {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    };

    const keyword = removeVietnameseTones(searchText || '');


    const filteredData = useMemo(() => allTable.filter((data) =>
        removeVietnameseTones(data.name?.trim().toLowerCase() || '').includes(keyword.toLowerCase()),
    ), [allTable, keyword]);


    const handleAddColumn = async () => {
        const newColumn = { name: '', type: 'text', show: true };

        try {
            const createdColumn = await createTemplateColumn({
                tableId: templateData.id,
                columnName: newColumn.name,
                columnType: newColumn.type,
                show: true,
            });

            setTemplateColumns([...templateColumns, { ...createdColumn, show: true }]);
        } catch (error) {
            console.error('Error creating new column:', error);
            toast.error('Đã xy ra lỗi khi tạo cột mới.');
        }
    };

    const handleCloneColumn = async (columnIndex) => {
        const columnToClone = templateColumns[columnIndex];
        if (!columnToClone) return;
        const { id, ...clonedColumn } = columnToClone;
        const generateUniqueName = (baseName) => {
            let newName = baseName;
            let count = 1;
            while (templateColumns.some((column) => column.columnName == newName)) {
                newName = `${baseName} (${count++})`;
            }
            return newName;
        };
        clonedColumn.columnName = generateUniqueName(columnToClone.columnName);
        try {
            const createdColumn = await createTemplateColumn(clonedColumn);
            toast.success('Cột đã được nhân bản thành công!');
            setTemplateColumns([...templateColumns, { ...createdColumn, show: true }]);
        } catch (error) {
            console.error('Error creating new column:', error);
            toast.error('Đã xảy ra lỗi copy tạo.');
        }
    };


    const handleClosePopUpSetting = async () => {
        setShowSettingsPopup(false);
    };

    function fetchData2() {

    }

    const handleWebhookConfirm = () => {
        if (!webhookUrl) {
            message.error('Vui lòng nhập URL!');
            return;
        }
        n8nWebhook({ urlSheet: webhookUrl })
            .then(res => {
                console.log(res);
                message.success('Đã gửi webhook!');
                setWebhookPopVisible(false);
                setWebhookUrl('');
            })
            .catch(err => {
                console.error(err);
                message.error('Gửi webhook thất bại!');
            });
    };

    const handleCreateWebhookTable = async () => {
        if (!webhookTableName.trim()) {
            message.error('Vui lòng nhập tên bảng!');
            return;
        }
        try {
            await createNewBCanvasDataOriginal({
                name: webhookTableName,
                fileNote_id: id,
                user_create: currentUser.email,
                created_at: createTimestamp(),
                type: 'WEB_HOOK_GGS',
            });
            setWebhookTableName('');
            setWebhookModalVisible(false);
            await fetchTable();
            message.success('Tạo bảng Webhook Google Sheet thành công!');
        } catch (error) {
            message.error('Có lỗi khi tạo bảng!');
        }
    };

    const items = [
        { key: '1', label: 'Gửi API' },
        { key: '2', label: 'Webhook Google Sheet' },
        { key: '3', label: 'Khác...' },
    ];

    const handleMenuClick = (e) => {
        if (e.key === '2') {
            setWebhookModalVisible(true);
        }
        // Xử lý các key khác nếu cần
    };

    const menu = (
        <Menu onClick={handleMenuClick} items={items} />
    );



    return (
        <Modal
            title={'THÊM MỚI DỮ LIỆU'}
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
            width={'90vw'}
            centered
            className={css.modal}
        >
            <div className={css.main}>

                <div className={css.sidebar}>
                    <div className={css.main}>
                        <div className={css.container}>
                            <div className={css.function}>
                                <div className={css.add}
                                    onClick={() => setIsShowCreateModal(true)}
                                >
                                    {/*<Upload_Icon />*/}
                                    <span style={{ fontSize: '25px', marginBottom: '4px', paddingLeft: '10px' }}>+</span>
                                    <span style={{ paddingRight: '1em' }}>Upload</span>
                                </div>
                                <div className={css.form}
                                    onClick={handleFormButtonClick}
                                >
                                    {/*<Form_Icon />*/}
                                    <span style={{ fontSize: '25px', marginBottom: '4px', paddingLeft: '10px' }}>+</span>
                                    <span style={{ paddingRight: '1em' }}>Form</span>
                                </div>

                                <div className={css.form}>
                                    <Dropdown overlay={menu} trigger={['click']}>
                                        <Button>
                                            <span style={{ fontSize: '25px', marginBottom: '4px', paddingLeft: '10px' }}>+</span>
                                            <span style={{ paddingRight: '1em' }}>API</span>
                                            <DownOutlined />
                                        </Button>
                                    </Dropdown>
                                </div>

                            </div>
                            <div className={css.list}>
                                <div className={css.listWrap}>
                                    {filteredData.map(i => (
                                        <div
                                            className={`${css.itemContainer} ${(idThongKe || itemSelected?.id) == i.id ? css.active : ''}`}
                                            onClick={() => handleItemClick(i)}
                                            key={i.id}
                                        >
                                            <div className={css.top}>
                                                <div className={css.nameContainer}>
                                                    <Card_Icon width={22} height={20} />
                                                    <span>{i.name}</span>
                                                </div>
                                                <div className={css.actionContainer}>
                                                    <Popconfirm
                                                        title="Xóa bảng"
                                                        description="Bạn có chắc chắn muốn xóa bảng này?"
                                                        onConfirm={(e) => handleDelete(e, i)}
                                                        onCancel={(e) => e.stopPropagation()}
                                                        okText="Xóa"
                                                        cancelText="Hủy"
                                                        placement="left"
                                                    >
                                                        <DeleteOutlined
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                color: '#ff4d4f',
                                                                cursor: 'pointer',
                                                                fontSize: '16px',
                                                                padding: '4px',
                                                            }}
                                                        />
                                                    </Popconfirm>
                                                </div>
                                            </div>
                                            <div className={css.bottom}>
                                                <div className={css.box}>

                                                </div>
                                                <div className={css.bottomLeft}>
                                                    <span> ID{i.id} | {i.type === 'WEB_HOOK_GGS' ? 'Google Sheet' : i.type === 'WEB_HOOK_FB' ? 'Facebook' :(i.type === 'Form' ? 'Form' : 'Import file')} </span>
                                                </div>
                                                <div
                                                    className={css.bottomRight}>
                                                    <span>{getEmailPrefix(i.user_create)} {formatDateTimestamp(i.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Modal
                            title="Tạo mới"
                            open={isShowCreateModal}
                            onOk={handleCreateTable}
                            onCancel={() => setIsShowCreateModal(false)}
                            okButtonProps={{ disabled: !newTableName.trim() }}
                        >
                            <Input
                                ref={inputRef}
                                placeholder="Nhập tên"
                                value={newTableName}
                                onChange={e => setNewTableName(e.target.value)}
                                onKeyPress={handleInputKeyPress}
                            />
                        </Modal>




                        <Modal
                            title="Tạo bảng Webhook Google Sheet"
                            open={webhookModalVisible}
                            onOk={handleCreateWebhookTable}
                            onCancel={() => setWebhookModalVisible(false)}
                            okText="Tạo bảng"
                            cancelText="Hủy"
                        >
                            <Input
                                value={webhookTableName}
                                onChange={e => setWebhookTableName(e.target.value)}
                                placeholder="Nhập tên bảng"
                                style={{ marginTop: 8 }}
                            />
                        </Modal>
                    </div>
                </div>
                {/*<div className={css.outlet}>*/}
                {/*    {itemSelected?.id &&*/}
                {/*        <ForModalCanvasDuLieuDauVaoDetail_ThongKeDetail*/}
                {/*            idThongKe={itemSelected?.id} />*/}
                {/*    }*/}
                {/*</div>*/}
            </div>

        </Modal>
    );
};

export default ModalAddOriginalData;
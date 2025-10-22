import {Button, Col, Form, Input, List, Modal, Row, Select, Table, Typography} from "antd";
import React, {useContext, useEffect, useState} from "react";
import css from "./PopupSelectDS.module.css";
import {getAllCard} from "../../../../apis/cardService.jsx";
import {SA, SB} from "../../../../Consts/LIST_STEP_TYPE.js";
import {DONE, NOT_DONE_YET} from "../../../../Consts/STEP_STATUS.js";
import {TYPE_SHEET} from "../../../../Consts/SECTION_TYPE.js";
import {getDetailData} from "./logicGom.js";
import {getAllInputMau} from "../../../../generalFunction/logicMau/logicMau.js";
import {createTimestamp, formatCurrency, parseCurrencyInput} from "../../../../generalFunction/format.js";
import {DeleteIcon} from "../../../../icon/IconSVG.js";
import {createNewPhieuXuat} from "../../../../apis/phieuXuatService.jsx";
import {createNewDetailPhieuXuat} from "../../../../apis/detailPhieuXuatService.jsx";
import {toast} from "react-toastify";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import {MyContext} from "../../../../MyContext.jsx";

const {Option} = Select;

export default function PopupSelectDS2({
                                           isOpen,
                                           setIsOpen,
                                           idCardCreate,
                                           sheets,
                                           hhs,
                                           khos,
                                           los,
                                           nhaps,
                                           xuats,
                                           cauHinh,
                                           setDataDetail,
                                           fields,
                                           options,
                                           mainFields,
                                           subFields
                                       }) {
    const { loadData, setLoadData } = useContext(MyContext);
    const [cards, setCards] = useState([]);
    const [currentCardId, setCurrentCardId] = useState(null);
    const [currentStepId, setCurrentStepId] = useState(null);
    const [currentSubStepId, setCurrentSubStepId] = useState(null);
    const [selectedDataLocal, setSelectedDataLocal] = useState([]);
    const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
    const [dataForGom2, setDataForGom2] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [listNumberInput, setListNumberInput] = useState([]);
    const [formData, setFormData] = useState({});
    const columns = [

        {
            title: 'Hàng hóa',
            dataIndex: 'id_hang_hoa',
            key: 'id_hang_hoa',
        },
        {
            title: 'Lô',
            dataIndex: 'id_lo',
            key: 'id_lo',
        },
        {
            title: 'Nhà cung cấp',
            dataIndex: 'id_nha_cung_cap',
            key: 'id_nha_cung_cap',
        },
        {
            title: 'Kho',
            dataIndex: 'id_kho',
            key: 'id_kho',
        },
        {
            title: 'Giá xuất',
            dataIndex: 'gia_xuat',
            key: 'gia_xuat',
        },
        {
            title: 'Số lượng',
            dataIndex: 'so_luong',
            key: 'so_luong',
        },
    ];
    const fetchCurrentUser = async () => {
        const {data} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    // Fetch cards data
    function fetchCards() {
        getAllCard().then((data) => {
            data = data.filter(
                (item) =>
                    item.cau_truc &&
                    item.cau_truc?.length > 0 &&
                    item.cau_truc.find((e) => e.type)
            );
            data.forEach((item) => {
                if (item.cau_truc) {
                    item.cau_truc = item.cau_truc.filter((e, index, array) => {
                        return (
                            e.type === SA &&
                            e.status === DONE &&
                            array[index + 1]?.type === SB &&
                            array[index + 1]?.status === NOT_DONE_YET
                        );
                    });
                    if (item.cau_truc) {
                        let steps = item.cau_truc;
                        steps.forEach((step) => {
                            step.subSteps = step.subSteps.filter(
                                (e) => e.subStepType == TYPE_SHEET
                            );
                        });
                    }
                }
            });
            data = data.filter((item) => item.cau_truc?.length > 0);
            setCards(data);
        });
    }

    useEffect(() => {
        fetchCards();
        fetchCurrentUser()
    }, []);

    // Get steps based on selected card
    const getSteps = () => {
        if (!currentCardId) return [];
        const card = cards.find((card) => card.id === currentCardId);
        return card?.cau_truc || [];
    };

    // Get substeps based on selected step
    const getSubSteps = () => {
        if (!currentStepId) return [];
        const step = getSteps().find((step) => step.id === currentStepId);
        return step?.subSteps || [];
    };
    const handleAddSelection = async () => {
        if (currentCardId && currentStepId && currentSubStepId) {
            let a = await getDetailData(currentCardId, currentSubStepId, sheets, hhs, khos, los, nhaps, xuats, cauHinh)
            const ipms = await getAllInputMau()
            const ipm = ipms.find(e => e.label == 'Mã đơn hàng')

            const newSelection = {
                cardId: currentCardId,
                stepId: currentStepId,
                subStepId: currentSubStepId,
                donHang: `${ipm.default_value}|${currentCardId}`
            };

            // Kiểm tra trùng lặp
            const isDuplicate = selectedDataLocal.some(
                (item) =>
                    item.cardId === newSelection.cardId &&
                    item.stepId === newSelection.stepId &&
                    item.subStepId === newSelection.subStepId
            );

            if (!isDuplicate) {
                setSelectedDataLocal((prev) => [...prev, newSelection]);
                setCurrentCardId(null);
                setCurrentStepId(null);
                setCurrentSubStepId(null);
            } else {
                // Thông báo nếu trùng lặp
                Modal.warning({
                    title: "Bộ đã tồn tại",
                    content: "Bạn đã chọn bộ này trước đó.",
                });
            }
        }
    };
    const handleInputChange = async (e, type) => {

        // Handle different input types
        if (type === 'decimal') {
            const {name, value} = e.target;
            const numericValue = value.replace(/[^\d.-]/g, '');
            setFormData({...formData, [name]: formatCurrency(numericValue)});
            if (!listNumberInput.includes(name)) {
                setListNumberInput(prevFields => [...prevFields, name]);
            }
        } else if (type === 'number') {
            const {name, value} = e.target;
            const numericValue = value.replace(/[^\d.-]/g, '');
            setFormData({...formData, [name]: parseCurrencyInput(numericValue)});
            if (!listNumberInput.includes(name)) {
                setListNumberInput(prevFields => [...prevFields, name]);
            }
        } else if (type === 'text' || type === 'date') {
            const {name, value} = e.target;
            setFormData({...formData, [name]: value});
        } else if (type === 'select') {
            const {name, value} = e.target;
            setFormData({...formData, [name]: value});

        } else if (type === 'object1') {
            setFormData({...formData, lenh_san_xuat: e.target.value});
        }
    };


    // Handle removing a selection
    const handleRemoveSelection = (index) => {
        setSelectedDataLocal((prev) => prev.filter((_, i) => i !== index));
    };

    const loadTable = async () => {
        let dataMoi = []
        if (selectedDataLocal?.length > 0) {

            for (const item of selectedDataLocal) {
                let a = await getDetailData(item.cardId, item.subStepId, sheets, hhs, khos, los, nhaps, xuats, cauHinh)
                const ipms = await getAllInputMau()
                const ipm = ipms.find(e => e.label == 'Mã đơn hàng')
                a.donHang = `${ipm.default_value}|${item.cardId}`;
                a.id_card_create = idCardCreate;
                dataMoi.push(a)
            }

        }
        setDataForGom2(dataMoi)
        setDataDetail(dataMoi)
    }
    useEffect(() => {
        loadTable()
    }, [selectedDataLocal]);
    const handleOk = async () => {
        setIsOpenConfirmModal(true)
    };
    const handleCloseModalConfirm = () => {
        setIsOpenConfirmModal(false)
    };
    const handleSave = async () => {
        const formattedData = {...formData};

        listNumberInput.forEach(fieldName => {
            const value = formattedData[fieldName];
            if (value) {
                formattedData[fieldName] = parseCurrencyInput(value);
            }
        });

        let mainFieldsData = {};
        let subFieldsData = {};

        for (let key in mainFields) {
            if (formattedData[key]) {
                mainFieldsData[key] = formattedData[key];
            }
        }

        for (let key in subFields) {
            if (formattedData[key]) {
                subFieldsData[key] = formattedData[key];
            }
        }
        formData.created_at = createTimestamp();
        formData.user_create = currentUser.email;
        formData.id_card_create = parseInt(idCardCreate)
        for (const eElement of dataForGom2) {
            let newPhieu = {...formData, id_card_create: eElement.id_card_create, donHang: eElement.donHang}
            await createNewPhieuXuat(newPhieu).then(e => {
                    if (e && e.data && dataForGom2?.length > 0) {
                        if (dataForGom2?.length > 0) {
                            for (const eElementElement of eElement) {
                                if (typeof eElementElement === 'object') {
                                    const data = {...eElementElement, id_phieu_xuat: e.data.id}
                                    createNewDetailPhieuXuat(data)
                                }
                            }

                        }

                    }
                }
            )
        }


        toast.success("Tạo dòng thành công", {autoClose: 1000});
        handleCloseModalConfirm()
        setIsOpen(false)
        setDataDetail([])
        setLoadData(!loadData)
    };

    return (
        <>
            <Modal
                title="Chọn nguồn danh sách sản phẩm"
                centered
                open={isOpen}
                onCancel={() => setIsOpen(false)}
                width="60%"
                onOk={handleOk}
                okText={"Kiểm tra"}
            >
                <div className={css.container}>
                    <div className={css.listCard}>
                        <div className={css.selectors}>
                            <h3>Chọn chuỗi</h3>
                            <Select
                                style={{width: "100%"}}
                                placeholder="Chọn chuỗi"
                                onChange={(value) => {
                                    setCurrentCardId(value);
                                    setCurrentStepId(null);
                                    setCurrentSubStepId(null);
                                }}
                                value={currentCardId}
                            >
                                {cards.map((card) => (
                                    <Option key={card.id} value={card.id}>
                                        {card.code}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div className={css.listStep}>
                            <h3>Chọn bước</h3>
                            <Select
                                style={{width: "100%"}}
                                placeholder="Chọn bước"
                                onChange={(value) => {
                                    setCurrentStepId(value);
                                    setCurrentSubStepId(null);
                                }}
                                value={currentStepId}
                                disabled={!currentCardId}
                            >
                                {getSteps().map((step) => (
                                    <Option key={step.id} value={step.id}>
                                        {step.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <div className={css.listSheet}>
                            <h3>Chọn section</h3>
                            <Select
                                style={{width: "100%"}}
                                placeholder="Chọn section"
                                onChange={setCurrentSubStepId}
                                value={currentSubStepId}
                                disabled={!currentStepId}
                            >
                                {getSubSteps().map((subStep) => (
                                    <Option key={subStep.id} value={subStep.id}>
                                        {subStep.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                        <Button
                            style={{marginTop: '10px'}}
                            type="primary"
                            onClick={handleAddSelection}
                            disabled={!currentCardId || !currentStepId || !currentSubStepId}
                        >
                            Thêm
                        </Button>
                    </div>
                    {dataForGom2 && dataForGom2.length > 0 &&

                        <List
                            className={css.selectionList}
                            dataSource={dataForGom2}
                            renderItem={(item, index) => (
                                <div
                                    // actions={[
                                    //     <Button
                                    //         danger
                                    //         onClick={() => handleRemoveSelection(index)}
                                    //         key="remove"
                                    //     >
                                    //         Xóa
                                    //     </Button>,
                                    // ]}
                                >

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '10px',
                                    }}>
                                        <Typography>Chi tiết phiếu xuất (Mã đơn hàng: {item.donHang})</Typography>
                                        <Button
                                            danger
                                            onClick={() => handleRemoveSelection(index)}
                                            key="remove"
                                            style={{marginLeft: '10px'}} // Optional margin for spacing
                                        >
                                            <img src={DeleteIcon} alt={'delete'}/>
                                        </Button>
                                    </div>
                                    <>
                                        <div className={css.data_table}>

                                            {fields.map((field) =>
                                                field.type === 'object' && field.object ? (
                                                    <Table pagination={false} dataSource={item} columns={columns}/>
                                                ) : null
                                            )}
                                        </div>
                                    </>
                                </div>

                            )}
                        />
                    }
                </div>
            </Modal>

            <Modal
                open={isOpenConfirmModal}
                title={'Xác nhận tạo phiếu'}
                onCancel={handleCloseModalConfirm}
                onOk={handleSave}
                centered
                width={1200}
            >
                <Row aria-colspan={12} style={{display: "flex", justifyContent: 'space-between'}}>
                    {fields.map((field) => (
                        <React.Fragment key={field.field}>
                            <Col span={11}>
                                <div>
                                    {(field.type === 'text' && field.field !== 'donHang') && (
                                        <Form.Item label={field.headerName}>
                                            <Input
                                                name={field.field}
                                                value={formData[field.field] || ''}
                                                onChange={(e) => handleInputChange(e, 'text')}
                                                readOnly={field?.readOnly}
                                            />
                                        </Form.Item>
                                    )}
                                    {field.type === 'date' && (
                                        <Form.Item label={field.headerName}>
                                            <Input
                                                name={field.field}
                                                type="date"
                                                value={formData[field.field] || ''}
                                                onChange={(e) => handleInputChange(e, 'date')}
                                            />
                                        </Form.Item>
                                    )}
                                    {field.type === 'decimal' && (
                                        <Form.Item label={field.headerName}>
                                            <Input
                                                name={field.field}
                                                value={formData[field.field] || ''}
                                                onChange={(e) => handleInputChange(e, 'decimal')}
                                            />
                                        </Form.Item>
                                    )}
                                    {field.type === 'number' && (
                                        <Form.Item label={field.headerName}>
                                            <Input
                                                value={formData[field.field] || ''}
                                                name={field.field}
                                                onChange={(e) => handleInputChange(e, 'number')}
                                            />
                                        </Form.Item>
                                    )}
                                    {field.type === 'select' && (
                                        <Form.Item label={field.headerName}>
                                            <Select
                                                name={field.field}
                                                value={formData[field.field] || ''}
                                                onChange={(value) => handleInputChange({
                                                    target: {
                                                        name: field.field,
                                                        value
                                                    }
                                                }, 'select')}
                                            >
                                                {options[field.field]?.map((option) => (
                                                    <Option key={option.id} value={option.id}>{option.label}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    )}
                                    {field.type === 'object1' && (
                                        <Form.Item label={field.headerName}>
                                            <Select
                                                name={field.field}
                                                value={formData[field.field]?.id || undefined} // Use ID for value
                                                onChange={(selectedId) => {
                                                    const selectedObject = options[field.field]?.find(option => option.id === selectedId);
                                                    handleInputChange({
                                                        target: {
                                                            name: field.field,
                                                            value: selectedObject
                                                        }
                                                    }, 'object1');
                                                }}
                                            >
                                                {options[field.field]?.map((option) => (
                                                    <Option key={option.id} value={option.id}>{option.code}</Option> // Use ID as value
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    )}
                                </div>
                            </Col>
                        </React.Fragment>
                    ))}
                </Row>


            </Modal>
        </>
    );
}

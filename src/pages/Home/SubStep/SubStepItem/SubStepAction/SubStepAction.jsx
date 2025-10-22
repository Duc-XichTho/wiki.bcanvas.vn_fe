import React, { useContext, useEffect, useState } from "react";
import { getSubStepDataById } from "../../../../../apis/subStepService.jsx";
import { getCurrentUserLogin } from "../../../../../apis/userService.jsx";
import { DANH_MUC_LIST } from "../../../../../Consts/DANH_MUC_LIST.js";
import { createTimestamp } from "../../../../../generalFunction/format.js";
import { Button, Col, DatePicker, Form, Input, message, Modal, Row, Select, Table } from "antd";
import PopUpFormCreatePhieu from "../../../formCreate/formCreatePhieu.jsx";
import css from "../../../CreateDanhMuc/CreateDanhMuc.module.css";
import { ACTION_BUTTON_LIST } from "../../../../../Consts/ACTION_BUTTON.js";
import { MyContext } from "../../../../../MyContext.jsx";
import { AgGridReact } from "ag-grid-react";
import { filter } from "../../../AgridTable/FilterAgrid.jsx";
import PopupAction from "../../../formCreate/PopupAction.jsx";


const SubStepAction = ({ sub_step_id, idCard, listSubStep, permissionsSubStep }) => {
    const UPDATE_PERMISSION = permissionsSubStep?.update;

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [dialogContent, setDialogContent] = useState(null);
    const { setLoadData, loadData } = useContext(MyContext)
    //Tạo danh mục
    const [actionStep, setActionStep] = useState(null);
    const [fieldUsed, setFieldUsed] = useState(null);
    const [selectedDM, setSelectedDM] = useState(null);
    const [formValues, setFormValues] = useState({});
    const [selectOptions, setSelectOptions] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isModalPhieuOpen, setIsModalPhieuOpen] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [columnDefs, setColumnDefs] = useState([]); // State để lưu cấu trúc cột

    useEffect(() => {
        getSubStepDataById(sub_step_id).then((a) => {
            setSelectedDM(a.value_create_dm)
            setActionStep(a)
        })
    }, [sub_step_id]);
    // Mở modal
    const handleClickBtn = (key) => {
        if (['tao_danh_muc'].includes(key)) {
            setIsModalOpen(true);

        } else {
            setIsModalPhieuOpen(true)
        }
        setDialogContent(key);
    };
    const fetchCurrentUser = async () => {
        const { data, error } = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };
    // Lấy tùy chọn cho các trường select
    useEffect(() => {

        fetchCurrentUser();
        if (selectedDM) {

            const selectedFields = DANH_MUC_LIST.find((dm) => dm.key === selectedDM)?.fields || [];

            selectedFields.forEach((field) => {
                if (field.type === 'select' && typeof field.getAllApi === 'function') {
                    field.getAllApi().then((data) => {

                        setSelectOptions((prev) => ({
                            ...prev,
                            [field.field]: data.map((item) => ({
                                label: item[field.key],
                                value: item.id,
                            })),
                        }));
                    }).catch(err => console.error(`Error fetching data for ${field.field}:`, err));
                }
            });
        }
    }, [selectedDM, loadData]);


    useEffect(() => {
        if (selectedDM) {
            const selectedDMData = DANH_MUC_LIST.find((dm) => dm.key === selectedDM);
            setFieldUsed(selectedDMData)
            if (selectedDMData) {
                // Cập nhật cấu trúc cột
                const fields = selectedDMData.fields.filter(field => field.type && field.field !== 'id');
                const columns = fields.map(field => ({
                    headerName: field.headerName,
                    field: field.field,
                    sortable: true,

                    ...filter(),

                }));
                setColumnDefs(columns);

                // Giả sử bạn có một API để lấy dữ liệu cho bảng
                selectedDMData.getAllApi().then(data => {
                    setTableData(data);
                });
            }
        }
    }, [selectedDM, loadData]);
    // Xử lý thay đổi input
    const handleInputChange = (fieldKey, value) => {
        setFormValues((prev) => ({
            ...prev,
            [fieldKey]: value,
            created_at: createTimestamp(),
            user_create: currentUser.email
        }));
    };
    // Hàm kiểm tra tính duy nhất của mã
    const checkCodeUnique = async (newCode) => {
        try {

            // Gọi API để lấy danh sách các mã hiện có
            const response = await fieldUsed.getAllApi() // Đường dẫn API cần thay đổi theo thực tế
            const existingCodes = await response.map(e => e.code)

            // Kiểm tra xem mã mới có tồn tại trong danh sách không
            return !existingCodes.includes(newCode);
        } catch (error) {
            console.error("Error checking code uniqueness:", error);
            return false; // Nếu có lỗi, coi như không duy nhất
        }
    };
    // Lưu dữ liệu form
    const handleSaveDM = async () => {
        setLoading(true); // Bắt đầu loading


        if (!fieldUsed || !fieldUsed.createApi) {
            message.error("Danh mục không hợp lệ hoặc thiếu API tạo.");
            setLoading(false);
            return;
        }
        if (!formValues.code || formValues.code == '') {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                message.error("Trường thông tin 'Code' là bắt buộc. Vui lòng nhập!");
            }, 1000)

            return;
        }
        // Kiểm tra tính duy nhất của mã
        const isCodeUnique = await checkCodeUnique(formValues.code); // Giả sử 'code' là trường bạn muốn kiểm tra
        if (!isCodeUnique) {
            message.error("Code đã tồn tại. Vui lòng nhập mã khác.");
            setLoading(true);
            return;
        }

        fieldUsed.createApi(formValues)
            .then((response) => {
                if (response.status === 201) {
                    setTimeout(() => {
                        message.success("Danh mục đã được tạo thành công!");
                        handleCloseModal();
                        setLoadData(pre => !pre);
                        setFormValues({});
                    }, 1000);
                }
            })
            .catch((err) => {
                console.error(err);
                message.error("Không thể tạo danh mục.");
            })
            .finally(() => {
                setLoading(false); // Dừng loading
            });
    };


    // Đóng modal
    const handleCloseModal = () => {
        setIsModalOpen(false);

    };

    // Render nội dung form động
    const RenderContent = () => {
        switch (dialogContent) {
            case 'tao_danh_muc':
                return (<>
                    {/* Modal */}
                    <Modal
                        title={selectedDM ? DANH_MUC_LIST.find(e => e.key === selectedDM).label : ''}
                        centered
                        open={isModalOpen}
                        onCancel={handleCloseModal}
                        width={1400}

                        cancelText="Đóng"
                        okText="Tạo"
                        confirmLoading={loading} // Hiện loading khi đang lưu
                        onOk={handleSaveDM}
                    >

                        {/*<h4>Danh mục</h4>*/}
                        <Form layout="vertical">
                            {/* Dropdown chọn danh mục */}




                            <div
                                className={`${selectedDM ? `${css.active} ${css.modalcontent}` : `${css.modalcontent}`}`}
                                style={{ display: `${selectedDM ? 'block' : 'none'}` }}
                            >
                                <Row aria-colspan={12} style={{ display: 'flex', position: "relative" }}>


                                    {/* Phần bên phải: Trống để xử lý */}
                                    <Col span={18} style={{ padding: '5px' }}>
                                        <div className="ag-theme-quartz" style={{ height: '800px', width: '100%', padding: '5px' }}>
                                            <AgGridReact
                                                columnDefs={columnDefs}
                                                rowData={tableData}
                                                enableRangeSelection
                                            />
                                        </div>
                                    </Col>

                                    {/* Phần bên trái: Hiện các trường hiện tại */}
                                    <Col span={6} style={{ display: 'flex', flexDirection: 'column', padding: '10px', height: "800px", overflow: "auto" }}>
                                        {selectedDM &&
                                            DANH_MUC_LIST.find((dm) => dm.key === selectedDM)?.fields
                                                .filter((field) => field.type && field.field !== 'id')
                                                .map((field) => (
                                                    <Form.Item key={field.field} label={field.headerName} style={{ flex: '1 0 auto', padding: '5px' }}>
                                                        {field.type === 'text' && (
                                                            <Input
                                                                value={formValues[field.field] || ''}
                                                                onChange={(e) => handleInputChange(field.field, e.target.value)}
                                                            />
                                                        )}
                                                        {field.type === 'number' && (
                                                            <Input
                                                                type="number"
                                                                value={formValues[field.field] || ''}
                                                                onChange={(e) => handleInputChange(field.field, e.target.value)}
                                                            />
                                                        )}
                                                        {field.type === 'date' && (
                                                            <DatePicker
                                                                style={{ width: '100%' }}
                                                                format={'DD/MM/YYYY'}
                                                                value={formValues[field.field] || ''}
                                                                onChange={(date) => handleInputChange(field.field, date)}
                                                            />
                                                        )}
                                                        {field.type === 'select' && (
                                                            <Select
                                                                showSearch
                                                                value={formValues[field.field] || ''}
                                                                onChange={(value) => handleInputChange(field.field, value)}
                                                            >
                                                                {(selectOptions[field.field] || []).map((option) => (
                                                                    <Select.Option key={option.value} value={option.label}>
                                                                        {option.label}
                                                                    </Select.Option>
                                                                ))}
                                                            </Select>
                                                        )}
                                                    </Form.Item>
                                                ))}
                                    </Col>
                                </Row>
                            </div>

                        </Form>
                    </Modal>
                </>
                );
            case 'tao_phieu_nhap':

                return (<>
                    <PopUpFormCreatePhieu
                        table="PhieuNhap"
                        onClose={() => setIsModalPhieuOpen(false)}
                        open={isModalPhieuOpen}
                        reload={() => {
                        }}
                        currentUser={currentUser}
                    />
                </>

                );

            case 'tao_phieu_xuat':
                return (
                    <PopUpFormCreatePhieu
                        table="PhieuXuat"
                        onClose={() => setIsModalPhieuOpen(false)}
                        open={isModalPhieuOpen}
                        reload={() => {
                        }}
                        currentUser={currentUser}
                    />
                );
            case 'offset-1':
                return (
                    <PopupAction
                        table="offset-1"
                        onClose={() => setIsModalPhieuOpen(false)}
                        open={isModalPhieuOpen}
                        reload={() => {
                        }}
                        currentUser={currentUser}
                    />
                )
            case 'offset-2':
                return (
                    <PopupAction
                        table="offset-2"
                        onClose={() => setIsModalPhieuOpen(false)}
                        open={isModalPhieuOpen}
                        reload={() => {
                        }}
                        currentUser={currentUser}
                    />
                )
        }
    };

    return (
        <div className={css.container}>
            {UPDATE_PERMISSION
                ? (
                    ACTION_BUTTON_LIST.map((e) => {
                        if (actionStep?.action_list.includes(e.key)) {
                            return (
                                <Button
                                    key={e.key}
                                    className={css.btnAdd}
                                    onClick={() => handleClickBtn(e.key)}
                                >
                                    <img src={e.icon} alt="" /> {e.label}
                                </Button>
                            );
                        }
                        return null;
                    })
                )
                : (<></>)
            }
            {RenderContent()}
        </div>
    );
};
export default SubStepAction;

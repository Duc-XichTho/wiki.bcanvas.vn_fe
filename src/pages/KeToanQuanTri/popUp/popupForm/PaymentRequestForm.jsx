import React, {useContext} from 'react';
import './style.css';
import 'react-datepicker/dist/react-datepicker.css';
import {Field, Form, Formik, useFormikContext} from "formik";
import {MyContext} from "../../../../MyContext.jsx";
import Select from "react-select";

const NhanVienSelect = ({name, options}) => {
    const {setFieldValue} = useFormikContext();


    const handleChange = selectedOption => {
        setFieldValue(name, selectedOption ? selectedOption.value : '');
        if (name === "id_nhanvien_de_nghi") {
            setFieldValue('team', selectedOption.teamList ? selectedOption.teamList.team : '');
        }
    };

    const customOptions = options.map(option => ({
        value: option.id,
        label: option.ten_day_du,
        teamList: {
            team: option.teamList?.team
        }
    }));

    return (
        <Select
            options={customOptions}
            onChange={handleChange}
            placeholder="Chọn..."
        />
    );
};
const KhoanMucSelect = ({name, options}) => {
    const {setFieldValue} = useFormikContext();


    const handleChange = selectedOption => {
        setFieldValue(name, selectedOption ? selectedOption.value : '');
        if (name === "id_km_thuchi") {
            setFieldValue('knms', selectedOption.kmns ? selectedOption.kmns.khoan_muc_thu_chi : '');
        }
    };

    const customOptions = options.map(option => ({
        value: option.id,
        label: option.khoan_muc_thu_chi,
        kmns: {
            khoan_muc_thu_chi: option.kmns?.khoan_muc_thu_chi
        }
    }));

    return (
        <Select
            options={customOptions}
            onChange={handleChange}
            placeholder="Chọn..."
        />
    );
};

const PaymentRequestPopup = ({onClose}) => {

    let {sheetPermissionsInfo, currentUser} = useContext(MyContext);
    const table = 'payment-request';
    const {value, setValue} = useContext(MyContext);
    const {listNV, setListNV} = useContext(MyContext);
    const {listKmThuChi, setListKmThuChi} = useContext(MyContext);


    const handleSubmit = (values) => {
    };

    const initialValues = {
        loai_de_nghi: null,
        ma_de_nghi: null,
        id_nhanvien_de_nghi: null,
        id_team: null,
        team: null,
        ngay: new Date().toISOString(),
        so_tien: null,
        dien_giai: null,
        khoan_muc: null,
        dinh_kem: null,
        id_nhanvien_ke_toan: null,
        id_nhanvien_manager: null,
        id_nhanvien_giam_doc: null,
    };

    return (
        <div className="popup-form">
            <div className="popup-header">
                <h2>Thêm mới yêu cầu</h2>

            </div>
            <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit}
            >
                <Form>
                    <div className="popup-content">
                        <div className="form-group-all">
                            <div className="form-group">
                                <label htmlFor="id_nhanvien_de_nghi">Nhân viên đề nghị</label>
                                <Field name="id_nhanvien_de_nghi">
                                    {({field}) => (
                                        <NhanVienSelect
                                            name={field.name}
                                            options={listNV}
                                        />
                                    )}
                                </Field>
                            </div>
                            <div className="form-group">
                                <label htmlFor="team">Team</label>
                                <Field name="team">
                                    {({field}) => (
                                        <input
                                            type="text"
                                            {...field}
                                            placeholder="Team"
                                            readOnly
                                        />
                                    )}
                                </Field>
                            </div>
                            <div className="form-group">
                                <label htmlFor="ma_de_nghi">Mã đề nghị</label>
                                <Field type="text" name="ma_de_nghi"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="loai_de_nghi">Loại đề nghị</label>
                                <Field type="text" name="loai_de_nghi"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="ngay">Ngày</label>
                                <Field type="date" className="date-picker" name="ngay"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="so_tien">Số tiền</label>
                                <Field type="text" name="so_tien"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="khoan_muc">Khoản mục</label>
                                <Field type="text" name="id_km_thuchi">
                                    {({field}) => (
                                        <KhoanMucSelect
                                            name={field.name}
                                            options={listKmThuChi}
                                        />
                                    )}
                                </Field>
                            </div>
                            <div className="form-group">
                                <label htmlFor="dinh_kem">Đính kèm</label>
                                <Field type="text" name="dinh_kem"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="id_nhanvien_ke_toan">Nhân viên kế toán</label>
                                <Field as="select" name="id_nhanvien_ke_toan">
                                    {({field}) => (
                                        <NhanVienSelect
                                            name={field.name}
                                            options={listNV}
                                        />
                                    )}
                                </Field>
                            </div>
                            <div className="form-group">
                                <label htmlFor="id_nhanvien_manager">Nhân viên quản lý</label>
                                <Field as="select" name="id_nhanvien_manager">
                                    {({field}) => (
                                        <NhanVienSelect
                                            name={field.name}
                                            options={listNV}
                                        />
                                    )}
                                </Field>
                            </div>
                            <div className="form-group">
                                <label htmlFor="id_nhanvien_giam_doc">Nhân viên giám đốc</label>
                                <Field as="select" name="id_nhanvien_giam_doc">
                                    {({field}) => (
                                        <NhanVienSelect
                                            name={field.name}
                                            options={listNV}
                                        />
                                    )}
                                </Field>
                            </div>
                            <div className="form-group">
                                <label htmlFor="dien_giai">Diễn giải</label>
                                <Field as={"textarea"} name="dien_giai" style={{maxWidth: '100%'}} />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="action-button save">Tạo</button>
                            <button type={"button"} className="x" onClick={onClose}>Hủy</button>
                        </div>
                    </div>
                </Form>
            </Formik>
        </div>
    );
};

export default PaymentRequestPopup;

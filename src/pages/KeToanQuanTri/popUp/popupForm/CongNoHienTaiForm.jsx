import {handleAddAgl} from "../../function/handleAddAgl.js";
import {getCurrentDateTimeWithHours} from "../../function/formatDate.js";
import {Field, Form, Formik} from "formik";
import "./style.css"

const CongNoHienTaiForm = ({ onClose }) => {
    const table = "CongNoHienTai";
    const company = "HVA";
    const handleSubmit = (values) => {
        handleAddAgl(company, { ...values, show: true }, table)
            .then(() => {
                onClose();
            })
            .catch((error) => {
                console.error("Error: ", error);
            });
    };

    const initialValues = {
        header: null,
        layer: null,
        business_unit: null,
        so_tien: null,
        due_date: null,
        createAt: getCurrentDateTimeWithHours(),
        show: true,
    };

    return (
        <div className="popup-form">
            <div className="popup-header">
                <h2>Thêm hợp đồng</h2>
            </div>
            <Formik initialValues={initialValues} onSubmit={handleSubmit}>
                <Form>
                    <div className="popup-content">
                        <div className="form-group-all">
                            <div className="form-group">
                                <label htmlFor="header">Tiêu đề</label>
                                <Field type="text" name="header"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="layer">Layer</label>
                                <Field type="text" name="layer"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="business_unit">Đơn vị</label>
                                <Field type="text" name="business_unit"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="so_tien">Số tiền</label>
                                <Field type="text" name="so_tien"/>
                            </div>

                            <div className="form-group">
                                <label htmlFor="due_date">Ngày</label>
                                <Field type="text" name="due_date"/>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button className="action-button save">Tạo</button>
                            <span className={"x"} onClick={onClose}>
                Hủy
              </span>
                            {/*<button className="action-button clear-cmt">Clear cmt</button>*/}
                        </div>
                    </div>
                </Form>
            </Formik>
        </div>
    );
};

export default CongNoHienTaiForm;

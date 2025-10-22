import React, { useContext, useEffect, useState } from 'react';
import './formAJ.css';
import 'react-datepicker/dist/react-datepicker.css';
import { Field, Form, Formik } from 'formik';

import { getCurrentDateTimeWithHours } from '../../function/formatDate.js';
import { IoClose } from 'react-icons/io5';
// import LoadingOverlay from "../../LoadingOverlay.jsx";
import dayjs from 'dayjs';
import { Dialog, Popover } from '@mui/material';
import { AiOutlineCopy } from 'react-icons/ai';
import { getAllVas } from '../../../../apisKTQT/vasService.jsx';
import { getAllKmf } from '../../../../apisKTQT/kmfService.jsx';
import { getAllKmns } from '../../../../apisKTQT/kmnsService.jsx';
import { getAllProject } from '../../../../apisKTQT/projectService.jsx';
import { getAllTeam } from '../../../../apisKTQT/teamService.jsx';
import { getAllUnits } from '../../../../apisKTQT/unitService.jsx';
import { getAllProduct } from '../../../../apisKTQT/productService.jsx';
import { getAllVendor } from '../../../../apisKTQT/vendorService.jsx';
import { toast } from 'react-toastify';
import SelectField from './SelectDropdownInForm.jsx';
import { handleAddAgl } from '../../function/handleAddAgl.js';
import { formatCurrency } from '../../function/formatMoney.js';

export const svgInput = (
  <svg xmlns="http://www.w3.org/2000/svg" width="17px" height="17px" viewBox="0 0 20 20">
    <path
      fill="#454545"
      d="m14 12l-4-4v3H2v2h8v3m10 2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3h2V6h12v12H6v-3H4v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"
    />
  </svg>
);
export const svgList = (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
    <path
      fill="#454545"
      d="m5.06 7.356l2.795 2.833c.08.081.21.081.29 0l2.794-2.833c.13-.131.038-.356-.145-.356H5.206c-.183 0-.275.225-.145.356Z"
    />
    <path
      fill="#454545"
      d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 15H2.75A1.75 1.75 0 0 1 1 13.25Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25Z"
    />
  </svg>
);

const AccountingJournalPopup = ({ onClose, onGridReady, company }) => {
  let table = 'SoKeToan';
  const [showRightSections, setShowRightSections] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openPopover = Boolean(anchorEl);
  const [isLoading, setIsLoading] = useState(false);

  const [listVAS, setListVAS] = useState([]);
  const [listKmns, setListKmns] = useState([]);
  const [listKmf, setListKmf] = useState([]);
  const [listProject, setListProject] = useState([]);
  const [listUnit, setListUnit] = useState([]);
  const [listProduct, setListProduct] = useState([]);
  const [listTeam, setListTeam] = useState([]);
  const [listVendor, setListVendor] = useState([]);
  const [checkError, setCheckError] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vas = await getAllVas();
        const kmns = await getAllKmns();
        const kmf = await getAllKmf();
        const project = await getAllProject();
        const team = await getAllTeam();
        const unit = await getAllUnits();
        const product = await getAllProduct();
        const vendor = await getAllVendor();

        // Chuyển đổi dữ liệu cho mỗi danh sách
        setListVAS(vas.map((item) => ({ value: item.ma_tai_khoan, label: item.ma_tai_khoan })));
        setListKmns(kmns.map((item) => ({ value: item.name, label: item.name })));
        setListKmf(kmf.map((item) => ({ value: item.name, label: item.name })));
        setListProject(project.map((item) => ({ value: item.project_viet_tat, label: item.project_viet_tat })));
        setListTeam(team.map((item) => ({ value: item.code, label: item.code })));
        setListUnit(unit.map((item) => ({ value: item.code, label: item.code })));
        setListProduct(product.map((item) => ({ value: item.code, label: item.code })));
        setListVendor(vendor.map((item) => ({ value: item.name, label: item.name })));
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (values) => {
    const checkErr = checkError;
    if (checkErr) {
      await handleAddAgl(company, values, table);
      onClose();
      onGridReady();
    } else {
      toast.error(`Vui lòng kiểm tra ngày tháng do sai định dạng`);
    }
    setIsLoading(true);
  };

  const date = dayjs(new Date()).format('DD-MM-YYYY');
  const day = date.substring(0, 2);
  const month = date.substring(3, 5);
  const year = date.substring(6);
  const initialValues = {
    day: day,
    month: month,
    year: year,
    diengiai: '',
    tk_no: '',
    tk_co: '',
    kmns: '',
    kmf: '',
    so_tien: '0',
    project: '',
    unit_code: '',
    team_code: '',
    product: '',
    vender: '',
    createAt: getCurrentDateTimeWithHours(),
    dp1: '',
    company: company ? company : '',
  };

  const validateField = (fieldName, value) => {
    if (isNaN(value) || typeof value !== 'string' || !/^\d+$/.test(value)) {
      toast.error(`Giá trị phải là số và không chứa ký tự chữ`);
      setCheckError(false);
      return;
    }
    value = Number(value);
    if (fieldName === 'day') {
      if (value < 1 || value > 31) {
        toast.error('Ngày không hợp lệ');
        setCheckError(false);
      }
    }
    if (fieldName === 'month') {
      if (value < 1 || value > 12) {
        toast.error('Tháng không hợp lệ');
        setCheckError(false);
      }
    }
    if (fieldName === 'year') {
      if (value < 1900 || value > new Date().getFullYear()) {
        toast.error('Năm không hợp lệ');
        setCheckError(false);
      }
    }
  };
  const handleFormatMoney = (value, setFieldValue, fieldName) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const formattedValue = formatCurrency(numericValue);
    setFieldValue(`${fieldName}_formatted`, formattedValue);
    setFieldValue(fieldName, numericValue);
  };

  return (
    <Dialog open={true} fullWidth maxWidth="md" disableEscapeKeyDown>
      <div className={`popup-form ${showRightSections ? 'expanded' : ''}`}>
        {/*{isLoading && <LoadingOverlay/>}*/}
        <div className="popup-header">
          <h2>PHIẾU KẾ TOÁN</h2>
          <IoClose size={30} color={'#696969'} onClick={() => onClose()} style={{ cursor: 'pointer' }} />
        </div>
        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
          {({ values, setFieldValue }) => (
            <Form
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            >
              <div className="top-form-aj">
                <div className="top-left-aj" style={{ margin: '10px 0 0 10px' }}>
                  <label htmlFor="date">Ngày</label>
                  <Field
                    type="text"
                    className="date-picker"
                    name="day"
                    style={{ width: '25%', border: '0' }}
                    onBlur={(e) => validateField('day', e.target.value)}
                  />
                  <label htmlFor="date" style={{ marginLeft: 25 }}>
                    Tháng
                  </label>
                  <Field
                    type="text"
                    className="date-picker"
                    name="month"
                    style={{ width: '25%', border: '0' }}
                    onBlur={(e) => validateField('month', e.target.value)}
                  />
                  <label htmlFor="date" style={{ marginLeft: 25 }}>
                    Năm
                  </label>
                  <Field
                    type="text"
                    className="date-picker"
                    name="year"
                    style={{ width: '50%', border: '0' }}
                    onBlur={(e) => validateField('year', e.target.value)}
                  />
                </div>

                <div className="top-right"></div>
              </div>
              <div className="form-group-aj">
                <div className="hr">
                  <p>Định khoản cơ bản</p>
                </div>
                <div className="form-content">
                  <div className={`mid-form-aj ${showRightSections ? 'expanded' : ''}`}>
                    <div className="mid-left">
                      <div className="content-aj-1 content-aj-1-input">
                        <label htmlFor="dien_giai">Diễn giải {svgInput}</label>
                        <Field type="text" name="diengiai" />
                      </div>

                      <div className="content-aj-1">
                        <label htmlFor="tk_no">TK nợ {svgList}</label>
                        <Field name="tk_no" component={SelectField} options={listVAS} />
                      </div>

                      <div className="content-aj-1">
                        <label htmlFor="tk_co">TK có {svgList}</label>
                        <Field name="tk_co" component={SelectField} options={listVAS} />
                      </div>

                      <div className="content-aj-1">
                        <label htmlFor="kmns">KMNS {svgList}</label>
                        <Field name="kmns" component={SelectField} options={listKmns} />
                      </div>
                      <div className="content-aj-1">
                        <label htmlFor="kmf">KMP {svgList}</label>
                        <Field name="kmf" component={SelectField} options={listKmf} />
                      </div>
                      <div className="content-aj-1">
                        <label htmlFor="so_tien">Số tiền</label>
                        {/*<Field type="number"*/}
                        {/*       name="so_tien"*/}
                        {/*     />*/}
                        <Field
                          type="text"
                          name="so_tien_formatted"
                          onChange={(e) => handleFormatMoney(e.target.value, setFieldValue, 'so_tien')}
                        />

                        {/* Input ẩn để lưu trữ giá trị thực */}
                        <Field type="hidden" name="so_tien" />
                      </div>
                    </div>
                  </div>

                  <div className="hr">
                    <p>Thông tin quản trị khác</p>
                  </div>
                  <div className={`bot-form-aj ${showRightSections ? 'expanded' : ''}`}>
                    <div className="bot-left">
                      <div className="content-aj-1">
                        <label htmlFor="project">Dự án {svgList}</label>
                        <Field name="project" component={SelectField} options={listProject} />
                      </div>
                      <div className="content-aj-1">
                        <label htmlFor="product">Sản phẩm {svgList}</label>
                        <Field name="product" component={SelectField} options={listProduct} />
                      </div>
                      <div className="content-aj-1">
                        <label htmlFor="team">Team {svgList}</label>
                        <Field name="team_code" component={SelectField} options={listTeam} />
                      </div>
                      <div className="content-aj-1">
                        <label htmlFor="unit">Đơn vị {svgList}</label>
                        <Field name="unit_code" component={SelectField} options={listUnit} />
                      </div>
                      <div className="content-aj-1">
                        <label htmlFor="selectedKH">Khách hàng {svgList}</label>
                        <Field name="vender" component={SelectField} options={listVendor} />
                      </div>
                      <div className="content-aj-1 content-aj-1-input">
                        <label htmlFor="chu_thich">Chú thích {svgInput}</label>
                        <Field type="text" name="dp1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="footer-form-aj">
                <button type="submit" className="action-button save">
                  Lưu
                </button>
                <button type={'button'} className={'action-button x'} onClick={() => onClose()}>
                  Hủy
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Dialog>
  );
};

export default AccountingJournalPopup;

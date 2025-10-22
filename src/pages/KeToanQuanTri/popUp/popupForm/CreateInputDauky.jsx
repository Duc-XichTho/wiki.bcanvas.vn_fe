import React, { useContext, useEffect, useState } from 'react';
import './formAJ.css';
import 'react-datepicker/dist/react-datepicker.css';
import { Field, Form, Formik } from 'formik';

import { IoClose } from 'react-icons/io5';

import { Dialog, Popover } from '@mui/material';

import { toast } from 'react-toastify';
import { handleAddAgl } from '../../function/handleAddAgl.js';
import { formatCurrency } from '../../function/formatMoney.js';
import { getAllMaCashPlan } from '../../../../apisKTQT/maCashPlanService.jsx';
import { handleSaveAgl } from '../../function/handleSaveAgl.js';

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

const CreateInputDauky = ({ onClose, company }) => {
  let table = 'MaCashPlan';
  const [showRightSections, setShowRightSections] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openPopover = Boolean(anchorEl);
  const [isLoading, setIsLoading] = useState(false);
  const [updatedData, setUpdatedData] = useState([]);

  const handleSubmit = async (values) => {
    const cashPlan = await getAllMaCashPlan();

    const selectedCashPlan = cashPlan.find((plan) => plan.khoan_thu_chi === 'Dư đầu kỳ');

    let t1_kehoach = selectedCashPlan && selectedCashPlan.t1_kehoach ? parseFloat(selectedCashPlan.t1_kehoach) : 0;

    let so_tien = values.so_tien ? parseFloat(values.so_tien) : 0;

    let updated = t1_kehoach + so_tien;
    await handleSaveAgl([{ ...selectedCashPlan, t1_kehoach: updated }], table);
    onClose();
    setIsLoading(true);
  };

  const initialValues = {
    t1_kehoach: '',
  };

  const handleFormatMoney = (value, setFieldValue, fieldName) => {
    const numericValue = value.replace(/[^0-9-]/g, '');
    const formattedValue = formatCurrency(numericValue);
    setFieldValue(`${fieldName}_formatted`, formattedValue);
    setFieldValue(fieldName, numericValue);
  };

  return (
    <Dialog open={true} fullWidth maxWidth="md" disableEscapeKeyDown>
      <div className={`popup-form ${showRightSections ? 'expanded' : ''}`}>
        <div className="popup-header">
          <h2>Điều Chỉnh Đầu Kỳ</h2>
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
                <div className="top-right"></div>
              </div>
              <div className="form-group-tc">
                <div className="form-content">
                  <div className={`mid-form-aj ${showRightSections ? 'expanded' : ''}`}>
                    <div className="mid-left">
                      <div className="content-aj-1">
                        <Field
                          type="text"
                          name="so_tien_formatted"
                          style={{ width: '40%', margin: 'auto', textAlign: 'right' }}
                          onChange={(e) => handleFormatMoney(e.target.value, setFieldValue, 'so_tien')}
                        />
                        <Field type="hidden" name="so_tien" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="footer-form-aj" style={{ marginTop: '0' }}>
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

export default CreateInputDauky;

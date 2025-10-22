import React, { useState } from 'react';
import './leadPipe.css';

const LeadFormModal = ({ show, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    lead_event: '',
    lead_event_date: '',
    event_location: '',
    status: 'Chưa bắt đầu',
    danh_gia: '',
    PIC: '',
    show: true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="form-overlay">
      <div className="form-content">
        <h2>LEAD Form</h2>
        <label>
          Sự kiện LEAD:
          <input type="text" name="lead_event" value={formData.lead_event} onChange={handleChange} />
        </label>
        <label>
          Ngày tổ chức:
          <input type="date" name="lead_event_date" value={formData.lead_event_date} onChange={handleChange} />
        </label>
        <label>
          Địa điểm:
          <input type="text" name="event_location" value={formData.event_location} onChange={handleChange} />
        </label>
        <label>
          Trạng thái:
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Đang tiến hành">Đang tiến hành</option>
            <option value="Chưa bắt đầu">Chưa bắt đầu</option>
          </select>
        </label>
        <label>
          Đánh giá:
          <input type="text" name="danh_gia" value={formData.danh_gia} onChange={handleChange} />
        </label>
        <label>
          Người đảm nhiệm:
          <input type="text" name="PIC" value={formData.PIC} onChange={handleChange} />
        </label>
        <div className="form-buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default LeadFormModal;

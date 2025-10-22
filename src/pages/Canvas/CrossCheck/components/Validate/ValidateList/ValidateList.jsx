import css from './ValidateList.module.css'
import { useState, useEffect } from 'react'
import { getAllCrossCheck } from '../../../../../../apis/crossCheckService'
import ValidateElement from '../ValidateElement/ValidateElement'
import { PlusOutlined } from '@ant-design/icons';
import ValidateCreateForm from '../ValidateCreateForm/ValidateCreateForm';
import { Button } from 'antd';
import { Create_Icon } from '../../../../../../icon/svg/IconSvg.jsx';

const ValidateList = ({ onCreateNew }) => {
  const [validateList, setValidateList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refetch, setRefetch] = useState(false);

  const fetchAllCrossCheck = async () => {
    try {
      const response = await getAllCrossCheck();
      const filteredList = response.filter(item => item.type === 'Validate');
      setValidateList(filteredList);
    } catch (error) {
      console.log('ERROR fetchAllCrossCheck', error);
    }
  }

  useEffect(() => {
    fetchAllCrossCheck();
  }, [refetch]);

  return (
    <div className={css.main}>

      <div className={css.sidebar}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          padding: '8px 2px 8px 8px',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Danh sách Validate</span>
          <Button onClick={() => {
              setShowCreateForm(true)
              setSelectedItem(null)
            }}
              style={{
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                border: 'none',
                backgroundColor: 'transparent',
                boxShadow: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Create_Icon width={20} height={22} />
              </div>
          </Button>
        </div>

        {validateList?.map((item) => (
          <div
            key={item.id}
            title={item.name}
            className={`${css.sidebarItem} ${selectedItem?.id === item.id ? css.selected : ''}`}
            onClick={() => {
              setSelectedItem(item)
              setShowCreateForm(false)
            }}
          >
            <span>{item.name}</span>
          </div>
        ))}
      </div>
      <div className={css.content}>
        {selectedItem && <ValidateElement selectedItem={selectedItem} setSelectedItem={setSelectedItem} fetchAllCrossCheck={fetchAllCrossCheck} />}
        {showCreateForm && <ValidateCreateForm onBack={() => setShowCreateForm(false)} setRefetch={setRefetch} refetch={refetch} />}
      </div>
    </div>
  )
}

export default ValidateList
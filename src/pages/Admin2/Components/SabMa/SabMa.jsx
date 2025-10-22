import css from './SabMa.module.css'
import { useState, useEffect } from 'react'
import { Button, message } from 'antd'
import { getAllUserClass } from '../../../../apis/userClassService'
import UserClassElement from './Components/UserClassElement'
import CreateUserClass from './Components/CRUD/Create/CreateUserClass'
const SabMa = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [listUserClass, setListUserClass] = useState([])
  const [userClassSelected, setUserClassSelected] = useState(null)
  const [statusCreateUserClass, setStatusCreateUserClass] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [statusDeleteUserClass, setStatusDeleteUserClass] = useState(false);
  const [responseMessageDelete, setResponseMessageDelete] = useState("");
  const [showFormCreateUserClass, setShowFormCreateUserClass] = useState(false);

  const showNotification = (type, content) => {
    messageApi.open({
      type,
      content,
    });
  };


  const fetchAllUserClass = async () => {
    try {
      const data = await getAllUserClass()
      const filteredData = data.filter(item => item.module === 'SAB-MA')
      setListUserClass(filteredData)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchAllUserClass()
  }, [])

  useEffect(() => {
    if (statusCreateUserClass) {
      showNotification("success", responseMessage);
      setStatusCreateUserClass(false);
    }
  }, [statusCreateUserClass, responseMessage]);

  useEffect(() => {
    if (statusDeleteUserClass) {
      showNotification("success", responseMessageDelete);
      setStatusDeleteUserClass(false);
    }
  }, [statusDeleteUserClass, responseMessageDelete]);


  return (
    <>
      {contextHolder}
      <div className={css.main}>
        <div className={css.sidebar}>
          <div className={css.createUserClass}>
            <Button
              type="dashed"
              style={{ width: '100%' }}
              onClick={() => setShowFormCreateUserClass(true)}>
              + Tạo nhóm nhân viên và cấp quyền
            </Button>
          </div>
          <div className={css.listUserClass}>
            <div className={css.listUserClassWrap}>
              <div className={css.titleElement}>Danh sách</div>
              <div className={css.listElement}>

                {listUserClass.map((userClass) =>
                  <div
                    key={userClass.id}
                    className={`${css.userClass} ${userClass.id === userClassSelected?.id ? css.selected : ''}`}
                    onClick={() => setUserClassSelected(userClass)}
                  >
                    {userClass.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={css.content}>
          {userClassSelected
            ? (
              <UserClassElement
                userClassSelected={userClassSelected}
                setUserClassSelected={setUserClassSelected}
                fetchAllUserClass={fetchAllUserClass}
                setStatusDeleteUserClass={setStatusDeleteUserClass}
                setResponseMessageDelete={setResponseMessageDelete}
              />
            )
            : (
              <div
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
              >Chọn một nhóm nhân viên
              </div>)
          }
        </div>
      </div>

      {showFormCreateUserClass && (
        <CreateUserClass
          onClose={() => setShowFormCreateUserClass(false)}
          fetchAllUserClass={fetchAllUserClass}
          setStatusCreateUserClass={setStatusCreateUserClass}
          setResponseMessage={setResponseMessage}
        />
      )}
    </>
  )
}

export default SabMa
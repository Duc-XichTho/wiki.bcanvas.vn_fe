import { v4 as uuidv4 } from 'uuid';
import css from "./CreateUserClass.module.css";
import { useState, useEffect } from "react";
import { Input, Button, Spin, message } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import ChainElement from './ChainElement'
import TableTransferUser from "./TableTransferUser";
import { API_RESPONSE_CODE } from "../../../../../../CONST";
import { createUserClass } from "../../../../../../apis/userClassService";

const CreateUserClass = ({ onClose, fetchAllUserClass, setStatusCreateUserClass, setResponseMessage }) => {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [userClassName, setUserClassName] = useState("");
  const [targetKeys, setTargetKeys] = useState([]);
  const [checkedChainAndChild, setCheckedChainAndChild] = useState({
    chain: [],
    template: [],
    step: [],
    subStep: []
  });

  const [statusDisabled, setStatusDisabled] = useState(false);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const showNotification = (type, content) => {
    messageApi.open({
      type,
      content,
    });
  };

  const handleCreateUserClass = async () => {
    try {
      setLoading(true);

      const data = {
        id: uuidv4(),
        name: userClassName,
        userAccess: targetKeys,
        chainAccess: checkedChainAndChild.chain,
        templateAccess: checkedChainAndChild.template,
        stepAccess: checkedChainAndChild.step,
        subStepAccess: checkedChainAndChild.subStep
      }

      const response = await createUserClass(data);

      await delay(2000);

      switch (response.code) {
        case API_RESPONSE_CODE.CREATED:
          setStatusCreateUserClass(true);
          setResponseMessage(response.message);
          await fetchAllUserClass();
          onClose();
          break;
        case API_RESPONSE_CODE.NOT_CREATED:
          showNotification("warning", response.message);
          break;
        default:
          showNotification("error", "Có lỗi xảy ra");
          break;
      }

    } catch (error) {
      console.log("Error:", error);
      showNotification("error", "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setStatusDisabled(
      !userClassName ||
      targetKeys.length === 0
    );
  }, [userClassName, targetKeys]);

  return (
    <>
      {contextHolder}
      <div className={css.main}>
        <div className={css.container}>
          <div className={css.header}>Tạo User Class</div>
          <div className={css.info}>
            <div className={css.userclassname}>
              <Input
                style={{ width: "45%" }}
                size="large"
                placeholder="Nhập Tên"
                value={userClassName}
                onChange={(e) => setUserClassName(e.target.value)}
              />
            </div>
            <div className={css.tranfer}>
              <TableTransferUser
                targetKeys={targetKeys}
                setTargetKeys={setTargetKeys}
              />
            </div>
            <div className={css.chainElement}>
              <ChainElement
                checkedChainAndChild={checkedChainAndChild}
                setCheckedChainAndChild={setCheckedChainAndChild}
              />
            </div>
          </div>
          <div className={css.footer}>
            <Button onClick={onClose}>HỦY BỎ</Button>
            <Button
              disabled={statusDisabled}
              onClick={handleCreateUserClass}
            >
              {loading && <Spin indicator={<LoadingOutlined />} />}TẠO MỚI
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateUserClass;

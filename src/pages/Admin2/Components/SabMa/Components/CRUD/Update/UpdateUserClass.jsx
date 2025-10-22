import css from "./UpdateUserClass.module.css"
import { useState, useEffect } from "react";
import { Input, Button, Spin, message } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import TableTransferUser from "./TableTransferUser";
import { API_RESPONSE_CODE } from "../../../../../../../CONST";
import { updateUserClass } from "../../../../../../../apis/userClassService";

import './CheckboxGroup.css';
import { FcManager } from "react-icons/fc";
import { FcBusinessman } from "react-icons/fc";
const UpdateUserClass = ({
    onClose,
    setStatusUpdateUserClass,
    setResponseMessage,
    fetchAllUserClass,
    userClassSelected,
    setUserClassSelected
}) => {
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [userClassName, setUserClassName] = useState("");
    const [targetKeys, setTargetKeys] = useState([]);
    const [statusDisabled, setStatusDisabled] = useState(false);
    const [checkedIds, setCheckedIds] = useState([]);

    const checkboxOptions = [
        { id: 'manager', label: 'Manager', icon: <FcManager /> },
        { id: 'ceo', label: 'CEO', icon: <FcBusinessman /> },
    ];

    const handleCheckboxChange = (id) => {
        setCheckedIds((prevCheckedIds) =>
            prevCheckedIds.includes(id)
                ? prevCheckedIds.filter((checkedId) => checkedId !== id)
                : [...prevCheckedIds, id]
        );
    };

    useEffect(() => {
        if (userClassSelected) {
            setUserClassName(userClassSelected.name);
            setTargetKeys(userClassSelected.userAccess);
            setCheckedIds(userClassSelected.info);
        }
    }, [userClassSelected]);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const showNotification = (type, content) => {
        messageApi.open({
            type,
            content,
        });
    };

    const handleUpdateUserClass = async () => {
        try {
            setLoading(true);

            const data = {
                name: userClassName,
                userAccess: targetKeys,
                info: checkedIds
            };

            const response = await updateUserClass(userClassSelected.id, data);

            await delay(2000);

            switch (response.code) {
                case API_RESPONSE_CODE.UPDATED:
                    setStatusUpdateUserClass(true);
                    setResponseMessage(response.message);
                    const dataUpdate = {
                        ...data,
                        id: userClassSelected.id,
                    }
                    await fetchAllUserClass();
                    setUserClassSelected(dataUpdate)
                    onClose();
                    return;
                case API_RESPONSE_CODE.NOT_FOUND:
                    showNotification("warning", response.message);
                    return;
                default:
                    showNotification("error", "Có lỗi xảy ra");
                    return;
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

    const handleClose = () => {
        onClose();
    }

    return (
        <>
            {contextHolder}
            <div className={css.main}>
                <div className={css.container}>
                    <div className={css.header}>Cập nhật User Class</div>
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
                            <fieldset className="checkbox-group">
                                <legend className="checkbox-group-legend">Chọn quyền hạn</legend>
                                {checkboxOptions.map((checkbox) => (
                                    <div className="checkbox" key={checkbox.id}>
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                id={checkbox.id}
                                                checked={checkedIds.includes(checkbox.id)}
                                                onChange={() => handleCheckboxChange(checkbox.id)}
                                            />
                                            <span className="checkbox-tile">
                                                <span className="checkbox-icon">{checkbox.icon}</span>
                                                <span className="checkbox-label">{checkbox.label}</span>
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </fieldset>
                        </div>
                    </div>
                    <div className={css.footer}>
                        <Button onClick={handleClose}>HỦY BỎ</Button>
                        <Button
                            disabled={statusDisabled}
                            onClick={handleUpdateUserClass}
                        >
                            {loading && <Spin indicator={<LoadingOutlined />} />}CẬP NHẬT
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UpdateUserClass
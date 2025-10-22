import css from "./UpdateUserClass.module.css"
import { useState, useEffect } from "react";
import { Input, Button, Spin, message } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import ChainElement from './ChainElement'
import TableTransferUser from "./TableTransferUser";
import { API_RESPONSE_CODE } from "../../../../../../CONST";
import { updateUserClass, getUserClassById } from "../../../../../../apis/userClassService";

const UpdateUserClass = ({
    onClose,
    setStatusUpdateUserClass,
    setResponseMessage,
    fetchAllUserClass,
    userClassSelected,
    handleTabSelect
}) => {
    const [userClassSelectedAPI, setUserClassSelectedAPI] = useState(null);
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

    const fetchUserClassById = async () => {
        try {
            const response = await getUserClassById(userClassSelected.id);
            setUserClassSelectedAPI(response);
        } catch (error) {
            console.log("Error:", error);
        }
    }

    useEffect(() => {
        fetchUserClassById();
    }, []);

    useEffect(() => {
        if (userClassSelected) {
            setUserClassName(userClassSelected.name);
            setTargetKeys(userClassSelected.userAccess);
            setCheckedChainAndChild({
                chain: userClassSelected.chainAccess,
                template: userClassSelected.templateAccess,
                step: userClassSelected.stepAccess,
                subStep: userClassSelected.subStepAccess
            });
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
            const { chain: chainAccess, template: templateAccess, step: stepAccess, subStep: subStepAccess } = checkedChainAndChild;
            const data = {
                name: userClassName,
                userAccess: targetKeys,
                chainAccess,
                templateAccess,
                stepAccess,
                subStepAccess
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
                        info: userClassSelected.info
                    }
                    handleTabSelect("group", dataUpdate);
                    await fetchAllUserClass();
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
        handleTabSelect("group", userClassSelectedAPI);
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
                            <ChainElement
                                checkedChainAndChild={checkedChainAndChild}
                                setCheckedChainAndChild={setCheckedChainAndChild}
                            />
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
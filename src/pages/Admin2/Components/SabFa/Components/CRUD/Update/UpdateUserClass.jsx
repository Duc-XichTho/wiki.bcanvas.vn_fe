import css from "./UpdateUserClass.module.css"
import { useState, useEffect } from "react";
import { Input, Button, Spin, message } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import ChainElement from './ChainElement'
import TableTransferUser from "./TableTransferUser";
import { API_RESPONSE_CODE } from "../../../../../../../CONST";
import { updateUserClass, getUserClassById } from "../../../../../../../apis/userClassService";
import { getAllCompany } from '../../../../../../../apis/companyService.jsx';

const UpdateUserClass = ({
    onClose,
    setStatusUpdateUserClass,
    setResponseMessage,
    fetchAllUserClass,
    userClassSelected,
    setUserClassSelected
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
    const [checkedIds, setCheckedIds] = useState([]);
    const [listCompany, setListCompany] = useState([]);

    const fetchUserClassById = async () => {
        try {
            const response = await getUserClassById(userClassSelected.id);
            setUserClassSelectedAPI(response);
        } catch (error) {
            console.log("Error:", error);
        }
    }

    const fetchAllCompany = async () => {
        try {
            const response = await getAllCompany();
            setListCompany([...response, {id: 99999999, name: 'HQ', code: 'HQ'}]);
        } catch (error) {
            console.log("Error:", error);
        }
    }

    useEffect(() => {
        fetchUserClassById();
        fetchAllCompany();
    }, []);

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

    const handleCheckboxChange = (code) => {
        if (code === 'HQ') {
            // If HQ is selected, clear all other selections
            setCheckedIds(['HQ']);
        } else {
            // If selecting a non-HQ company
            setCheckedIds((prevCheckedIds) => {
                // Remove HQ if it exists
                const filteredIds = prevCheckedIds.filter(checkedCode => checkedCode !== 'HQ');
                
                // Toggle the selected company
                return filteredIds.includes(code)
                    ? filteredIds.filter(checkedCode => checkedCode !== code)
                    : [...filteredIds, code];
            });
        }
    };

    const handleUpdateUserClass = async () => {
        try {
            setLoading(true);
            const { chain: chainAccess, template: templateAccess, step: stepAccess, subStep: subStepAccess } = checkedChainAndChild;
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
            targetKeys.length === 0 ||
            checkedIds.length === 0
        );
    }, [userClassName, targetKeys, checkedIds]);

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
                                <legend className="checkbox-group-legend">Chọn dữ liệu công ty</legend>
                                {listCompany && listCompany.map((company) => (
                                    <div className="checkbox" key={company.code}>
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                id={company.code}
                                                name={'role'}
                                                checked={checkedIds.includes(company.code)}
                                                onChange={() => handleCheckboxChange(company.code)}
                                            />
                                            <span className="checkbox-tile">
                                                <span className="checkbox-label">{company.name}</span>
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
                            {loading && <Spin indicator={<LoadingOutlined/>}/>}CẬP NHẬT
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UpdateUserClass
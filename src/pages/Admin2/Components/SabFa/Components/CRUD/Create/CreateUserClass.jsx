import { v4 as uuidv4 } from 'uuid';
import css from './CreateUserClass.module.css';
import { useEffect, useState } from 'react';
import { Button, Input, message, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import TableTransferUser from './TableTransferUser';
import { API_RESPONSE_CODE } from '../../../../../../../CONST';
import { createUserClass } from '../../../../../../../apis/userClassService';
import { FcEditImage, FcViewDetails } from 'react-icons/fc';
import { getAllCompany } from '../../../../../../../apis/companyService.jsx';

const CreateUserClass = ({onClose, fetchAllUserClass, setStatusCreateUserClass, setResponseMessage}) => {
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [userClassName, setUserClassName] = useState("");
    const [targetKeys, setTargetKeys] = useState([]);
    const [checkedIds, setCheckedIds] = useState([]);
    const [listCompany, setListCompany] = useState([]);
    const [statusDisabled, setStatusDisabled] = useState(false);
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const showNotification = (type, content) => {
        messageApi.open({
            type,
            content,
        });
    };

    useEffect(()=> {
        getAllCompany().then((data)=> {
            setListCompany([...data, {id: 99999999, name: 'HQ', code: 'HQ'}])
        })
    }, [])

    const handleCreateUserClass = async () => {
        try {
            setLoading(true);

            const data = {
                id: uuidv4(),
                name: userClassName,
                userAccess: targetKeys,
                info: checkedIds,
                module: 'SAB-FA'
            };

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
            targetKeys.length === 0 ||
            checkedIds.length === 0  // Ensure a role is selected
        );
    }, [userClassName, targetKeys, checkedIds]);

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


    return (
        <>
            {contextHolder}
            <div className={css.main}>
                <div className={css.container}>
                    <div className={css.header}>Tạo User Class</div>
                    <div className={css.info}>
                        <div className={css.userclassname}>
                            <Input
                                style={{width: "45%"}}
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
                                    {listCompany.map((company) => (
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
                        <Button onClick={onClose}>HỦY BỎ</Button>
                        <Button
                            disabled={statusDisabled}
                            onClick={handleCreateUserClass}
                        >
                            {loading && <Spin indicator={<LoadingOutlined/>}/>}TẠO MỚI
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateUserClass;

import css from "./UpdateUserClass.module.css"
import { useState, useEffect } from "react";
import { Input, Button, Spin, message } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import ChainElement from './ChainElement'
import TableTransferUser from "./TableTransferUser";
import { API_RESPONSE_CODE } from "../../../../../../../CONST";
import { updateUserClass, getUserClassById } from "../../../../../../../apis/userClassService";
import { getSettingByType } from '../../../../../../../apis/settingService';
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
    const [selectedApps, setSelectedApps] = useState([]);
    const [appList, setAppList] = useState([]);
    const [statusDisabled, setStatusDisabled] = useState(false);
    const [listCompany, setListCompany] = useState([]);
    const [checkedCompanyIds, setCheckedCompanyIds] = useState([]);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const setting = await getSettingByType('DASHBOARD_SETTING');
                if (setting && setting.setting) {
                    const filteredApps = setting.setting.filter(app => app.id != "adminApp");
                    setAppList(filteredApps);                }
            } catch (error) {
                setAppList([]);
            }
        };
        fetchApps();
    }, []);

    useEffect(() => {
        if (userClassSelected) {
            setUserClassName(userClassSelected.name);
            setTargetKeys(userClassSelected.userAccess);
            setSelectedApps(userClassSelected.stepAccess || []);
        }
    }, [userClassSelected]);

    useEffect(() => {
        // Lấy danh sách công ty
        const fetchCompanies = async () => {
            try {
                const response = await getAllCompany();
                setListCompany([...response, { id: 99999999, name: 'HQ', code: 'HQ' }]);
            } catch (error) {
                setListCompany([]);
            }
        };
        fetchCompanies();
    }, []);

    useEffect(() => {
        // Nếu userClassSelected có info thì set checkedCompanyIds
        if (userClassSelected?.info) setCheckedCompanyIds(userClassSelected.info);
        // Nếu bỏ chọn app fdr thì clear checkedCompanyIds
        if (!selectedApps.includes('fdr')) setCheckedCompanyIds([]);
    }, [userClassSelected, selectedApps]);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const showNotification = (type, content) => {
        messageApi.open({
            type,
            content,
        });
    };

    const handleCheckboxChange = (code) => {
        if (code === 'HQ') {
            setCheckedCompanyIds(['HQ']);
        } else {
            setCheckedCompanyIds((prev) => {
                const filtered = prev.filter((c) => c !== 'HQ');
                return filtered.includes(code)
                    ? filtered.filter((c) => c !== code)
                    : [...filtered, code];
            });
        }
    };

    const handleUpdateUserClass = async () => {
        try {
            setLoading(true);
            const data = {
                name: userClassName,
                userAccess: targetKeys,
                stepAccess: selectedApps,
                module: 'DASHBOARD',
                info: selectedApps.includes('fdr') ? checkedCompanyIds : undefined,
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
    }, [userClassName, targetKeys, selectedApps]);

    const handleAppCheckbox = (id) => {
        setSelectedApps((prev) =>
            prev.includes(id) ? prev.filter((appId) => appId !== id) : [...prev, id]
        );
    };

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
                        <div className={css.appListSection}>
                            <div style={{ fontWeight: 500, marginBottom: 8 }}>Danh sách ứng dụng</div>
                            {appList.length === 0 ? (
                                <div>Không có ứng dụng nào</div>
                            ) : (
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
                                    {appList.map(app => (
                                        <label key={app.id} style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 6, padding: '6px 14px', fontWeight: 500, marginBottom: 4 }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedApps.includes(app.id)}
                                                onChange={() => handleAppCheckbox(app.id)}
                                                style={{marginRight: 8}}
                                            />
                                            <span className="checkbox-label">{app.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* PHẦN CÀI ĐẶT TRUY CẬP CÔNG TY */}
                        {selectedApps.includes('fdr') && (
                            <div className={css.chainElement} style={{marginTop: 24}}>
                                <fieldset className="checkbox-group">
                                    <legend className="checkbox-group-legend">Cài đặt truy cập công ty (FDR)</legend>
                                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
                                        {listCompany && listCompany.map((company) => (
                                            <label key={company.code} className="checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 6, padding: '6px 14px', fontWeight: 500, marginBottom: 4 }}>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox-input"
                                                    id={company.code}
                                                    name={'role'}
                                                    checked={checkedCompanyIds.includes(company.code)}
                                                    onChange={() => handleCheckboxChange(company.code)}
                                                    style={{marginRight: 8}}
                                                />
                                                <span className="checkbox-label">{company.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                            </div>
                        )}
                    </div>
                    <div className={css.footer}>
                        <Button onClick={handleClose}>HỦY BỎ</Button>
                        <Button
                            disabled={statusDisabled}
                            onClick={handleUpdateUserClass}
                            type="primary"
                        >
                            {loading && <Spin indicator={<LoadingOutlined style={{ marginRight: '8px' }} />} />}
                            CẬP NHẬT
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UpdateUserClass
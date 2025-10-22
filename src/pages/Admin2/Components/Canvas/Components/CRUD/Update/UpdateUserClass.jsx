import css from "./UpdateUserClass.module.css"
import {useEffect, useState} from "react";
import {Button, Input, List, message, Popover, Skeleton, Spin} from "antd";
import {BarChartOutlined, DatabaseOutlined, LoadingOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import TableTransferUser from "./TableTransferUser";
import {API_RESPONSE_CODE, CANVAS_DATA_PACK} from "../../../../../../../CONST";
import {updateUserClass} from "../../../../../../../apis/userClassService";
import {FcDepartment} from "react-icons/fc";
import {getAllSettingGroup} from "../../../../../../../apisKTQT/settingGroupService";
import {BsCheckAll} from "react-icons/bs";
import './CheckboxGroup.css';
import {getAllCompany} from "../../../../../../../apis/companyService.jsx";

const UpdateUserClass = ({
                             onClose,
                             setStatusUpdateUserClass,
                             setResponseMessage,
                             fetchAllUserClass,
                             userClassSelected,
                             setUserClassSelected
                         }) => {
    const listReportChart = CANVAS_DATA_PACK.filter((item) => item.isPermission === true && item.group === false);
    const [dataKenh, setDataKenh] = useState([]);
    const [dataUnit, setDataUnit] = useState([]);
    const [dataKHUnit, setDataKHUnit] = useState([]);
    const [dataProduct, setDataProduct] = useState([]);
    const [dataProject, setDataProject] = useState([]);

    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [userClassName, setUserClassName] = useState("");
    const [targetKeys, setTargetKeys] = useState([]);
    const [statusDisabled, setStatusDisabled] = useState(false);
    const [checkedIds, setCheckedIds] = useState([]);

    const [checkedCompany, setCheckedCompany] = useState(null);
    const [selectedReportCharts, setSelectedReportCharts] = useState([]);
    const [selectedKenh, setSelectedKenh] = useState([]);
    const [selectedCty, setSelectedCty] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState([]);
    const [selectedKHUnit, setSelectedKHUnit] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [selectedProject, setSelectedProject] = useState([]);
    const [listCompany, setListCompany] = useState([]);
    const [showSkeleton, setShowSkeleton] = useState(false);
    const [companyOptions, setCompanyOptions] = useState([{
        id: 'all',
        label: 'Hợp nhất',
        name: 'Hợp nhất',
        code: 'HQ',
        icon: <FcDepartment/>
    }])

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const fetchAllSettingGroup = async () => {
        try {
            setShowSkeleton(true);
            const data = await getAllSettingGroup();
            await delay(2000);
            const valueFilter = ['kmf', 'kh_kmf', 'kmns'];

            const filteredData = Array.isArray(data)
                ? data.filter((e) =>
                    !valueFilter.some((keyword) => e.type.includes(keyword))
                )
                : [];

            const result = {
                cty: filteredData.filter((e) => e.type === 'cty'),
                kenh: filteredData.filter((e) => e.type === 'kenh'),
                unit: filteredData.filter((e) => e.type === 'unit'),
                kh_unit: filteredData.filter((e) => e.type === 'kh_unit'),
                product: filteredData.filter((e) => e.type === 'product'),
                project: filteredData.filter((e) => e.type === 'project'),
            };

            // setDataCty(result.cty);
            setDataKenh(result.kenh);
            setDataUnit(result.unit);
            setDataKHUnit(result.kh_unit);
            setDataProduct(result.product);
            setDataProject(result.project);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin:', error);
        } finally {
            setShowSkeleton(false);
        }
    };

    async function fetchCompany() {
        let listCompany = await getAllCompany();
        setListCompany([...listCompany, {id: 99999999, name: 'HQ', code: 'HQ'}]);
    }

    useEffect(() => {
        fetchAllSettingGroup();
        fetchCompany();
    }, []);

    useEffect(() => {
        if (userClassSelected) {
            setUserClassName(userClassSelected.name);
            setTargetKeys(userClassSelected.userAccess);
            setCheckedCompany(userClassSelected.company);
            setSelectedReportCharts(userClassSelected.reportChart)
            setSelectedCty(userClassSelected.reportChartGroup.cty)
            setSelectedKenh(userClassSelected.reportChartGroup.kenh)
            setSelectedUnit(userClassSelected.reportChartGroup.unit)
            setSelectedKHUnit(userClassSelected.reportChartGroup.kh_unit)
            setSelectedProduct(userClassSelected.reportChartGroup.product)
            setSelectedProject(userClassSelected.reportChartGroup.project)
        }
    }, [userClassSelected]);

    const handleCheckboxChange = (code) => {
        if (code === 'HQ') {
            // Nếu chọn HQ, chỉ chọn HQ và bỏ hết các lựa chọn khác
            setCheckedIds(['HQ']);
        } else {
            setCheckedIds((prevCheckedIdsRaw) => {
                const prevCheckedIds = prevCheckedIdsRaw || [];
                // Nếu đang chọn HQ, bỏ HQ và chỉ chọn lựa chọn vừa chọn
                if (prevCheckedIds.includes('HQ')) {
                    return [code];
                }
                // Nếu đã chọn rồi thì bỏ chọn, chưa chọn thì thêm vào
                if (prevCheckedIds.includes(code)) {
                    return prevCheckedIds.filter(id => id !== code);
                } else {
                    return [...prevCheckedIds, code];
                }
            });
        }
    };

    useEffect(() => {
        if (userClassSelected) {
            setUserClassName(userClassSelected.name);
            setTargetKeys(userClassSelected.userAccess);
            setCheckedIds(userClassSelected.info);
        }
    }, [userClassSelected]);

    const handleReportChartChange = (value) => {
        setSelectedReportCharts((prevSelected) =>
            prevSelected.includes(value)
                ? prevSelected.filter((item) => item !== value)
                : [...prevSelected, value]
        );
    };

    const handleCheckAll = () => {
        const allIds = listReportChart.map((item) => item.value);
        setSelectedReportCharts(allIds);
    };

    const handleCtyChange = (id) => {
        setSelectedCty((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((item) => item !== id)
                : [...prevSelected, id]
        );
    };

    const handleCheckAllCty = () => {
        const allIds = companyOptions.map((item) => item.id);
        setSelectedCty(allIds);
    };


    const handleKenhChange = (id) => {
        setSelectedKenh((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((item) => item !== id)
                : [...prevSelected, id]
        );
    };

    const handleCheckAllKenh = () => {
        const allIds = dataKenh.map((item) => item.id);
        setSelectedKenh(allIds);
    };

    const handleUnitChange = (id) => {
        setSelectedUnit((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((item) => item !== id)
                : [...prevSelected, id]
        );
    };

    const handleCheckAllUnit = () => {
        const allIds = dataUnit.map((item) => item.id);
        setSelectedUnit(allIds);
    };

    const handleKHUnitChange = (id) => {
        setSelectedKHUnit((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((item) => item !== id)
                : [...prevSelected, id]
        );
    };

    const handleCheckAllKHUnit = () => {
        const allIds = dataKHUnit.map((item) => item.id);
        setSelectedKHUnit(allIds);
    };

    const handleProductChange = (id) => {
        setSelectedProduct((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((item) => item !== id)
                : [...prevSelected, id]
        );
    };

    const handleCheckAllProduct = () => {
        const allIds = dataProduct.map((item) => item.id);
        setSelectedProduct(allIds);
    };

    const handleProjectChange = (id) => {
        setSelectedProject((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((item) => item !== id)
                : [...prevSelected, id]
        );
    };

    const handleCheckAllProject = () => {
        const allIds = dataProject.map((item) => item.id);
        setSelectedProject(allIds);
    };

    const handleCompanyChange = (id) => {
        setCheckedCompany(id);
    };

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
                company: checkedCompany,
                reportChart: selectedReportCharts,
                reportChartGroup: {
                    cty: selectedCty,
                    kenh: selectedKenh,
                    unit: selectedUnit,
                    kh_unit: selectedKHUnit,
                    product: selectedProduct,
                    project: selectedProject
                },
                info: checkedIds,
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

    const options = ["Báo cáo nhóm", "Báo cáo nhóm theo tháng", "Báo cáo doanh thu", "Báo cáo đóng góp doanh thu theo"];
    const optionsKHDV = ["Báo cáo KQKD so với kế hoạch", "Báo cáo Doanh thu thực hiện, vs kế hoạch, vs cùng kỳ",];

    const formatReportName = (report, title) => {
        if (report.startsWith("Báo cáo nhóm")) {
            return report.replace("Báo cáo nhóm", `Báo cáo nhóm ${title}`);
        }
        return `${report} ${title}`;
    };

    const PopoverList = ({title}) => {
        const content = (
            <List
                size="small"
                dataSource={title == "Kế hoạch đơn vị" ? optionsKHDV : options.map((item) => formatReportName(item, title))}
                renderItem={(item) => <List.Item>{item}</List.Item>}
                style={{width: 230}}
            />
        );

        return (
            <Popover
                content={content}
                title={<div style={{textAlign: "center"}}>{`Báo cáo liên quan ${title}`}</div>}
                trigger="hover"
            >
                <QuestionCircleOutlined style={{fontSize: "16px", color: "#1890ff", marginLeft: 5}}/>
            </Popover>

        );
    };

    return (
        <>
            {contextHolder}
            <div className={css.main}>
                <div className={css.container}>
                    <div className={css.header}>Cập nhật User Class</div>
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
                                {listCompany && listCompany.map((company) => (
                                    <div className="checkbox" key={company.code}>
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                id={company.code}
                                                name={'role'}
                                                checked={(checkedIds || []).includes(company.code)}
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
                        {/*<div className={css.companySelect}>*/}
                        {/*    <fieldset className="checkbox-group3">*/}
                        {/*        <legend className="checkbox-group-legend3">Công ty</legend>*/}
                        {/*        {showSkeleton*/}
                        {/*            ? (*/}
                        {/*                <div style={{*/}
                        {/*                    display: "flex",*/}
                        {/*                    alignItems: "center",*/}
                        {/*                    gap: "10px",*/}
                        {/*                    flexDirection: "column"*/}
                        {/*                }}>*/}
                        {/*                    {Array.from({length: 2}).map((_, index) => (*/}
                        {/*                        <Skeleton.Button key={index} size="small" block active shape="round"/>*/}
                        {/*                    ))}*/}
                        {/*                    <div style={{*/}
                        {/*                        width: "100%",*/}
                        {/*                        display: "flex",*/}
                        {/*                        justifyContent: "spaceBetween",*/}
                        {/*                        gap: "10px"*/}
                        {/*                    }}>*/}
                        {/*                        <div style={{flex: 1}}>*/}
                        {/*                            <Skeleton.Button size="small" block active shape="round"/>*/}
                        {/*                        </div>*/}
                        {/*                        <div style={{*/}
                        {/*                            width: "maxContent",*/}
                        {/*                            display: "flex",*/}
                        {/*                            alignItems: "center"*/}
                        {/*                        }}>*/}
                        {/*                            <span>Đang lấy dữ liệu...</span>*/}
                        {/*                        </div>*/}
                        {/*                        <div style={{flex: 1}}>*/}
                        {/*                            <Skeleton.Button size="small" block active shape="round"/>*/}
                        {/*                        </div>*/}
                        {/*                    </div>*/}
                        {/*                    {Array.from({length: 2}).map((_, index) => (*/}
                        {/*                        <Skeleton.Button key={index} size="small" block active shape="round"/>*/}
                        {/*                    ))}*/}
                        {/*                </div>*/}
                        {/*            )*/}
                        {/*            : (*/}
                        {/*                companyOptions.map((radio) => (*/}
                        {/*                    <div className="checkbox3" key={radio.id}>*/}
                        {/*                        <label className="checkbox-wrapper3">*/}
                        {/*                            <input*/}
                        {/*                                type="radio"*/}
                        {/*                                className="checkbox-input3"*/}
                        {/*                                id={radio.id}*/}
                        {/*                                checked={checkedCompany === radio.id}*/}
                        {/*                                onChange={() => handleCompanyChange(radio.id)}*/}
                        {/*                            />*/}
                        {/*                            <span className="checkbox-tile3">*/}
                        {/*    <span className="checkbox-icon3">{radio.icon}</span>*/}
                        {/*    <span className="checkbox-label3">{radio.label}</span>*/}
                        {/*  </span>*/}
                        {/*                        </label>*/}
                        {/*                    </div>*/}
                        {/*                ))*/}
                        {/*            )*/}
                        {/*        }*/}
                        {/*    </fieldset>*/}
                        {/*</div>*/}

                        {/*<div className={css.reportChart}>*/}
                        {/*    <div className={css.reportChartTitle}>*/}
                        {/*        <div>Báo Cáo - Chart</div>*/}
                        {/*        <Button icon={<BsCheckAll/>} onClick={handleCheckAll}>Toàn bộ</Button>*/}
                        {/*    </div>*/}
                        {/*    {showSkeleton*/}
                        {/*        ? (*/}
                        {/*            <div style={{*/}
                        {/*                display: "flex",*/}
                        {/*                alignItems: "center",*/}
                        {/*                gap: "10px",*/}
                        {/*                flexDirection: "column"*/}
                        {/*            }}>*/}
                        {/*                {Array.from({length: 5}).map((_, index) => (*/}
                        {/*                    <Skeleton.Button key={index} size="small" block active shape="round"/>*/}
                        {/*                ))}*/}
                        {/*                <div style={{*/}
                        {/*                    width: "100%",*/}
                        {/*                    display: "flex",*/}
                        {/*                    justifyContent: "spaceBetween",*/}
                        {/*                    gap: "10px"*/}
                        {/*                }}>*/}
                        {/*                    <div style={{flex: 1}}>*/}
                        {/*                        <Skeleton.Button size="small" block active shape="round"/>*/}
                        {/*                    </div>*/}
                        {/*                    <div style={{width: "maxContent", display: "flex", alignItems: "center"}}>*/}
                        {/*                        <span>Đang lấy dữ liệu...</span>*/}
                        {/*                    </div>*/}
                        {/*                    <div style={{flex: 1}}>*/}
                        {/*                        <Skeleton.Button size="small" block active shape="round"/>*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}
                        {/*                {Array.from({length: 5}).map((_, index) => (*/}
                        {/*                    <Skeleton.Button key={index} size="small" block active shape="round"/>*/}
                        {/*                ))}*/}
                        {/*            </div>*/}
                        {/*        )*/}
                        {/*        : (*/}
                        {/*            <div className={css.reportChartSelect}>*/}
                        {/*                <div className={css.reportChartSelectWrap}>*/}
                        {/*                    {[...listReportChart]*/}
                        {/*                        .sort((a, b) => (b.isChart ? 1 : 0) - (a.isChart ? 1 : 0))*/}
                        {/*                        .map((item) => (*/}
                        {/*                            <article key={item.value} title={item.name}>*/}
                        {/*                                <input*/}
                        {/*                                    type="checkbox"*/}
                        {/*                                    id={item.value}*/}
                        {/*                                    value={item.value}*/}
                        {/*                                    checked={selectedReportCharts.includes(item.value)}*/}
                        {/*                                    onChange={() => handleReportChartChange(item.value)}*/}
                        {/*                                />*/}
                        {/*                                <div>*/}
                        {/*                                    {item.isChart ? (*/}
                        {/*                                        <span className={css.nameData}>*/}
                        {/*                                            <BarChartOutlined*/}
                        {/*                                                style={{fontSize: "16px", marginLeft: 5}}/>*/}
                        {/*                                            <p>{item.name}</p>*/}
                        {/*                                        </span>*/}
                        {/*                                    ) : (*/}
                        {/*                                        <span className={css.nameData}>*/}
                        {/*                                            <DatabaseOutlined style={{fontSize: "16px"}}/>*/}
                        {/*                                            <p>{item.name}</p>*/}
                        {/*                                        </span>*/}
                        {/*                                    )}*/}
                        {/*                                </div>*/}
                        {/*                            </article>*/}
                        {/*                        ))}*/}

                        {/*                </div>*/}
                        {/*            </div>*/}
                        {/*        )*/}
                        {/*    }*/}
                        {/*</div>*/}

                        {/*<div className={css.reportChartGroup}>*/}
                        {/*    <div className={css.reportChartGroupTitle}>*/}
                        {/*    Phân quyền dữ liệu báo cáo*/}
                        {/*    </div>*/}

                        {/*    {showSkeleton*/}
                        {/*        ? (*/}
                        {/*            <div style={{*/}
                        {/*                display: "flex",*/}
                        {/*                alignItems: "center",*/}
                        {/*                gap: "10px",*/}
                        {/*                flexDirection: "column"*/}
                        {/*            }}>*/}
                        {/*                {Array.from({length: 5}).map((_, index) => (*/}
                        {/*                    <Skeleton.Button key={index} size="small" block active shape="round"/>*/}
                        {/*                ))}*/}
                        {/*                <div style={{*/}
                        {/*                    width: "100%",*/}
                        {/*                    display: "flex",*/}
                        {/*                    justifyContent: "spaceBetween",*/}
                        {/*                    gap: "10px"*/}
                        {/*                }}>*/}
                        {/*                    <div style={{flex: 1}}>*/}
                        {/*                        <Skeleton.Button size="small" block active shape="round"/>*/}
                        {/*                    </div>*/}
                        {/*                    <div style={{width: "maxContent", display: "flex", alignItems: "center"}}>*/}
                        {/*                        <span>Đang lấy dữ liệu...</span>*/}
                        {/*                    </div>*/}
                        {/*                    <div style={{flex: 1}}>*/}
                        {/*                        <Skeleton.Button size="small" block active shape="round"/>*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}
                        {/*                {Array.from({length: 5}).map((_, index) => (*/}
                        {/*                    <Skeleton.Button key={index} size="small" block active shape="round"/>*/}
                        {/*                ))}*/}
                        {/*            </div>*/}
                        {/*        )*/}
                        {/*        : (*/}
                        {/*            <div className={css.reportChartGroupSelect}>*/}
                        {/*                <div className={css.reportChartGroupSub}>*/}
                        {/*                    <div className={css.reportChartGroupSubCheckAll}>*/}
                        {/*                        <Button icon={<BsCheckAll/>} onClick={handleCheckAllCty}>Công*/}
                        {/*                            ty</Button>*/}
                        {/*                    </div>*/}
                        {/*                    <div className={css.reportChartGroupSubWrap}>*/}
                        {/*                        {companyOptions.map((item) => (*/}
                        {/*                            <article title={item.name}>*/}
                        {/*                                <input*/}
                        {/*                                    type="checkbox"*/}
                        {/*                                    id={item.id}*/}
                        {/*                                    value={item.id}*/}
                        {/*                                    checked={selectedCty?.includes(item?.id)}*/}
                        {/*                                    onChange={() => handleCtyChange(item.id)}*/}
                        {/*                                />*/}
                        {/*                                <div>*/}
                        {/*      <span className={css.nameData}>*/}
                        {/*        {item.name}*/}
                        {/*      </span>*/}
                        {/*                                </div>*/}
                        {/*                            </article>*/}
                        {/*                        ))}*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}
                        {/*                <div className={css.reportChartGroupSub}>*/}
                        {/*                    <div className={css.reportChartGroupSubCheckAll}>*/}
                        {/*                        <Button icon={<BsCheckAll/>} onClick={handleCheckAllKenh}>*/}
                        {/*                            Kênh*/}
                        {/*                            <PopoverList title="Kênh"/>*/}
                        {/*                        </Button>*/}
                        {/*                    </div>*/}
                        {/*                    <div className={css.reportChartGroupSubWrap}>*/}
                        {/*                        {dataKenh.map((item) => (*/}
                        {/*                            <article title={item.name}>*/}
                        {/*                                <input*/}
                        {/*                                    type="checkbox"*/}
                        {/*                                    id={item.id}*/}
                        {/*                                    value={item.id}*/}
                        {/*                                    checked={selectedKenh.includes(item.id)}*/}
                        {/*                                    onChange={() => handleKenhChange(item.id)}*/}
                        {/*                                />*/}
                        {/*                                <div>*/}
                        {/*      <span className={css.nameData}>*/}
                        {/*        {item.name}*/}
                        {/*      </span>*/}
                        {/*                                </div>*/}
                        {/*                            </article>*/}
                        {/*                        ))}*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}

                        {/*                <div className={css.reportChartGroupSub}>*/}
                        {/*                    <div className={css.reportChartGroupSubCheckAll}>*/}
                        {/*                        <Button icon={<BsCheckAll/>} onClick={handleCheckAllUnit}>*/}
                        {/*                            Đơn vị*/}
                        {/*                            <PopoverList title="Đơn vị"/>*/}
                        {/*                        </Button>*/}
                        {/*                    </div>*/}
                        {/*                    <div className={css.reportChartGroupSubWrap}>*/}
                        {/*                        {dataUnit.map((item) => (*/}
                        {/*                            <article title={item.name}>*/}
                        {/*                                <input*/}
                        {/*                                    type="checkbox"*/}
                        {/*                                    id={item.id}*/}
                        {/*                                    value={item.id}*/}
                        {/*                                    checked={selectedUnit.includes(item.id)}*/}
                        {/*                                    onChange={() => handleUnitChange(item.id)}*/}
                        {/*                                />*/}
                        {/*                                <div>*/}
                        {/*      <span className={css.nameData}>*/}
                        {/*        {item.name}*/}
                        {/*      </span>*/}
                        {/*                                </div>*/}
                        {/*                            </article>*/}
                        {/*                        ))}*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}

                        {/*                <div className={css.reportChartGroupSub}>*/}
                        {/*                    <div className={css.reportChartGroupSubCheckAll}>*/}
                        {/*                        <Button icon={<BsCheckAll/>} onClick={handleCheckAllKHUnit}>*/}
                        {/*                            Kế hoạch đơn vị*/}
                        {/*                            <PopoverList title="Kế hoạch đơn vị"/>*/}
                        {/*                        </Button>*/}
                        {/*                    </div>*/}
                        {/*                    <div className={css.reportChartGroupSubWrap}>*/}
                        {/*                        {dataKHUnit.map((item) => (*/}
                        {/*                            <article title={item.name}>*/}
                        {/*                                <input*/}
                        {/*                                    type="checkbox"*/}
                        {/*                                    id={item.id}*/}
                        {/*                                    value={item.id}*/}
                        {/*                                    checked={selectedKHUnit.includes(item.id)}*/}
                        {/*                                    onChange={() => handleKHUnitChange(item.id)}*/}
                        {/*                                />*/}
                        {/*                                <div>*/}
                        {/*      <span className={css.nameData}>*/}
                        {/*        {item.name}*/}
                        {/*      </span>*/}
                        {/*                                </div>*/}
                        {/*                            </article>*/}
                        {/*                        ))}*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}

                        {/*                <div className={css.reportChartGroupSub}>*/}
                        {/*                    <div className={css.reportChartGroupSubCheckAll}>*/}
                        {/*                        <Button icon={<BsCheckAll/>} onClick={handleCheckAllProduct}>*/}
                        {/*                            Sản phẩm*/}
                        {/*                            <PopoverList title="Sản phẩm"/>*/}
                        {/*                        </Button>*/}
                        {/*                    </div>*/}
                        {/*                    <div className={css.reportChartGroupSubWrap}>*/}
                        {/*                        {dataProduct.map((item) => (*/}
                        {/*                            <article title={item.name}>*/}
                        {/*                                <input*/}
                        {/*                                    type="checkbox"*/}
                        {/*                                    id={item.id}*/}
                        {/*                                    value={item.id}*/}
                        {/*                                    checked={selectedProduct.includes(item.id)}*/}
                        {/*                                    onChange={() => handleProductChange(item.id)}*/}
                        {/*                                />*/}
                        {/*                                <div>*/}
                        {/*      <span className={css.nameData}>*/}
                        {/*        {item.name}*/}
                        {/*      </span>*/}
                        {/*                                </div>*/}
                        {/*                            </article>*/}
                        {/*                        ))}*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}

                        {/*                <div className={css.reportChartGroupSub}>*/}
                        {/*                    <div className={css.reportChartGroupSubCheckAll}>*/}
                        {/*                        <Button icon={<BsCheckAll/>} onClick={handleCheckAllProject}>*/}
                        {/*                            Vụ việc*/}
                        {/*                            <PopoverList title="Vụ việc"/>*/}
                        {/*                        </Button>*/}
                        {/*                    </div>*/}
                        {/*                    <div className={css.reportChartGroupSubWrap}>*/}
                        {/*                        {dataProject.map((item) => (*/}
                        {/*                            <article title={item.name}>*/}
                        {/*                                <input*/}
                        {/*                                    type="checkbox"*/}
                        {/*                                    id={item.id}*/}
                        {/*                                    value={item.id}*/}
                        {/*                                    checked={selectedProject.includes(item.id)}*/}
                        {/*                                    onChange={() => handleProjectChange(item.id)}*/}
                        {/*                                />*/}
                        {/*                                <div>*/}
                        {/*      <span className={css.nameData}>*/}
                        {/*        {item.name}*/}
                        {/*      </span>*/}
                        {/*                                </div>*/}
                        {/*                            </article>*/}
                        {/*                        ))}*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}

                        {/*            </div>*/}
                        {/*        )*/}
                        {/*    }*/}
                        {/*</div>*/}
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

import React, {useContext, useEffect, useState} from 'react';
import {Button, Col, Row, Typography} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import css from './NhapLieuThucThi.module.css';
import {MyContext} from "../../../../../MyContext.jsx";
import {getAllPMVPlan} from "../../../../../apis/pmvPlanService.jsx";
import {getAllTablesPlan} from "../../../../../apis/templateSettingService.jsx";
import TemplateTable from "./TemplateTable/TemplateTable.jsx";

const {Text, Title} = Typography;

const NhapLieuThucThi = () => {
    const [tables, setTables] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const {currentUser} = useContext(MyContext);

    const fetchDataPlan = async () => {
        const listTable = await getAllTablesPlan()
        setTables(listTable);
        if (listTable.length > 0) {
            setSelectedCard(listTable[0]);
        }
    };

    useEffect(() => {
        fetchDataPlan();
    }, []);

    const handleClick = (data) => {
        setSelectedCard(data);
    };

    return (
        <Row style={{height: '100%', width: 'calc(100% - 5px)'}}>
            {/* Left Sidebar */}
            <Col span={5} className={css.sidebarLeft}>
                <div className={css.sidebar}>
                    <div className={css.headerButton}>
                        <Button
                            icon={<PlusOutlined/>}
                            type="dashed"
                            className={css.addButton}
                        />
                    </div>
                    <div className={css.listItem}>
                        {tables.map(value => (
                            <div
                                key={value.id}
                                className={`${css.card} ${selectedCard?.id === value.id ? css.activeCard : ''}`}
                                onClick={() => handleClick(value)}
                            >
                                <h4 className={css.titleCard}>{value?.plan?.name} - {value?.deployment?.userClass}</h4>
                                <div>
                                    {/*<p style={{*/}
                                    {/*    whiteSpace: 'nowrap',*/}
                                    {/*    overflow: 'hidden',*/}
                                    {/*    textOverflow: 'ellipsis'*/}
                                    {/*}}>{value?.plan?.duyet && value?.plan?.duyet == 'Đã duyệt' ? value?.plan?.duyet : 'Nháp'}</p>*/}
                                    <div className={css.dateRange}>
                                        <span>Từ {value?.plan?.date_from}</span>
                                        <span>Đến {value?.plan?.date_to}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Col>

            {/* Main Content */}
            {selectedCard && (
                <Col span={19} className={css.mid}>
                    <div className={css.headerContent}>
                  <TemplateTable selectedCard={selectedCard}/>
                    </div>
                </Col>
            )}
        </Row>
    );
};

export default NhapLieuThucThi;
import {Outlet, useNavigate, useParams} from "react-router-dom";
import ListCardWorkFlow from "../../Card/ListCard/ListCardWorkFlow.jsx";
import css from "./ChainDetail.module.css";
import {
    CollapseCardIcon,
    CreateCardIcon,
    DateIcon,
    EllipsisIcon,
    SearchIcon, SettingCardTemplateIcon,
    UnCollapseCardIcon
} from "../../../../icon/IconSVG.js";
import {STATUS_LIST_CARD} from "../../../../CONST.js";
import React, {useContext, useEffect, useRef, useState} from "react";
import {getChainDataById} from "../../../../apis/chainService.jsx";
import {Input, message, Modal, Popover} from 'antd';
import {createNewCard, updateCard} from "../../../../apis/cardService.jsx";
import {getAllStep} from "../../../../apis/stepService.jsx";
import {getAllSubStep} from "../../../../apis/subStepService.jsx";
import {NOT_DONE_YET} from "../../../../Consts/STEP_STATUS.js";
import {IconButton} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import {createTimestamp} from "../../../../generalFunction/format.js";
import {MyContext} from "../../../../MyContext.jsx";
import ActionBookMarkChain from "../../AgridTable/actionButton/ActionBookMarkChain.jsx";
import {findRecordsByConditions} from "../../../../apis/searchModelService.jsx";
import {CARD, TEMPLATE} from "../../../../Consts/MODEL_CALL_API.js";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";

export default function ChainDetailWorkFlow() {
    const navigate = useNavigate();
    const {id} = useParams();
    const [searchText, setSearchText] = useState("");
    const [status, setStatus] = useState("");
    const [time, setTime] = useState("");
    const [sortType, setSortType] = useState("");
    const [chain, setChain] = useState({});
    const [listCard, setListCard] = useState([]);
    const [listTemplate, setListTemplate] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);  // State for modal visibility
    const [newCardName, setNewCardName] = useState("");  // State for new card name
    // const [isCollapsed, setIsCollapsed] = useState(false);
    const [countChoDuyet, setCountChoDuyet] = useState(null);
    const [countChoXuLy, setCountChoXuLy] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [sortCriteria, setSortCriteria] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [isShow, setIsShow] = useState(false);
    const dropdownRef = useRef(null);
    const {
        selectedCompany,
        currentYear,
        isCollapsedCard,
        setIsCollapseCard,
        currentMonth,
        currentDay,
        loadData,
        selectedTemplate,
        setSelectedTemplate,
        selectedTemplateName,
        setSelectedTemplateName
    } = useContext(MyContext);


    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    useEffect(() => {
        loadDataComponent();
    }, [id, loadData]);

    useEffect(() => {
        fetchCardData(id);
    }, [selectedTemplate, currentYear, selectedCompany]);

    useEffect(() => {
        setSearchText("");
        setStatus("");
        setTime("");
        setSortCriteria(null);
        setSortOrder("asc")
    }, [id]);

    async function fetchCardData(id) {
        try {
            const conditions = {chain_id: id, company: selectedCompany};
            if (currentYear !== 'toan-bo') {
                conditions.year = `${currentYear}`;
            }
            const data = await findRecordsByConditions(CARD, conditions);
            const filteredData = data.filter(card => card.template_id == selectedTemplate)
            const sortedCardData = filteredData.sort((a, b) => b.id - a.id);
            setListCard(sortedCardData);
            const countChoDuyet = data.filter(item => item.trang_thai === "Chờ duyệt").length;
            const countChoXuLy = data.filter(item => item.trang_thai === "Chờ xử lý").length;

            setCountChoDuyet(countChoDuyet);
            setCountChoXuLy(countChoXuLy);
        } catch (error) {
            console.error("Lỗi khi xử lý dữ liệu card:", error);
        }
    }


    function loadDataComponent() {
        Promise.all([
            getChainDataById(id),
            findRecordsByConditions(TEMPLATE, {chain_id: id}),
            fetchCardData(id)
        ])
            .then(([chainData, templateData,]) => {
                setChain(chainData);
                const sortedTemplateData = templateData.sort((a, b) => b.id - a.id);
                setListTemplate(sortedTemplateData);
            })
            .catch(error => {
                console.error("Lỗi khi tải dữ liệu:", error);
            });
    }


    // Handle opening the modal
    const handleOpenModal = () => {
        setIsModalVisible(true);
    };

    // Handle closing the modal
    const handleCloseModal = () => {
        setIsModalVisible(false);
        setNewCardName("");
    };

    // Handle creating a new card (you need to implement your card creation API)
    const handleCreateCard = async () => {
        if (newCardName && selectedTemplate) {
            let allStep = await getAllStep();
            let subSteps = await getAllSubStep();
            let steps = allStep.filter(step => step.template_id == selectedTemplate);
            // let steps = findRecordsByConditions(STEP , {template_id : selectedTemplate});
            steps.forEach(step => {
                step.status = NOT_DONE_YET
                let mau = allStep.find(item => item.type == 'M|' + step.type);
                if (!mau) {
                    step.subSteps = subSteps.filter(subStep => subStep.step_id == step.id);
                } else {
                    step.subSteps = subSteps.filter(subStep => subStep.step_id == mau.id);
                }
            })
            const {data, error} = await getCurrentUserLogin();

            await createNewCard({
                name: newCardName,
                template_id: selectedTemplate,
                chain_id: id,
                cau_truc: steps,
                created_at: createTimestamp(),
                user_update: data.email,

                // trang_thai: "Chờ duyệt",
                company: selectedCompany !== 'Toàn bộ' ? selectedCompany : '',
                year: currentYear,
                // code: chain.code + currentDay + currentMonth + currentYear
            }).then(async (data) => {
                let newCard = data.data;
                await updateCard({
                    ...newCard,
                    code: chain.code + currentDay + currentMonth + currentYear + '|' + newCard.id
                })
                await handleCloseModal();
                await fetchCardData(id)
            });
        } else {
            message.error("Please enter a name and select a template!", 3);
        }
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
    };

    const handleTimeChange = (e) => {
        setTime(e.target.value);
    };


    const handleSort = (criteria, type) => {
        setSortCriteria(criteria);
        setSortOrder(type);
        setIsDropdownOpen(false)
    };

    // const toggle = () => {
    //     setIsCollapsed(!isCollapsed);
    // };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const [visible, setVisible] = useState(false);

    const handleSelectTemplate = async (id, name) => {
        // setSelectedTemplate(id)
        // setSelectedTemplateName(name)
        setVisible(false)
    }

    // const content = (
    //     <Menu className={css.customMenu}>
    //         {
    //             listTemplate.map((template) => (
    //                 <Menu.Item onClick={() => handleSelectTemplate(template.id, template.name)} key={template.id}
    //                            value={template.id}>
    //                     {template.name}</Menu.Item>
    //             ))
    //         }
    //     </Menu>
    // );


    return (
        <>
            <div className={css.chainContainer}>
                <div className={`${css.listCardContainer} ${isCollapsedCard ? css.isCollapsed : css.unCollapsed}`}>
                    {
                        isCollapsedCard &&
                        <IconButton onClick={() => setIsCollapseCard(false)} size="small">
                            <MenuIcon/>
                        </IconButton>
                    }
                    {
                        !isCollapsedCard && (
                            <>
                                <div className={css.headerContainer}>
                                    <div className={css.headerSalesFlow}>
                                        <div className={css.nameSalesFlow}>
                                            <Popover
                                                // content={content}
                                                trigger="click"
                                                visible={visible}
                                                onVisibleChange={(val) => setVisible(val)}
                                                placement="bottom"
                                                arrowPointAtCenter={true}

                                            >
                                                <div className={css.titleHeader}>
                                                    <span>{selectedTemplateName}</span>
                                                    {/*<img style={{cursor: "pointer"}} src={ExpandMoreIcon} alt=""/>*/}
                                                </div>
                                            </Popover>

                                            <IconButton onClick={() => navigate('/work-flow/templates-chain/' + id)}>
                                                <img className={css.imgSettingCard} src={SettingCardTemplateIcon} alt=""/>
                                            </IconButton>

                                        </div>
                                        <div className={css.buttonContainer}>
                                            <div className={`${css.createCard}`} onClick={() => handleOpenModal()}>
                                                <div style={{display: "flex", gap: '5px', alignItems: "center"}}>
                                                    <img src={CreateCardIcon} alt=""/>
                                                    <span>Tạo mới</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={css.salesFlow}>
                                        {/*<div className={css.notification}>*/}
                                        {/*    <div className={css.itemNotification}>*/}
                                        {/*        <span>Chờ duyệt</span>*/}
                                        {/*        <h4>{countChoDuyet}</h4>*/}
                                        {/*    </div>*/}
                                        {/*    <div className={css.itemNotification}>*/}
                                        {/*        <span>Chờ xử lý</span>*/}
                                        {/*        <h4>{countChoXuLy}</h4>*/}
                                        {/*    </div>*/}
                                        {/*</div>*/}
                                        <div className={css.searchContainer}>
                                            <div className={css.searchBox}>
                                                <img src={SearchIcon} alt=""/>
                                                <input placeholder="Tìm kiếm"
                                                       value={searchText}
                                                       onChange={handleSearchChange}
                                                />
                                            </div>
                                            <IconButton onClick={() => setIsShow(!isShow)}>
                                                <img src={isShow ? UnCollapseCardIcon : CollapseCardIcon} alt=""/>
                                            </IconButton>
                                        </div>

                                    </div>
                                    {
                                        isShow &&
                                        <div className={css.filtersContainer}>
                                            <div className={css.statusFilter}>
                                                <select className={css.customSelect}
                                                        value={status}
                                                        onChange={handleStatusChange}
                                                >
                                                    <option value="">Trạng thái</option>
                                                    {STATUS_LIST_CARD.map(e => (
                                                        <option key={e.name} value={e.name}>
                                                            {e.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className={css.timeFilter}>
                                                <img src={DateIcon} alt=""/>
                                                <select style={{width: "max-content"}} value={time}
                                                        onChange={handleTimeChange}>
                                                    <option value="">Tất cả</option>
                                                    {[...Array(12)].map((_, index) => {
                                                        const month = index + 1;
                                                        return (
                                                            <option key={month} value={month}>
                                                                Tháng {month}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                            <div className={css.iconSvg} ref={dropdownRef}>
                                                <img
                                                    src={EllipsisIcon}
                                                    style={{width: 32, height: 32, cursor: 'pointer'}}
                                                    alt="Ellipsis Icon"
                                                    onClick={handleDropdownToggle}
                                                />
                                                {isDropdownOpen && (
                                                    <div className={css.dropdownMenu}>
                                                        <div onClick={() => handleSort("time", 'asc')}>Ngày tăng dần</div>
                                                        <div onClick={() => handleSort("time", 'desc')}>Ngày giảm dần</div>
                                                        <div onClick={() => handleSort("amount", 'asc')}>Tiền tăng dần</div>
                                                        <div onClick={() => handleSort("amount", 'desc')}>Tiền giảm dần
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    }

                                </div>
                                <div className={css.listCard}>
                                    <ListCardWorkFlow
                                        searchText={searchText}
                                        time={time}
                                        status={status}
                                        sortCriteria={sortCriteria}
                                        sortOrder={sortOrder}
                                        listCards={listCard}
                                    />
                                </div>
                            </>
                        )
                    }

                </div>
                <div className={css.cardDetailContainer}>
                    <Outlet/>
                </div>
            </div>

            {/* Modal for creating a new card */
            }
            <Modal
                title="Tạo Mới Card"
                visible={isModalVisible}
                onOk={handleCreateCard}
                onCancel={handleCloseModal}
                okText="Tạo"
                cancelText="Hủy"
            >
                <div>
                    <Input
                        placeholder="Nhập tên Card"
                        value={newCardName}
                        onChange={(e) => setNewCardName(e.target.value)}
                        style={{marginBottom: 10}}
                    />
                    {/*<Select*/}
                    {/*    placeholder="Chọn Template"*/}
                    {/*    value={selectedTemplate}*/}
                    {/*    onChange={(value) => setSelectedTemplate(value)}*/}
                    {/*    style={{width: '100%'}}*/}
                    {/*>*/}
                    {/*    {listTemplate.map((template) => (*/}
                    {/*        <Select.Option key={template.id} value={template.id}>*/}
                    {/*            {template.name}*/}
                    {/*        </Select.Option>*/}
                    {/*    ))}*/}
                    {/*</Select>*/}
                </div>
            </Modal>
            <ActionBookMarkChain/>
        </>
    )
        ;
}

import {Outlet, useNavigate, useParams} from "react-router-dom";
import ListCard from "../../Card/ListCard/ListCard.jsx";
import css from "./ChainDetail.module.css";
import {
    CollapseCardIcon,
    CreateCardIcon,
    DateIcon,
    EllipsisIcon, ExpandMoreIcon,
    SearchIcon, SelectAIIcon,
    SettingCardTemplateIcon, SettingIcon,
    UnCollapseCardIcon
} from "../../../../icon/IconSVG.js";
import {STATUS_LIST_CARD} from "../../../../CONST.js";
import React, {useContext, useEffect, useRef, useState} from "react";
import {getChainDataById} from "../../../../apis/chainService.jsx";
import {Input, Menu, message, Modal, Popover, Select} from 'antd';
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
import ViewCardTable from "../../Card/ListCard/ViewCardTable.jsx";
import ActionBookMark from "../../AgridTable/actionButton/ActionBookMark.jsx";
import {PhieuGom} from "../../SubStep/SubStepItem/Mau/PhieuXuat/PhieuGom.jsx";
import {PhieuGomNhap} from "../../SubStep/SubStepItem/Mau/PhieuXuat/PhieuGomNhap.jsx";
import {PhieuGomHoaDon} from "../../SubStep/SubStepItem/Mau/PhieuXuat/PhieuGomHoaDon.jsx";
import {PhieuGomPhieuThuBaoCo} from "../../SubStep/SubStepItem/Mau/PhieuXuat/PhieuGomPhieuThuBaoCo.jsx";
import {ViewPhieuGom} from "../../SubStep/SubStepItem/Mau/PhieuXuat/ViewPhieuGom.jsx";

export default function ChainDetail() {
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
    const [selectedTemplate, setSelectedTemplate] = useState(null);  // State for selected template
    const [selectedTemplateName, setSelectedTemplateName] = useState(null);  // State for selected template
    // const [isCollapsed, setIsCollapsed] = useState(false);
    const [countChoDuyet, setCountChoDuyet] = useState(null);
    const [countChoXuLy, setCountChoXuLy] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [sortCriteria, setSortCriteria] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [isShow, setIsShow] = useState(false);
    const dropdownRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isViewGomOpen, setIsViewGomOpen] = useState(false);
    const {
        selectedCompany,
        currentYear,
        isCollapsedCard,
        setIsCollapseCard,
        currentMonth,
        currentDay,
        loadData,
        setLoadData,
        chainTemplate2Selected,
        setChainTemplate2Selected,
    } = useContext(MyContext);

    const [isViewTable, setIsViewTable] = useState(false);  // State for modal visibility
    const handleOpenViewTable = () => {
        setIsViewTable(true);
    };

    const handleCloseViewTable = () => {
        setIsViewTable(false);

    };


    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    useEffect(() => {
        loadDataComponent();
    }, [id, loadData, chainTemplate2Selected]);

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

            const dataTemplate = await findRecordsByConditions(TEMPLATE, {chain_id: id});

            const filteredData = selectedTemplate
                ? data.filter(card => card.template_id === selectedTemplate)
                : data.filter(card => card.template_id === dataTemplate[0]?.name);

            let dataListCard = [];

            if (chainTemplate2Selected.data) {
                dataListCard = chainTemplate2Selected?.data?.selectedTemplate?.cards
            } else {
                dataListCard = filteredData.sort((a, b) => b.id - a.id);
            }

            // setListCard(dataListCard);

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
                setSelectedTemplateName(templateData[0]?.name)
                setSelectedTemplate(templateData[0]?.id)

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
    // const handleCreateCard = async () => {
    //   let data;
    //   let selectedTemplate1 = chainTemplate2Selected?.data?.selectedTemplate?.id

    //   if (newCardName && selectedTemplate1) {
    //     let allStep = await getAllStep();
    //     let subSteps = await getAllSubStep();
    //     let steps = allStep.filter(step => step.template_id == selectedTemplate1);
    //     // let steps = findRecordsByConditions(STEP , {template_id : selectedTemplate});
    //     steps.forEach(step => {
    //       step.status = NOT_DONE_YET
    //       let mau = allStep.find(item => item.type == 'M|' + step.type);

    //       if (!mau) {
    //         step.subSteps = subSteps.filter(subStep => subStep.step_id == step.id);
    //       } else {
    //         step.subSteps = subSteps.filter(subStep => subStep.step_id == mau.id);
    //       }
    //     })

    //     data = {
    //       name: newCardName,
    //       template_id: selectedTemplate1,
    //       chain_id: id,
    //       cau_truc: steps,
    //       created_at: createTimestamp(),
    //       // trang_thai: "Chờ duyệt",
    //       company: selectedCompany !== 'Toàn bộ' ? selectedCompany : '',
    //       year: currentYear,
    //       // code: chain.code + currentDay + currentMonth + currentYear
    //     }

    //     createNewCard(data).then(async (data) => {
    //       let newCard = data.data;
    //       await updateCard({
    //         ...newCard,
    //         code: chain.code + currentDay + currentMonth + currentYear + '|' + newCard.id
    //       })
    //       handleCloseModal();
    //       await fetchCardData(id)
    //       setLoadData(!loadData);
    //     });
    //   } else {
    //     message.error("Please enter a name and select a template!", { autoClose: 1000 });
    //   }
    // };
    const handleCreateCard = async () => {
        try {
            const selectedTemplate1 = chainTemplate2Selected?.data?.selectedTemplate?.id;
            const selectedTemplateName = chainTemplate2Selected?.data?.selectedTemplate?.name + ' ' + (Date.now() - 1738832920000);

            if (!selectedTemplate1) {
                message.error("Please enter a name and select a template!", 3);
                return;
            }

            const [allStep, subSteps] = await Promise.all([getAllStep(), getAllSubStep()]);

            const steps = allStep
                .filter(step => step.template_id == selectedTemplate1)
                .map(step => {
                    step.status = NOT_DONE_YET;
                    const mau = allStep.find(item => item.type == 'M|' + step.type);

                    step.subSteps = mau
                        ? subSteps.filter(subStep => subStep.step_id == mau.id)
                        : subSteps.filter(subStep => subStep.step_id == step.id);

                    return step;
                });

            const data = {
                name: selectedTemplateName,
                template_id: selectedTemplate1,
                chain_id: id,
                cau_truc: steps,
                created_at: createTimestamp(),
                company: selectedCompany !== 'Toàn bộ' ? selectedCompany : '',
                year: currentYear,
            };

            const newCard = await createNewCard(data);

            await updateCard({
                ...newCard.data,
                code: `${chain.code}${currentDay}${currentMonth}${currentYear}|${newCard.data.id}`
            });

            handleCloseModal();
            await fetchCardData(id);

            // setListCard([...listCard, newCard.data]);

            const updatedCards = [...chainTemplate2Selected.data.selectedTemplate.cards, newCard.data]
                .sort((a, b) => b.id - a.id);
            setChainTemplate2Selected(prev => ({
                ...prev,
                data: {
                    ...prev.data,
                    selectedTemplate: {
                        ...prev.data.selectedTemplate,
                        cards: updatedCards
                    }
                }
            }));

        } catch (error) {
            console.error("Error creating card:", error);
            message.error("An error occurred while creating the card. Please try again!", {autoClose: 1000});
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
        setSelectedTemplate(id)
        setSelectedTemplateName(name)
        setVisible(false)
    }

    const content = (
        <Menu className={css.customMenu}>
            {
                listTemplate.map((template) => (
                    <Menu.Item onClick={() => handleSelectTemplate(template.id, template.name)} key={template.id}
                               value={template.id}>
                        {template.name}</Menu.Item>
                ))
            }
        </Menu>
    );

    const handlePhieuGom = (value) => {
        if (value == 'add') {
            setIsOpen(true)
        } else if (value == 'view') {
            setIsViewGomOpen(true)
        }
        setVisible(false);
    };

    const content2 = (
        <Menu className={css.customMenu}>
            <Menu.Item onClick={() => handlePhieuGom("add")}>Thêm phiếu gom</Menu.Item>
            <Menu.Item onClick={() => handlePhieuGom("view")}>Xem phiếu gom</Menu.Item>
        </Menu>
    );


    return (
        <>
            <div className={css.chainContainer}>
                <div className={`${css.listCardContainer} ${isCollapsedCard ? css.isCollapsed : css.unCollapsed}`}>
                    {
                        isCollapsedCard &&
                        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                            <IconButton onClick={() => setIsCollapseCard(false)} size="small">
                                <MenuIcon/>
                            </IconButton>
                            <ActionBookMarkChain headerTitle={chainTemplate2Selected?.data?.selectedTemplate?.name}/>
                        </div>


                    }
                    {
                        !isCollapsedCard && (
                            <>
                                <div className={css.headerContainer}>
                                    <div className={css.headerSalesFlow}>
                                        <div className={css.nameSalesFlow}>
                                            {chainTemplate2Selected.type === 'chain'
                                                ? (
                                                    <>
                                                        <Popover
                                                            content={content}
                                                            trigger="click"
                                                            visible={visible}
                                                            onVisibleChange={(val) => setVisible(val)}
                                                            placement="bottom"
                                                            arrowPointAtCenter={true}

                                                        >
                                                            <div className={css.titleHeader}>
                                                                <span>{selectedTemplateName}</span>
                                                                <img style={{cursor: "pointer"}} src={ExpandMoreIcon}
                                                                     alt=""/>
                                                            </div>
                                                        </Popover>

                                                        <IconButton
                                                            onClick={() => navigate('/accounting/templates-chain/' + id)}>
                                                            <img className={css.imgSettingCard}
                                                                 src={SettingCardTemplateIcon} alt=""/>
                                                        </IconButton>
                                                    </>
                                                )
                                                : (
                                                    <div style={{display: "flex", gap: '10px', alignItems: "center"}}>
                                                        <h2>{chainTemplate2Selected?.data?.selectedTemplate?.name}</h2>
                                                        <ActionBookMarkChain
                                                            headerTitle={chainTemplate2Selected?.data?.selectedTemplate?.name}/>
                                                    </div>
                                                )
                                            }

                                        </div>
                                    </div>
                                    <div className={css.buttonContainer}>
                                        <div className={`${css.createCard}`} onClick={() => handleCreateCard()}>
                                            <div style={{display: "flex", gap: '5px', alignItems: "center"}}>
                                                {/*<img src={CreateCardIcon} alt=""/>*/}
                                                <span>Tạo mới</span>
                                            </div>
                                        </div>
                                        <div className={`${css.btnItem}`} onClick={() => handleOpenViewTable()}>
                                            <div style={{display: "flex", gap: '5px', alignItems: "center"}}>
                                                <span>Xem bảng</span>
                                            </div>
                                        </div>
                                        <div className={`${css.btnItem}`}>
                                            <div style={{display: "flex", alignItems: "center"}}>
                                                <Popover
                                                    content={content2}
                                                    trigger="click"
                                                    visible={visible}
                                                    onVisibleChange={(val) => setVisible(val)}
                                                    placement="right"
                                                >
                                                    Phiếu gom
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={css.salesFlow}>
                                        <div className={css.searchContainer}>
                                            <div className={css.searchBox}>
                                                <img src={SearchIcon} alt=""/>
                                                <input placeholder="Tìm kiếm"
                                                       value={searchText}
                                                       onChange={handleSearchChange}
                                                />
                                            </div>
                                        </div>
                                        <div className={css.filtersContainer}>
                                            <div className={css.timeFilter}>
                                                <img src={DateIcon} alt=""/>
                                                <select style={{width: "max-content"}} value={time}
                                                        onChange={handleTimeChange}>
                                                    <option value="">Lọc thời gian</option>
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
                                                {/*<img*/}
                                                {/*    src={EllipsisIcon}*/}
                                                {/*    style={{width: 32, height: 32, cursor: 'pointer'}}*/}
                                                {/*    alt="Ellipsis Icon"*/}
                                                {/*    onClick={handleDropdownToggle}*/}
                                                {/*/>*/}
                                                <span onClick={handleDropdownToggle}>Sắp xếp</span>
                                                {isDropdownOpen && (
                                                    <div className={css.dropdownMenu}>
                                                        <div onClick={() => handleSort("time", 'asc')}>Ngày tăng dần
                                                        </div>
                                                        <div onClick={() => handleSort("time", 'desc')}>Ngày giảm
                                                            dần
                                                        </div>
                                                        <div onClick={() => handleSort("amount", 'asc')}>Tiền tăng
                                                            dần
                                                        </div>
                                                        <div onClick={() => handleSort("amount", 'desc')}>Tiền giảm
                                                            dần
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className={css.listCard}>
                                    <ListCard
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
                </div>
            </Modal>
            <ViewCardTable open={isViewTable} onClose={handleCloseViewTable} listCard={listCard}
                           name={chainTemplate2Selected?.data?.selectedTemplate?.name}/>

            {isOpen && chainTemplate2Selected?.data?.selectedTemplate?.name === 'Xuất kho' &&
                <PhieuGom isOpen={isOpen} setIsOpen={setIsOpen}></PhieuGom>}
            {isOpen && chainTemplate2Selected?.data?.selectedTemplate?.name === 'Nhập kho' &&
                <PhieuGomNhap isOpen={isOpen} setIsOpen={setIsOpen}></PhieuGomNhap>}
            {isOpen && chainTemplate2Selected?.data?.selectedTemplate?.name === 'Hóa đơn' &&
                <PhieuGomHoaDon isOpen={isOpen} setIsOpen={setIsOpen}></PhieuGomHoaDon>}
            {isOpen && chainTemplate2Selected?.data?.selectedTemplate?.name === 'Phiếu thu / Báo có' &&
                <PhieuGomPhieuThuBaoCo isOpen={isOpen} setIsOpen={setIsOpen}></PhieuGomPhieuThuBaoCo>}

            {isViewGomOpen && chainTemplate2Selected?.data?.selectedTemplate?.name === 'Xuất kho' &&
                <ViewPhieuGom name={'Xuất kho'} isOpen={isViewGomOpen} setIsOpen={setIsViewGomOpen}/>
            }
            {isViewGomOpen && chainTemplate2Selected?.data?.selectedTemplate?.name === 'Nhập kho' &&
                <ViewPhieuGom name={'Nhập kho'} isOpen={isViewGomOpen} setIsOpen={setIsViewGomOpen}/>
            }
        </>
    )
        ;
}

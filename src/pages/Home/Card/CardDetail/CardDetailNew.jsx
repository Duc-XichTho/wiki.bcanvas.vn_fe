import css from './CardDetail.module.css'
import React, {useContext, useEffect, useState} from "react";
import {Outlet, useNavigate, useParams} from "react-router-dom";
import {updateCard} from "../../../../apis/cardService.jsx";
import {MyContext} from "../../../../MyContext.jsx";
import {DONE} from "../../../../Consts/STEP_STATUS.js";
import {EditIcon, ExpandMoreIcon, ListViewIcon} from "../../../../icon/IconSVG.js";
import PopupDeleteAgrid from "../../popUpDelete/popUpDeleteAgrid.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import {IconButton} from "@mui/material";
import {message} from "antd";
import PopupCancel from "../../popUpDelete/popUpCancel.jsx";
import StepDefault from "../../Step/StepDefault.jsx";
import {getDonHangById} from "../../../../apis/donHangService.jsx";
import {LiST_COMPONENT_FOR_TYPE_TABLE} from "../../../../Consts/LiST_COMPONENT_FOR_TYPE_TABLE.jsx";
import {LIST_COMPONENT_FOR_TYPE_TABLE_2} from "../../../../Consts/LIST_COMPONENT_FOR_TYPE_TABLE_2.jsx";
import {getHoaDonDataById} from "../../../../apis/hoaDonService.jsx";

export default function CardDetailNew() {
    const table = "Card"
    const {idCard, id, idStep, idTemp, option, idSelected} = useParams();
    const [card, setCard] = useState({});
    const [currentStep, setCurrentStep] = useState(null);
    const [template, setTemplate] = useState(null);
    const [isFull, setIsFull] = useState(true);
    const {loadData, setLoadData, isCollapsedCard, setIsCollapseCard,} = useContext(MyContext);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [originalName, setOriginalName] = useState('');
    const [dataPhieu, setDataPhieu] = useState(null);
    const [selectedTemplateName, setSelectedTemplateName] = useState(null);  // State for selected template

    const fetchData = async () => {
        let data = {};
        switch (option) {
            case "don-hang":
                data = await getDonHangById(idSelected);
                setSelectedTemplateName('Đơn hàng')

                break;
            case "hoa-don":
                data = await getHoaDonDataById(idSelected);
                setSelectedTemplateName('Hóa đơn')

                break;
            case 'de-nghi-thanh-toan':
                setSelectedTemplateName('Đề nghị thanh toán')

                break;
            case 'de-nghi-mua':
                setSelectedTemplateName('Đề nghị mua')

                break;
            case 'tam-ung':
                setSelectedTemplateName("Tạm ứng")

                break;
            case 'phieu-chi':
                setSelectedTemplateName("Phiếu chi / UN chi")

                break;
            case 'phieu-thu':
                setSelectedTemplateName("Phiếu thu / Báo có")

                break;
            case 'dieu-chuyen-kho':
                setSelectedTemplateName("Điều chuyển kho")

                break;
            case 'nhap-kho':
                setSelectedTemplateName("Nhập kho")

                break;
            case 'xuat-kho':
                setSelectedTemplateName("Xuất kho")

                break;
            default:
                console.warn(`Option không hợp lệ: ${option}`);
                return;
        }
        setDataPhieu(data)

    };

    useEffect(() => {
        if (option && idSelected) {
            fetchData()
        }
    }, [option, idSelected]);

    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    // useEffect(() => {
    //     getCardDataById(idCard).then(async data => {
    //         setCard(data);
    //         setOriginalName(data.name)
    //         const template = await getTemplateDataById(data.template_id)
    //         setTemplate(template)
    //     })
    //     fetchCurrentUser()
    // }, [idCard, loadData])
    // useEffect(() => {
    //     if (template?.name.includes('nhanh')) {
    //         setIsFull(false)
    //     }
    // }, [template]);

    const getStatusProgressBar = (status) => {
        if (status && status.length) {
            const doneCount = status.filter(item => item.status === DONE).length;
            return doneCount / status.length || 0;
        }
        return 0;
    };

    const handleReload = async () => {
        setLoadData(!loadData)

        navigate(`/accounting/chains/${id}/templates/${idTemp}`)
    }

    const handleSetEdit = () => {
        setIsEditing(true);
        // setInitCard(steps);  // Save the current state for canceling later
    };

    const handleRenameCard = (value,) => {
        setCard({...card, name: value})
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveEdit = async () => {
        try {
            if (!card.name || card.name.trim() === '') {
                message.error('Tên không được để trống!');
                setCard({...card, name: originalName});
                return;
            }
            setIsEditing(false);
            await updateCard(card);
            setLoadData(!loadData)
            message.success('Đã lưu thành công!');
        } catch (error) {  // sửa cú pháp catch
            console.error('Error updating card:', error);
            message.error('Có lỗi xảy ra khi lưu!');
        }
    };


    return (
        <>
            <div className={css.cardDetailContainer}>
                {isFull &&
                    <div className={css.stepListContainer}>
                        <div className={css.stepListTitle}>
                            {/*{*/}
                            {/*    template &&*/}
                            {/*    <div className={'btn-normal'}>*/}
                            {/*        <span>{template.name}</span>*/}

                            {/*    </div>*/}
                            {/*}*/}
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        value={dataPhieu.code}
                                        onChange={(e) => handleRenameCard(e.target.value)}
                                        className={css.editInput}
                                    />
                                    {isEditing && (
                                        <>
                                            <div className={css.newButton} onClick={handleSaveEdit}>
                                                <p>Lưu</p>
                                            </div>

                                            <div className={css.newButton} onClick={handleCancelEdit}>
                                                <p>Hủy</p>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <pre>
                                    {dataPhieu?.code}
                                    {/*<span style={{*/}
                                    {/*    color: "#fff",*/}
                                    {/*    fontSize: 12,*/}
                                    {/*    marginLeft: 5,*/}
                                    {/*    borderRadius: 3,*/}
                                    {/*    backgroundColor: 'lightgray',*/}
                                    {/*    padding: '2px 5px'*/}
                                    {/*}}>*/}
                                    {/*    {card.code}*/}
                                    {/*</span>*/}
                                    {currentStep && currentStep.name ? `   >   ${currentStep.name}` : null}
                                    {currentStep && currentStep.id ? <span style={{
                                            color: "#fff",
                                            fontSize: 12,
                                            marginLeft: 5,
                                            borderRadius: 3,
                                            backgroundColor: 'lightgray',
                                            padding: '2px 5px'
                                        }}>
                                        S{card.id}|{currentStep.id}
                                    </span>
                                        : null}
                                </pre>
                            )}
                            {/* {!isEditing && (

                                <IconButton className={css.editButton} onClick={handleSetEdit} size="small">
                                    <img src={EditIcon} alt="" />
                                </IconButton>
                            )} */}
                            <div style={{flex: 1, justifyContent: "flex-end", display: "flex"}}>
                                {/* <img style={{cursor: "pointer"}} onClick={() => {
                                    setIsFull(false)
                                }} src={ExpandLessIcon} alt=""/> */}
                                {
                                    card.trang_thai !== "Hoàn thành" &&
                                    <PopupCancel
                                        id={idCard}
                                        reload={() => setLoadData(!loadData)}
                                        table={table}
                                        currentUser={currentUser}
                                    />
                                }

                                <img style={{cursor: "pointer"}} onClick={() => {
                                    setIsCollapseCard(!isCollapsedCard)
                                }} src={ListViewIcon} alt=""/>

                                {
                                    card.trang_thai !== "Hoàn thành" &&
                                    <PopupDeleteAgrid
                                        id={card.id}
                                        reload={handleReload}
                                        table={table}
                                        currentUser={currentUser}
                                        card={'Card'}
                                    />
                                }
                            </div>
                        </div>
                        {/* <StepList
                            currentStep={currentStep}
                            setCurrentStep={setCurrentStep}
                            idCard={idCard}
                            stepList={card.cau_truc || []}
                            card={card}
                            setIsFull={setIsFull}
                        /> */}
                    </div>
                }
                {
                    !isFull &&
                    <div className={css.stepListTitle}>
                        {/*{*/}
                        {/*    template &&*/}
                        {/*    <div className={'btn-normal'}>*/}
                        {/*        <span>{template.name}</span>*/}
                        {/*    </div>*/}
                        {/*}*/}
                        {isEditing ? (
                            <>
                                <input
                                    type="text"
                                    value={card.name}
                                    onChange={(e) => handleRenameCard(e.target.value)}
                                    className={css.editInput}
                                />
                                {isEditing && (
                                    <>
                                        <div className={css.newButton} onClick={handleSaveEdit}>
                                            <p>Lưu</p>
                                        </div>

                                        <div className={css.newButton} onClick={handleCancelEdit}>
                                            <p>Hủy</p>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <pre>
                                {card.name}
                                <span style={{
                                    color: "#fff",
                                    fontSize: 12,
                                    marginLeft: 5,
                                    borderRadius: 3,
                                    backgroundColor: 'lightgray',
                                    padding: '2px 5px'
                                }}>
                                    {card.code}
                                </span>
                                {currentStep && currentStep.name ? `   >   ${currentStep.name}` : null}
                                {currentStep && currentStep.id ? <span style={{
                                        color: "#fff",
                                        fontSize: 12,
                                        marginLeft: 5,
                                        borderRadius: 3,
                                        backgroundColor: 'lightgray',
                                        padding: '2px 5px'
                                    }}>
                                    S{card.id}|{currentStep.id}
                                </span>
                                    : null}
                            </pre>)}
                        {!isEditing && (
                            <IconButton className={css.editButton} onClick={handleSetEdit} size="small">
                                <img src={EditIcon} alt=""/>
                            </IconButton>
                        )}
                        {/*<div className={css.progressBar}>*/}
                        {/*    <div className={`${css.progress}`}*/}
                        {/*         style={{width: `${getStatusProgressBar(card.cau_truc) * 100}%`}}>*/}
                        {/*    </div>*/}
                        {/*</div>*/}
                        <div style={{flex: 1, justifyContent: "flex-end", display: "flex"}}>
                            <img style={{cursor: "pointer"}} src={ExpandMoreIcon} onClick={() => {
                                setIsFull(true)
                            }} alt=""/>

                            <PopupCancel
                                id={idCard}
                                reload={() => setLoadData(!loadData)}
                                table={table}
                                currentUser={currentUser}
                            />
                            <img style={{cursor: "pointer"}}
                                 src={ListViewIcon} onClick={() => {
                                setIsCollapseCard(!isCollapsedCard)
                            }} alt=""/>
                            <PopupDeleteAgrid
                                id={card.id}
                                reload={handleReload}
                                table={table}
                                currentUser={currentUser}
                            />
                        </div>
                    </div>
                }
                {/*{idStep ? (*/}
                {/*    <div className={`${css.stepDetailContainer} ${!isFull ? css.stepDetailUnFull : css.stepDetailIsFull}`}>*/}
                {/*        <Outlet/>*/}
                {/*    </div>*/}
                {/*) : (*/}
                {/*    <div>*/}
                {/*        <StepDefault/>*/}
                {/*    </div>*/}
                {/*)}*/}

                <div className={`${css.stepDetailContainer} ${!isFull ? css.stepDetailUnFull : css.stepDetailIsFull}`}>
                    {
                        LIST_COMPONENT_FOR_TYPE_TABLE_2.map((component, index) => {
                            if (component.name === selectedTemplateName) {
                                return React.cloneElement(component.component, {
                                    key: index,
                                });
                            }
                            return null;
                        })
                    }
                </div>

            </div>
        </>
    )
}

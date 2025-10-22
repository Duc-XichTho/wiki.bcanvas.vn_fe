import React, {useContext, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import css from './card.module.css'
import {formatDateToDDMMYYYY, formatMoney, getMonthFromISOString} from "../../../../generalFunction/format.js";
import {CardIcon, CompleteStep, NotDoneYetStep, UnSaveTron} from "../../../../icon/IconSVG.js";
import {DONE} from "../../../../Consts/STEP_STATUS.js";
import {MyContext} from "../../../../MyContext.jsx";
import {getDonHangByCode} from "../../../../apis/donHangService.jsx";

export default function ListCardWorkFlow({
                                             searchText,
                                             time,
                                             status,
                                             sortCriteria,
                                             sortOrder,
                                             listCards,
                                             loadListCard
                                         }) {
    const {id, idCard} = useParams();
    const codeDonHang = `DH|${idCard}`;
    const navigate = useNavigate();
    const [listCard, setListCard] = useState(listCards);
    const [selectedCard, setSelectedCard] = useState(idCard);
    const {loadData, setLoadData} = useContext(MyContext);
    const [dataDonHangByCode, setDataDonHangByCode] = useState(null);

    const fetchDonHangByCode = async () => {
        try {
            const data = await getDonHangByCode(codeDonHang);
            if (data) {
                setDataDonHangByCode(data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchDonHangByCode();
    }, [idCard]);

    const filterCards = (cards, {status, searchText, time}) => {
        return cards.filter((card) => {
            const matchStatus = !status || card.trang_thai === status;
            const matchSearchText = !searchText || card.name.toLowerCase().includes(searchText.toLowerCase());
            const matchTime = !time || (() => {
                const date = getMonthFromISOString(card?.created_at)
                return date == time;
            })();
            return matchStatus && matchSearchText && matchTime;
        });
    };

    const sortCards = (cards, sortCriteria, sortOrder) => {
        return cards.sort((a, b) => {
            if (sortCriteria === "time") {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
            } else if (sortCriteria === "amount") {
                return sortOrder === "asc" ? a.so_tien - b.so_tien : b.so_tien - a.so_tien;
            }
            return 0;
        });
    };

    const fetchData = async (id, status, searchText, time, sortCriteria, sortOrder) => {
        try {
            const filteredCards = listCards
            let updatedCards = filterCards(filteredCards, {status, searchText, time});
            if (sortCriteria) {
                updatedCards = sortCards(updatedCards, sortCriteria, sortOrder);
            }
            return updatedCards;
        } catch (error) {
            console.error("Error fetching card data:", error);
            return [];
        }
    };
    const getCards = async () => {
        const updatedCards = await fetchData(id, status, searchText, time, sortCriteria, sortOrder);
        updatedCards.forEach(card => {
            let cauTruc = card.cau_truc;
            if (cauTruc) {

                let amountStep = cauTruc.length;
                if (amountStep) {
                    card.trang_thai = getStatusValue(card.trang_thai, cauTruc);
                }
            }
        });
        setListCard(updatedCards);
        setSelectedCard('')
    };
    useEffect(() => {
        getCards();
    }, [id, status, searchText, time, sortCriteria, sortOrder, listCards, loadData]);

    // const getStatusClass = (status) => {
    //     switch (status) {
    //         case "Chờ duyệt":
    //             return css.statusPending;
    //         case "Đã duyệt 1":
    //             return css.statusPending;
    //         case "Hoàn thành":
    //             return css.statusCompleted;
    //         case "Chờ xử lý":
    //             return css.statusProcessing;
    //         case "Hủy/treo":
    //             return css.statusCancelled;
    //         case "Đang TH":
    //             return css.statusDraft;
    //         default:
    //             return css.statusDefault;
    //     }
    // };

    const getStepIcon = (status) => {
        switch (status) {
            // case "Chờ duyệt":
            //     return PendingStep;
            // case "Đã duyệt 1":
            //     return PendingStep;
            case "Hoàn thành":
                return CompleteStep;
            case "Đang TH":
                return NotDoneYetStep;

            // case "notDoneYet":
            //     return NotDoneYetStep;
            default:
                return UnSaveTron;
        }
    };

    const getStatusProgressBar = (status) => {
        if (status && status.length) {
            const doneCount = status.filter(item => item.status === DONE).length;
            return doneCount / status.length || 0;
        }
        return 0;
    };

    // function getStatusValue(trangThai, cauTruc) {
    //     if (trangThai) {
    //         return trangThai;
    //     }
    //     if (cauTruc && Array.isArray(cauTruc)) {
    //         const allDone = cauTruc.every(step => step.status === DONE);
    //         const hasPendingOrDuyet = cauTruc.some(step => step.status === PENDING || step.status === DUYET1);
    //         if (allDone) {
    //             return "Hoàn thành";
    //         } else if (hasPendingOrDuyet) {
    //             return "Chờ duyệt";
    //         } else {
    //             return "Đang TH";
    //         }
    //     }
    //     return "Không xác định";
    // }
    function getStatusValue(trangThai, cauTruc) {
        if (trangThai) {
            return trangThai;
        }
        if (cauTruc && Array.isArray(cauTruc)) {
            const allDone = cauTruc.every(step => step.status === DONE);
            if (allDone) {
                return "Hoàn thành";
            } else {
                return "Đang TH";
            }
        }
        // return "Không xác định";
    }

    const handleCardClick = (card) => {
        setSelectedCard(card.id); // Set selected card ID
        navigate(`/work-flow/${id}/cards/${card.id}`);

    };


    return (
        <div className={css.listCardContainer}>
            {listCard.map((card) => (
                <div key={card.id} // Use card.id as key for better performance
                     className={`${css.cardItem} ${idCard == card.id ? css.selected : ''}`} // Highlight if selected
                     onClick={() => handleCardClick(card)}
                >
                    <div className={css.cardHeader}>
                        <div className={css.cardHeaderLeft}>
                            <img src={CardIcon} alt=""/>
                            <span className={css.cardTitle} title={`Đơn hàng ${card.name || ""}`}>
                                {card.name || ""}
                            </span>

                        </div>
                        <div className={css.cardHeaderRight}>
                            <div className={css.cardCode}>
                                {/*<div className={css.statusBox}>*/}
                                {/*    <span>{card.code}</span>*/}
                                {/*</div>*/}
                                <div className={css.cardStatus}>
                                    <img src={getStepIcon(card.trang_thai)} alt=""/>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className={css.cardBody}>
                        <p className={css.cardDescription}>
                            {card.mo_ta ? `Mô tả :${card.mo_ta} ` : ""}
                        </p>
                        <span className={css.cardAmount}>
                            {card.so_tien === null ? <></> : formatMoney(card.so_tien)}
                        </span>
                    </div>

                    <div className={css.cardBody}>
                        <p className={css.cardDescription}>
                            LastUpdate :{card.updated_at ? formatDateToDDMMYYYY(card.updated_at) : formatDateToDDMMYYYY(card.created_at)} By {card.user_update ? card.user_update : card.user_create}
                        </p>
                    </div>


                    <div style={{display: "flex"}}>
                        <p className={css.cardCompany}>{card.mo_ta2 || ""}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}




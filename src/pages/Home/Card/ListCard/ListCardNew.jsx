import React, {useContext, useEffect, useState, useRef} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {getAllCard} from "../../../../apis/cardService.jsx";
import css from './card.module.css'
import {formatMoney, getMonthFromISOString, parseDateFromDDMMYYYY} from "../../../../generalFunction/format.js";
import {
    CardIcon,
    ClockIcon,
    CompleteStep,
    DoingStep,
    DollarIcon,
    NotDoneYetStep,
    PendingStep, UnSaveTron
} from "../../../../icon/IconSVG.js";
import {DONE, DUYET1, getVNStatus, PENDING} from "../../../../Consts/STEP_STATUS.js";
import {MyContext} from "../../../../MyContext.jsx";
import {findRecordsByConditions} from "../../../../apis/searchModelService.jsx";
import {CARD} from "../../../../Consts/MODEL_CALL_API.js";
import {getDonHangByCode} from "../../../../apis/donHangService.jsx";
import {getAllChainTemplateStepSubStep} from "../../../../apis/chainService.jsx";
import {getAllWarningSAB} from "../../../../apis/smartWarmingSABService.jsx";
import {Dot} from 'lucide-react';
import {Dropdown} from "antd";
import {LIST_WARNING} from "../../../../Consts/LIST_WARNING.js";

export default function ListCardNew({
                                     searchText,
                                     time,
                                     status,
                                     sortCriteria,
                                     sortOrder,
                                     listCards,
                                     loadListCard
                                 }) {
    const {option , idSelected} = useParams();
    const navigate = useNavigate();
    const [listCard, setListCard] = useState([]);
    const [cardSelected, setCardSelected] = useState(null);
    const {chainTemplate2Selected, setCardSelectedContext} = useContext(MyContext);
    const [smartWarning, setSmartWarning] = useState([]);
    const [prevCardsLength, setPrevCardsLength] = useState(0);




    useEffect(() => {
        const getWarning = async () => {
            let warning = await getAllWarningSAB()
            setSmartWarning(warning)
        }
        getWarning()
    }, [chainTemplate2Selected]);

    const filterCards = (cards, {status, searchText, time}) => {
        return cards.filter((card) => {
            const matchStatus = !status || card.trang_thai === status;
            const matchSearchText = !searchText || card.code.toLowerCase().includes(searchText.toLowerCase());
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

    const fetchData = async (status, searchText, time, sortCriteria, sortOrder, data) => {
        try {
            const filteredCards = data
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

    const getCards = async (data) => {
        const updatedCards = await fetchData(status, searchText, time, sortCriteria, sortOrder, data);
        updatedCards.forEach(card => {
            let cauTruc = card.trang_thai;
            if (cauTruc) {
                let amountStep = cauTruc.length;
                if (amountStep) {
                    card.trang_thai = getStatusValue(card.trang_thai, cauTruc);
                }
            }

            // Khởi tạo mảng listE nếu chưa có
            // if (!card.listE) {
            //     card.listE = [];
            // }

            // Duyệt qua từng mục lớn trong smartWarning
            // Object.keys(smartWarning).forEach(key => {
            //     const item = smartWarning[key];
            //
            //     // Duyệt qua từng data trong mục lớn
            //     item?.data?.forEach(dataItem => {
            //         // So sánh id_card_create
            //         if (dataItem?.id_card_create === card.id) {
            //             // Tạo key để kiểm tra trùng lặp
            //             const uniqueKey = key + card.id;
            //
            //             // Kiểm tra nếu chưa có thì mới push vào
            //             if (!card.listE.some(e => e.key === uniqueKey)) {
            //                 card.listE.push({
            //                     key: uniqueKey,
            //                     label: (
            //                         <>
            //                             <div>
            //                                 <div>{key} - {item.message}</div>
            //                             </div>
            //                         </>
            //                     )
            //                 });
            //             }
            //         }
            //     });
            // });
        });
        setListCard(updatedCards);
    };

    useEffect(() => {
        setCardSelected(null)
        getCards(listCards || []);
    }, [searchText, time, status, sortCriteria, sortOrder, smartWarning, listCards]);

    const getStepIcon = (status) => {
        switch (status) {
            case "done":
                return CompleteStep;
            case "doing":
                return NotDoneYetStep;
            default:
                return NotDoneYetStep;
        }
    };

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
        localStorage.setItem('cardSelected', card.id);
        setCardSelected(card);
        setCardSelectedContext(card);
        navigate(`/accounting/options/${option}/${card.id}`);
    };

    useEffect(() => {
        if (listCard.length > 0) {
            localStorage.setItem('cardSelected', listCard[0].id);
            setCardSelected(listCard[0]);
            setCardSelectedContext(listCard[0]);
            navigate(`/accounting/options/${option}/${listCard[0].id}`);
        }

    }, [listCard]);

    return (
        <div className={css.listCardContainer}>
            {listCard.length > 0 ? (
                listCard.map((card) => {
                    const {id, code, mo_ta, so_tien, mo_ta2, trang_thai, listE} = card;
                    return (
                        <div key={id}
                             className={`${css.cardItem}  ${id == idSelected ? css.selected : ''}`}
                             onClick={() => handleCardClick(card)}
                        >
                            <div className={css.cardHeader}>
                                <div className={css.cardHeaderLeft}>
                                    <img src={CardIcon} alt=""/>
                                    <span className={css.cardTitle}>
                                        {code || ""}
                                    </span>
                                    {listE?.length > 0 && (
                                        <Dropdown
                                            menu={{
                                                items: listE
                                            }}>
                                            <Dot size={40} color={'red'}/>
                                        </Dropdown>

                                    )}

                                </div>
                                <div className={css.cardHeaderRight}>
                                    <div className={css.cardCode}>
                                        {/* <div className={css.statusBox}>
                                            <span>{code}</span>
                                        </div> */}
                                        <div className={css.cardStatus}>
                                            <img src={getStepIcon(trang_thai)} alt=""/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={css.cardBody}>
                                <p className={css.cardDescription}>{mo_ta || ""}</p>
                                {so_tien !== null && (
                                    <span className={css.cardAmount}>{formatMoney(so_tien)}</span>
                                )}
                            </div>

                            {mo_ta2 && (
                                <div style={{display: "flex"}}>
                                    <p className={css.cardCompany}>{mo_ta2}</p>
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <p>Không có dữ liệu</p>
            )}
        </div>
    );

}

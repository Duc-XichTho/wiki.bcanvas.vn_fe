import {Modal, Select} from "antd";
import React, {useEffect, useState} from "react";
import css from "./PopupSelectDS.module.css";
import {getAllCard} from "../../../../apis/cardService.jsx";
import {SA} from "../../../../Consts/LIST_STEP_TYPE.js";
import {DONE} from "../../../../Consts/STEP_STATUS.js";
import {TYPE_SHEET} from "../../../../Consts/SECTION_TYPE.js";

const {Option} = Select;

export default function PopupSelectDS({
                                          isOpen,
                                          setIsOpen,
                                          selectedCardId,
                                          setSelectedCardId,
                                          selectedStepId,
                                          setSelectedStepId,
                                          selectedSubStepId,
                                          setSelectedSubStepId,
                                          setGom1,
                                          gom1
                                      }) {
    const [cards, setCards] = useState([]);

    function fetchCards() {
        getAllCard().then((data) => {
            data = data.filter(
                (item) =>
                    item.cau_truc &&
                    item.cau_truc.length > 0 &&
                    item.cau_truc.find((e) => e.type)
            );
            data.forEach((item) => {
                if (item.cau_truc) {
                    item.cau_truc = item.cau_truc.filter(
                        (e) => e.type == SA && e.status == DONE
                    );
                    if (item.cau_truc) {
                        let steps = item.cau_truc;
                        steps.forEach((step) => {
                            step.subSteps = step.subSteps.filter(
                                (e) => e.subStepType == TYPE_SHEET
                            );
                        });
                    }
                }
            });
            data = data.filter((item) => item.cau_truc.length > 0);
            setCards(data);
        });
    }

    useEffect(() => {
        fetchCards();
    }, []);

    const getSteps = () => {
        if (!selectedCardId) return [];
        const card = cards.find((card) => card.id === selectedCardId);
        return card?.cau_truc || [];
    };

    const getSubSteps = () => {
        if (!selectedStepId) return [];
        const step = getSteps().find((step) => step.id === selectedStepId);
        return step?.subSteps || [];
    };

    function handleOk() {
        if (selectedSubStepId) {
            setGom1(!gom1);
            console.log(selectedCardId, selectedStepId, selectedSubStepId);
            setIsOpen(false)
        }
    }

    return (
        <>
            <Modal
                title="Chọn nguồn danh sách sản phẩm"
                centered
                open={isOpen}
                onCancel={() => setIsOpen(false)}
                width="50%"
                onOk={handleOk}
            >
                <div className={css.container}>
                    <div className={css.listCard}>
                        <h3>Chọn chuỗi</h3>
                        <Select
                            style={{width: "100%"}}
                            placeholder="Chọn chuỗi"
                            onChange={(value) => {
                                setSelectedCardId(value);
                                setSelectedStepId(null); // Reset step selection
                                setSelectedSubStepId(null); // Reset substep selection
                            }}
                            value={selectedCardId}
                        >
                            {cards.map((card) => (
                                <Option key={card.id} value={card.id}>
                                    {card.code}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className={css.listStep}>
                        <h3>Chọn bước</h3>
                        <Select
                            style={{width: "100%"}}
                            placeholder="Chọn bước"
                            onChange={(value) => {
                                setSelectedStepId(value);
                                setSelectedSubStepId(null); // Reset substep selection
                            }}
                            value={selectedStepId}
                            disabled={!selectedCardId}
                        >
                            {getSteps().map((step) => (
                                <Option key={step.id} value={step.id}>
                                    S{selectedCardId}|{step.id}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className={css.listSheet}>
                        <h3>Chọn section</h3>
                        <Select
                            style={{width: "100%"}}
                            placeholder="Chọn section"
                            onChange={setSelectedSubStepId}
                            value={selectedSubStepId}
                            disabled={!selectedStepId}
                        >
                            {getSubSteps().map((subStep) => (
                                <Option key={subStep.id} value={subStep.id}>
                                    {subStep.name}
                                </Option>
                            ))}
                        </Select>
                    </div>
                </div>
            </Modal>
        </>
    );
}

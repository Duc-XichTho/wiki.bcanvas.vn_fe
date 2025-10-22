import React, {useContext, useState} from "react";
import css from './TemplateList.module.css';
import {useNavigate} from "react-router-dom";
import {EditIcon, SaveTron, UnSaveTron} from "../../../../icon/IconSVG.js";
import {IconButton} from "@mui/material";
import {MyContext} from "../../../../MyContext.jsx";
import PopupDeleteAgrid from "../../popUpDelete/popUpDeleteAgrid.jsx";

export default function TemplateList({
                                         chainId,
                                         listTemplate,
                                         onUpdateTemplate,
                                         onDeleteTemplate,
                                         currentUser,
                                         loadListTemplate
                                     }) {
    const table = 'Template';
    const [selectedCard, setSelectedCard] = useState(null);
    const [editingCard, setEditingCard] = useState(null);
    const [tempName, setTempName] = useState('');
    const {loadData, setLoadData} = useContext(MyContext);
    const navigate = useNavigate();


    const handleCardClick = (card) => {
        setSelectedCard(card);
        navigate('detail/' + card.id)
    };

    const handleEditClick = (event, card) => {
        event.stopPropagation();
        setEditingCard(card.id);
        setTempName(card.name);
        setSelectedCard(card)
    };

    const handleSaveClick = (event, card) => {
        setSelectedCard(card)
        event.stopPropagation();
        if (onUpdateTemplate) {
            onUpdateTemplate(card.id, tempName);
        }
        setEditingCard(null);
    };

    const handleCancelClick = (event) => {
        event.stopPropagation();
        setEditingCard(null);
    };

    return (
        <div className={css.listCardContainer}>
            {listTemplate.map((item) => (
                <div key={item.id}
                     className={`${css.cardItem} ${selectedCard?.id === item.id ? css.selected : ''}`}
                     onClick={() => handleCardClick(item)}
                >
                    <div className={css.cardHeader}>
                        <div className={css.cardHeaderLeft}>
                            {editingCard === item.id ? (
                                <input
                                    className={css.editInput}
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                />
                            ) : (
                                <span className={css.cardTitle}>{item.name}</span>
                            )}
                        </div>
                        <div className={css.cardHeaderRight}>
                            {editingCard === item.id ? (
                                <div style={{marginRight : '3px'}}>

                                    <IconButton onClick={(e) => handleSaveClick(e, item)} size="small">
                                        <img src={SaveTron} alt=""/>
                                    </IconButton>
                                    <IconButton onClick={(e) => handleCancelClick(e, item)} size="small">
                                        <img src={UnSaveTron} alt=""/>
                                    </IconButton>
                                </div>
                            ) : (
                                <>
                                    <IconButton onClick={(e) => handleEditClick(e, item)} size="small">
                                        <img src={EditIcon} alt=""/>
                                    </IconButton>
                                    <PopupDeleteAgrid
                                        id={item.id}
                                        reload={loadListTemplate}
                                        table={table}
                                        currentUser={currentUser}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

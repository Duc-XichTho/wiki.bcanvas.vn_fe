import React, { useState, useRef, useEffect, useContext } from 'react';
import { Button, IconButton, Popover, Typography } from '@mui/material';
import { DeleteIcon } from "../../../icon/IconSVG.js";
import { toast } from "react-toastify";
import { handleDelete } from "../AgridTable/handleAction/handleDelete.js";
import { useParams } from "react-router-dom";
import { getCurrentUserLogin } from "../../../apis/userService.jsx";
import { createTimestamp } from "../../../generalFunction/format.js";
import { updateCard } from "../../../apis/cardService.jsx";
import { MyContext } from '../../../MyContext.jsx';
import { decodePhieu } from '../../../generalFunction/genCode/genCode.js';
import { deleteCard } from "./deleteCard.js";
import { message } from "antd";

const PopupDeleteAgrid = ({ id, reload, table, currentUser, card, ...props }) => {
    const { cardSelectedContext, chainTemplate2Selected, setChainTemplate2Selected } = useContext(MyContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const [anchorOrigin, setAnchorOrigin] = useState({ vertical: 'bottom', horizontal: 'center' });
    const [transformOrigin, setTransformOrigin] = useState({ vertical: 'top', horizontal: 'center' });
    const iconButtonRef = useRef(null);
    const { idCard } = useParams()
    const open = Boolean(anchorEl);
    const idPopover = open ? 'simple-popover' : undefined;

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleReload = () => {
        reload();
    };


    const handleDeleteAction = async () => {
        try {
            if (table) {
                await handleDelete(table, id, currentUser);
            }
            if (card == 'Card') {
                const { data, error } = await getCurrentUserLogin();
                const newData = {
                    id: idCard,
                    user_update: data.email,
                    updated_at: createTimestamp(),
                }
                await updateCard(newData);
                await deleteCard(cardSelectedContext)

                setChainTemplate2Selected(prev => {
                    const updatedData = { ...prev.data };

                    updatedData.selectedTemplate.cards = updatedData.selectedTemplate.cards.filter(
                        card => card?.id !== cardSelectedContext?.id
                    );

                    return { ...prev, data: updatedData };
                });

            }

            message.success("Xóa thành công");
            handleClose();
            handleReload();
        } catch (error) {
            console.error("Error handling delete and fetching data:", error);
        }
    };

    useEffect(() => {
        if (anchorEl) {
            const rect = iconButtonRef.current.getBoundingClientRect();
            const screenWidth = window.innerWidth;
            if (rect.right + 200 > screenWidth) {
                setAnchorOrigin({ vertical: 'bottom', horizontal: 'right' });
                setTransformOrigin({ vertical: 'top', horizontal: 'right' });
            } else {
                setAnchorOrigin({ vertical: 'bottom', horizontal: 'center' });
                setTransformOrigin({ vertical: 'top', horizontal: 'center' });
            }
        }
    }, [anchorEl]);

    return (
        <>
            <IconButton style={{ padding: "12px" }} ref={iconButtonRef} onClick={handleClick}>
                <img
                    src={DeleteIcon}
                    alt="Delete"
                    style={{ height: "22px" }}
                />
            </IconButton>

            <Popover
                id={idPopover}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={anchorOrigin}
                transformOrigin={transformOrigin}
            // PaperProps={{
            //     style: {
            //         marginTop: '-90px',
            //         marginLeft: '180px',
            //     },
            // }}
            >
                <Typography sx={{ padding: 2 }}>
                    Bạn có muốn xóa không?
                </Typography>
                <div style={{ padding: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={handleDeleteAction} color="error">
                        Xóa
                    </Button>
                    <Button onClick={handleClose} color="primary">
                        Hủy
                    </Button>
                </div>
            </Popover>
        </>
    );
};

export default PopupDeleteAgrid;

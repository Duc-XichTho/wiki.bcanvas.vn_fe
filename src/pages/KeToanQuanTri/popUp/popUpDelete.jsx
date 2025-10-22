import React, {useContext, useEffect, useRef, useState} from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import {AiOutlineDelete} from 'react-icons/ai';
import {MyContext} from "../../../MyContext.jsx";
import {handleDeleteAgl} from "../functionKTQT/handleDeleteAgl.js";

const PopupDeleteRenderer = ({
                                 role,
                                 id,
                                 table,
                                 reloadData,
                                 leader_approve,
                                 manager_approve,
                                 newrow,
                                 disable,
                                 data,
                                 setSktDeleted,
                                 setLoading,
                                 ...props
                             }) => {
    const tippyRef = useRef();
    const [visible, setVisible] = useState(false);
    const [isActive, setIsActive] = useState(false);
    let {fetchAllProduct, fetchAllUnits, fetchAllDeal, setIsUpdateNoti, isUpdateNoti} = useContext(MyContext);

    const show = () => setVisible(true);
    const hide = () => setVisible(false);

    useEffect(() => {
        if (role === 0) {
            if (manager_approve === 'Đã duyệt') {
                setIsActive(true);
            }
        } else if (role === 1) {
            if (leader_approve === 'Đã duyệt') {
                setIsActive(true);
            }
        }
        if (!leader_approve && !manager_approve) {
            setIsActive(true);
        }
    }, []);
    const handleDelete = async () => {
        try {
            await handleDeleteAgl(table, reloadData, id, setIsUpdateNoti, isUpdateNoti);
            const fetchFunctions = {
                Product: fetchAllProduct,
                Unit: fetchAllUnits,
                Deal: fetchAllDeal,
            };
            if (fetchFunctions[table]) {
                await fetchFunctions[table]();
            }
            if (setLoading) {
                setLoading(true)
            }
        } catch (error) {
            console.error("Error handling delete and fetching data:", error);
        }
    };
    const dropDownContent = (
        <div className="chat-container" style={{textAlign: 'center'}}>
            <p>Bạn có muốn xóa dòng này không?</p>
            <div
                className="button-group"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '5px 50px',
                }}
            >
                <button
                    onClick={() => {
                        props.show = false;
                        handleDelete()
                    }}
                    style={{
                        padding: '1px 5px',
                        borderRadius: '4px',
                        lineHeight: '1.5',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: "maroon"

                    }}
                >
                    Xóa
                </button>
                <button
                    onClick={hide}
                    style={{
                        padding: '1px 5px',
                        borderRadius: '4px',
                        lineHeight: '1.5',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: "maroon"

                    }}
                >
                    Hủy
                </button>
            </div>
        </div>
    );

    return (
        <Tippy
            ref={tippyRef}
            content={dropDownContent}
            visible={visible}
            onClickOutside={hide}
            allowHTML={true}
            arrow={false}
            appendTo={document.body}
            interactive={true}
            placement="left"
        >
            {isActive && !disable ? (
                <button
                    className=""
                    onClick={visible ? hide : show}
                    style={{
                        backgroundColor: 'rgba(255,255,255,0)',
                        width: '100%',
                        height: '100%',
                        margin: 0,
                        padding: 0,
                        border: "none",
                    }}
                >
                    <AiOutlineDelete size={18} color={"#454545"}/>
                </button>
            ) : (
                <></>
            )}
        </Tippy>
    );
};

export default PopupDeleteRenderer;

import React, {useEffect, useRef, useState} from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import {AiOutlineDelete} from 'react-icons/ai';
import {handleDeleteAgl} from '../../../components/powersheet/function/handleDeleteAgl.js';
import {DeleteIcon} from "../../../image/IconSVG.js";

const PopupDeleteReportManagement = ({
                                         id, table, reload, ...props
                                     }) => {
    const tippyRef = useRef();
    const [visible, setVisible] = useState(false);
    const show = () => setVisible(true);
    const hide = () => setVisible(false);


    const dropDownContent = (
        <div className="chat-container" style={{textAlign: 'center'}}>
            <p>Bạn có muốn xóa báo cáo này không?</p>
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
                        handleDeleteAgl(table, reload, id);
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
            <button
                onClick={visible ? hide : show}
                style={{
                    backgroundColor: 'rgba(255,255,255,0)',
                    marginTop: "6px",
                    cursor : "pointer"
                }}
            >
                <img src={DeleteIcon} alt=""/>
            </button>
        </Tippy>
    );
};

export default PopupDeleteReportManagement;

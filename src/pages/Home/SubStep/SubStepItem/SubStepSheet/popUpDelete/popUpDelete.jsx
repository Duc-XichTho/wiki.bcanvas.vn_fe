import React, { useRef, useState } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { AiOutlineDelete } from "react-icons/ai";
import { IconButton } from "@mui/material";
import { XRedIcon } from "../../../../../../icon/IconSVG";
// API
import { deleteTemplateRow } from "../../../../../../apis/templateSettingService";
import { message } from "antd";

const PopupDeleteRenderer = ({ id, reload, ...props }) => {
  const tippyRef = useRef();

  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  const handleDelete = async () => {
    try {
      console.log(id);
      await deleteTemplateRow(id);
      await new Promise(resolve => setTimeout(resolve, 300));
      await reload();
      message.success("Xóa thành công");
    } catch (error) {
      console.error("Error handling delete and fetching data:", error);
    }
  };

  const dropDownContent = (
    <div className="chat-container" style={{ textAlign: "center" }}>
      <p>Bạn có muốn xóa dòng này không?</p>
      <div
        className="button-group"
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "5px 50px",
        }}
      >
        <button
          onClick={() => {
            props.show = false;
            handleDelete();
          }}
          style={{
            padding: "1px 5px",
            borderRadius: "4px",
            lineHeight: "1.5",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            color: "maroon",
          }}
        >
          Xóa
        </button>
        <button
          onClick={hide}
          style={{
            padding: "1px 5px",
            borderRadius: "4px",
            lineHeight: "1.5",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            color: "maroon",
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
      <IconButton onClick={visible ? hide : show} size="small">
        <img src={XRedIcon} alt="" />
      </IconButton>
    </Tippy>
  );
};

export default PopupDeleteRenderer;

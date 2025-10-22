import React, { useContext, useState } from "react";
import css from "../Content.module.css";
import { MyContext } from "../../../../../MyContext.jsx";
import PreviewComponent from "../Preview/PreviewComponent.jsx";
import { formatDateToDDMMYYYY } from "../../../../../generalFunction/format.js";
import { Menu } from "antd";

const NotePad = ({ fileNotePad, fetchData }) => {
  const { selectedTapCanvas, setSelectedTapCanvas } = useContext(MyContext);
  const [selectedApi, setSelectedApi] = useState("API1");
  const [visible, setVisible] = useState(false);
  const options = ["API1", "API2", "API3", "API4"];

  const handleOptionSelect = (option) => {
    setSelectedApi(option);
    setVisible(false);
  };

  const content = (
    <Menu className={css.customMenu}>
      {options.map((item) => (
        <Menu.Item onClick={() => handleOptionSelect(item)}>{item}</Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div className={css.mainContent2}>
      <div className={css.mainContent2Wrap}>
        <div className={css.header}>
          <div className={css.headerTitle}>
            <div className={css.reportHeader}>
              <span className={css.name}> {fileNotePad.name}</span>
            </div>
            <div className={css.info}>
              {fileNotePad.updated_at && (
                <span>
                  Last updated {formatDateToDDMMYYYY(fileNotePad.updated_at)} bởi{" "}
                  {fileNotePad.user_update}
                </span>
              )}
            </div>
          </div>
          {/*<div>*/}
          {/*    <UploadFileForm*/}
          {/*        id={fileNotePad.id}*/}
          {/*        table={'FileUpLoad'}*/}
          {/*        style={{fontSize: 15}}*/}
          {/*        onGridReady={fetchData}*/}
          {/*    />*/}
          {/*</div>*/}
          {/* <div className={css.apiButton}>
                    <span>Kết nối vào kho dữ liệu AI {' '} </span>

                    <Popover
                        content={content}
                        trigger="click"
                        visible={visible}
                        onVisibleChange={(val) => setVisible(val)}
                        placement="bottom"
                        arrowPointAtCenter={true}

                    >
                        <div className={css.select}>
                            <span className={css.dropdown}>{selectedApi}</span>
                            <img style={{cursor: "pointer"}} src={SelectAIIcon} alt=""/>
                        </div>
                    </Popover>
                </div> */}
        </div>

        <div className={css.valueContent}>
          <div className={css.placeholder}>
            <PreviewComponent
              data={fileNotePad}
              onClose={() => setSelectedTapCanvas("")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotePad;

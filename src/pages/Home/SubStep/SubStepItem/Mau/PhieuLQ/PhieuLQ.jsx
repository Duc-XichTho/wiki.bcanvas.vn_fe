import {Checkbox, Modal} from "antd";
import {LIST_PHIEU_TYPE} from "../../../../../../Consts/LIST_STEP_TYPE.js";
import {useEffect, useState} from "react";
import css from './PhieuLQ.module.css'
import style from "../../../../../../components/Header/CauHinh/SetupDKPhieu.module.css";

export function PhieuLQ({isOpenPhieuLQ, setIsOpenPhieuLQ, selectedPhieuCodes, setSelectedPhieuCodes}) {
    const [selectedNamePhieu, setSelectedNamePhieu] = useState(null);
    const [selectedListPhieu, setSelectedListPhieu] = useState(null);
    const [selectedTypePhieu, setSelectedTypePhieu] = useState(null);
    const [selectedIdCardDetail, setSelectedIdCardDetail] = useState(null);
    const [selectedDetail, setSelectedDetail] = useState(null);
    async function loadData() {

        let type = LIST_PHIEU_TYPE.find(e => e.name == selectedNamePhieu);
        setSelectedTypePhieu(type);
        if (type) {
            let list = await type.api();
            setSelectedListPhieu(list)
        }
    }

    async function loadPhieuDetail() {
        if (selectedIdCardDetail && selectedTypePhieu && selectedTypePhieu.detailAPI) {
            let data = await selectedTypePhieu.detailAPI(selectedIdCardDetail);
            if (data?.length && data?.length > 0) {
                setSelectedDetail(data[0])
            } else {
                setSelectedDetail(data)
            }
        }
    }

    useEffect(() => {
        loadData().then()
    }, [selectedNamePhieu]);

    useEffect(() => {
        loadPhieuDetail().then()
    }, [selectedIdCardDetail]);

    function handleSelectType(name) {
        setSelectedNamePhieu(name);
        setSelectedDetail(null);
    }

    function handleCheckboxChange(code, checked) {
        setSelectedPhieuCodes(prev =>
            checked ? [...prev, code] : prev.filter(item => item !== code)
        );
    }
    return (
        <>
            <Modal
                title={`Thêm phiếu liên quan`}
                open={isOpenPhieuLQ}
                onCancel={() => {
                    setIsOpenPhieuLQ(false)
                }}
                onOk={() => {
                }}
                centered
                width={1400}
                footer={null}

            >
                {selectedPhieuCodes.length > 0 &&
                    <>
                        Các phiếu đang chọn: <i>{selectedPhieuCodes.toString()}</i>
                        <button onClick={()=> {setSelectedPhieuCodes([])}}>Bỏ chọn toàn bộ</button>
                    </>
                }

                <div className={css.container}>
                    <div className={css.left}>
                        {LIST_PHIEU_TYPE.map((item, index) => (
                            <div className={selectedNamePhieu === item.name ? css.selectedItem : ''} onClick={() => handleSelectType(item.name)}>{item.name}</div>
                        ))}
                    </div>
                    {selectedNamePhieu &&
                        <div className={css.right}>
                            <div className={css.list}>
                                <h3>Danh sách phiếu</h3>
                                <div className={css.listPhieu}>
                                    {selectedListPhieu && selectedTypePhieu && selectedListPhieu.map((item) => (
                                        <div key={item.id_card_create} className={css.item}>
                                            <Checkbox
                                                onChange={(e) => handleCheckboxChange(item[selectedTypePhieu.code], e.target.checked)}
                                                checked={selectedPhieuCodes.includes(item[selectedTypePhieu.code])}
                                            />
                                            <span
                                                className={selectedIdCardDetail === item.id_card_create ? css.selectedItem : ''}
                                                onClick={() => setSelectedIdCardDetail(item.id_card_create)}
                                            >
                                                {item[selectedTypePhieu.code]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={css.detail}>
                                {selectedDetail && selectedTypePhieu?.detailComponent && (
                                    <div className={css.detailView}>
                                        <selectedTypePhieu.detailComponent phieu={selectedDetail}/>
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                </div>
            </Modal>
        </>
    )
}

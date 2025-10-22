import {Modal} from "antd";
import React, {useEffect, useState} from "react";
import {
    CODE_DH, CODE_DNM,
    CODE_HD, CODE_PKT,
    decodePhieu,
    decodeTypePhieu, findDetailByType,
    findFunctionDetailByType
} from "../../../../../generalFunction/genCode/genCode.js";
import DKProDataView from "../../../AgridTable/SoLieu/DinhKhoanTongHop/DKProDataView.jsx";

export default function PhieuLQView({selectedPhieuLQ, setSelectedPhieuLQ}) {
    const [viewDetail, setViewDetail] = useState(null);
    const [phieu, setPhieu] = useState(null);

    async function loadData() {
        let type = decodeTypePhieu(selectedPhieuLQ);
        let id = decodePhieu(selectedPhieuLQ);
        if (type && id) {
            let findPhieu = findFunctionDetailByType(type);
            setViewDetail({view: findDetailByType(type)});
            let phieus;
            if (type.startsWith(CODE_HD) ) {
                phieus = await findPhieu(selectedPhieuLQ);
                setPhieu(phieus[0])
            } else if (type.startsWith(CODE_DH) || type.startsWith(CODE_DNM)) {
                phieus = await findPhieu((selectedPhieuLQ));
                setPhieu(phieus)
            } else if (type === CODE_PKT){
                setViewDetail({view: DKProDataView});
                setPhieu(selectedPhieuLQ)
            } else {
                phieus = await findPhieu('P' + id);
                setPhieu(phieus[0])
            }

        }
    }

    useEffect(() => {
        loadData().then()
    }, [selectedPhieuLQ]);
    return (
        <>
            <Modal
                title={`Xem phiếu ${selectedPhieuLQ}`}
                open={true}
                onCancel={() => {
                    setSelectedPhieuLQ(null)
                }}
                onOk={() => {
                }}
                centered
                width={1000}
                footer={null}
            >
                {viewDetail && phieu && <viewDetail.view phieu={phieu} />}
            </Modal>
        </>
    )
}

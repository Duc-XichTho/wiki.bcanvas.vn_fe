
import Kmf from "../DanhMuc/Kmf.jsx";
import Unit from "../DanhMuc/Unit.jsx";
import Product from "../DanhMuc/Product.jsx";
import Kenh from "../DanhMuc/Kenh.jsx";
import Project from "../DanhMuc/Project.jsx";
import Kmns from "../DanhMuc/Kmns.jsx";
import {Button, Modal} from "antd";

const DanhMucPopUpDiaglog = ({open, onClose, view, type}) => {

    return (
        <Modal
            open={open}
            onCancel={onClose}
            centered
            footer={[
                <Button key="close" onClick={onClose} style={{ fontSize: 15 }}>
                    Đóng
                </Button>
            ]}
            width="85%" // Tương đương maxWidth="xl"
            styles={{ body: { maxHeight: "80vh", overflowY: "auto" } }} // Đảm bảo nội dung có thể cuộn nếu dài

        >
            <div style={{padding : '20px'}}>
                {view === "KMF" && <Kmf company={"HQ"} type={type} />}
                {view === "DonVi" && <Unit company={"HQ"} type={type} />}
                {view === "SanPham" && <Product company={"HQ"} type={type} />}
                {view === "Kenh" && <Kenh company={"HQ"} type={type} />}
                {view === "Vuviec" && <Project company={"HQ"} type={type} />}
                {view === "KMNS" && <Kmns company={"HQ"} type={type} />}
            </div>
            {/* Nội dung Modal */}

        </Modal>
    );
};

export default DanhMucPopUpDiaglog;

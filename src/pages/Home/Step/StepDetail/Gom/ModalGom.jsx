import {Modal} from "antd";

export function ModalGom({isOpen, close, step}) {
    function handleGom() {

    }
    return (
        <>
            <Modal
                title="Gom"
                open={isOpen}
                onOk={handleGom}
                onCancel={close}
                okText="Tạo"
                cancelText="Hủy"
            >

            </Modal>
        </>
    )
}

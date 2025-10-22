import './popUpUploadFile.css'
import {useEffect, useState} from "react";
import {LiaCloudUploadAltSolid} from "react-icons/lia";
import UploadFileDialog from "./UploadFileDialog.jsx";
import {getAllFile} from "../../apis/fileService.jsx";
import {Input} from "antd";

export default function PopUpUploadFile({onGridReady, ...props }) {
    const [isDialogShow, setIsDialogShow] = useState(false);
    const [length, setLenght]=useState(0)
    function getDetails() {
        getAllFile().then((data) => {
            let row = data.filter((e) => e.table == props.table && e.table_id == props.id);
            setLenght(row.length);
        });
    }

    useEffect(() => {
     getDetails()
    }, [length, isDialogShow, props]);
    function handleClick() {
        setIsDialogShow(true)
    }

    const handleDialogClose = () => {
        setIsDialogShow(false);

        onGridReady()
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            position: 'relative',
        }}>
            <Input
                onClick={handleClick}
                type="text"
                readOnly={true}
                value={length > 0 ? `${length}` : "-"}
                placeholder="Chọn tệp để tải lên"
                style={{flexGrow: 1, marginRight: '10px', cursor: 'pointer'}} // Adjust margin and flex
            />
            <button
                onClick={handleClick}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'absolute',
                    right: '20px',
                }}
                title={'Tải lên'}
            >
                <LiaCloudUploadAltSolid size={20} color={"#454545"}/>
            </button>
            <UploadFileDialog
                open={isDialogShow}
                onClose={handleDialogClose}
                id={props.id}
                table={props.table}
                onGridReady={props.onGridReady}
                card={props.card}
            />
        </div>
    );
}

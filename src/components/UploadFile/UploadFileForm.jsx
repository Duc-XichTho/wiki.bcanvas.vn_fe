import {useState} from "react";
import {LiaCloudUploadAltSolid} from "react-icons/lia";
import UploadFileFormDialog from "./UploadFileFormDialog.jsx";

const UploadFileForm = (props) => {
    const [isDialogShow, setIsDialogShow] = useState(false);

    function handleClick() {
        setIsDialogShow(true)
    }

    const handleDialogClose = () => {
        setIsDialogShow(false);
    };

            return (
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%'
                }}>
                    <button
                        onClick={() => handleClick()}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        aria-label="Add"
                    >Tải lên
                        <LiaCloudUploadAltSolid size={25} style={{marginLeft: 5}}/>
                    </button>

                    <UploadFileFormDialog
                        open={isDialogShow}
                        onClose={handleDialogClose}
                        id={props.id}
                        table={props.table}
                        style={{fontSize: 15}}
                        onGridReady={props.onGridReady}
                    />

                </div>

            )
};

export default UploadFileForm;

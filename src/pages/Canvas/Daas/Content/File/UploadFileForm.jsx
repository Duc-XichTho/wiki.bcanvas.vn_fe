import React, {useState} from "react";
import UploadFileFormDialog from "./UploadFileFormDialog.jsx";
import css from "../Content.module.css";
import { GDRIVE_ICON, Upload_Icon } from '../../../../../icon/svg/IconSvg.jsx';
import { Dialog, DialogTitle, DialogContent, DialogActions} from "@mui/material";
import { Button, Input } from "antd"
import { uploadFileService } from '../../../../../apis/uploadFileService.jsx';
import { createTimestamp } from '../../../../../generalFunction/format.js';
import { updateFileNotePad } from '../../../../../apis/fileNotePadService.jsx';
import { createFileChild } from '../../../../../apis/fileChildService.jsx';
import { uploadFiles } from '../../../../../apisKTQT/uploadImageWikiNoteService.jsx';
import { n8nWebhookV2 } from '../../../../../apis/n8nWebhook.jsx';
import { getCurrentUserLogin } from '../../../../../apis/userService.jsx';

const UploadFileForm = (props) => {
    const [isDialogShow, setIsDialogShow] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [googleDriveUrl, setGoogleDriveUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [linkLoading, setLinkLoading] = useState(false);
    function handleClick() {
        setIsDialogShow(true)
    }
    function handleLinkClick() {
        setIsLinkModalOpen(true);
    }
    const handleDialogClose = () => {
        setIsDialogShow(false);
    };
    const handleLinkModalClose = () => {
        setIsLinkModalOpen(false);
        setGoogleDriveUrl("");
        setFileName("");
    };

    const handleLinkSubmit = async () => {
        setLinkLoading(true);
        try {
            const n8nResponse = await n8nWebhookV2(googleDriveUrl);
            function base64ToUint8Array(base64) {
                const binaryString = atob(base64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes;
            }

            function cleanBase64(str) {
                // Remove leading/trailing quotes if present
                return str.replace(/^"+|"+$/g, '');
            }

            // Helper to get extension from MIME type
            function getExtensionFromMimeType(mimeType) {
                const map = {
                    'application/pdf': 'pdf',
                    'application/msword': 'doc',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                    'application/vnd.ms-excel': 'xls',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
                    'image/png': 'png',
                    'image/jpeg': 'jpg',
                    'image/gif': 'gif',
                    'text/plain': 'txt',
                    'text/csv': 'csv',
                };
                return map[mimeType] || '';
            }

            function ensureFileNameWithExtension(fileName, mimeType) {
                if (/\.[a-z0-9]+$/i.test(fileName)) return fileName;
                const ext = getExtensionFromMimeType(mimeType);
                return ext ? `${fileName}.${ext}` : fileName;
            }

// Usage
            const contentType = n8nResponse.n8nResponse.headers['content-type'] || 'application/octet-stream';
            const base64 = cleanBase64(n8nResponse.n8nResponse.data);
            const bytes = base64ToUint8Array(base64);
            const blob = new Blob([bytes], { type: contentType });
            const finalFileName = ensureFileNameWithExtension(fileName || 'file', contentType);
            const fileObj = new File([blob], finalFileName, { type: contentType });
            let res = await uploadFiles([fileObj]);
            const type = res.files[0].fileName.split('.').pop();
            const { data, error } = await getCurrentUserLogin();
            let fileData = {
                id: props.id,
                updated_at : createTimestamp() ,
                user_update: data.email
            };
            const fileChild = {
                name: res.files[0].fileName,
                url: res.files[0].fileUrl,
                type: type,
                table: props.table,
                table_id: props.id,
                updated_at : createTimestamp() ,
                user_update: data.email
            }
            await Promise.all([
                updateFileNotePad(fileData),
                createFileChild(fileChild)
            ]);
            if (props.onGridReady) {
                props.onGridReady();
            }
        } catch (error) {
            console.error("POST error:", error);
        }
        setLinkLoading(false);
        setIsLinkModalOpen(false);
        setGoogleDriveUrl("");
    };

    function extractGoogleDriveFileId(url) {
        const regex = /(?:\/d\/|id=|\/file\/d\/|open\?id=)([a-zA-Z0-9_-]{10,})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    return (
        <>
            <div style={{display: 'flex', gap: 8}}>
            <div className={css.add} onClick={() => handleClick()}>
                <Upload_Icon />
                <span>+ Upload</span>
            </div>

            <div className={css.add} onClick={handleLinkClick}>
                <span>Kết nối</span>
                <GDRIVE_ICON style={{width: 18, height: 18}}/>
            </div>
            </div>

            <UploadFileFormDialog
                open={isDialogShow}
                onClose={handleDialogClose}
                id={props.id}
                table={props.table}
                style={{fontSize: 15}}
                onGridReady={props.onGridReady}
            />
            <Dialog open={isLinkModalOpen} onClose={handleLinkModalClose}>
                <DialogTitle>Nhập File bằng đường dẫn Google Drive</DialogTitle>
                <DialogContent>
                    <Input
                        autoFocus
                        placeholder="Nhập tên file"
                        value={fileName}
                        onChange={e => setFileName(e.target.value)}
                        style={{ width: "100%", marginBottom: 16 }}
                    />
                    <Input
                        placeholder="Dán link Google Drive"
                        value={googleDriveUrl}
                        onChange={e => setGoogleDriveUrl(e.target.value)}
                        style={{ width: "100%", marginTop: 8 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleLinkModalClose} disabled={linkLoading}>Cancel</Button>
                    <Button
                        onClick={handleLinkSubmit}
                        disabled={!googleDriveUrl || linkLoading}
                        variant="contained"
                    >
                        {linkLoading ? "Loading..." : "OK"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>


    )
};

export default UploadFileForm;

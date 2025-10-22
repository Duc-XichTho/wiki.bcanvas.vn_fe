import {toast} from "react-toastify";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import {LinearProgress, Paper} from "@mui/material";
import {CgCloseR} from "react-icons/cg";
import IconButton from "@mui/material/IconButton";
import UploadIcon from "@mui/icons-material/Upload";
import Button from "@mui/material/Button";
import React, {useContext, useState} from "react";
import Typography from "@mui/material/Typography";
import {Input} from "antd";
import {MyContext} from "../../../MyContext.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {uploadFileService} from "../../../apis/uploadFileService.jsx";
import {createTimestamp} from "../../../generalFunction/format.js";
import {updateFileNotePad} from "../../../apis/fileNotePadService.jsx";
import {createNewFile} from "../../../apis/fileService.jsx";
import {uploadFiles} from "../../../apisKTQT/uploadImageWikiNoteService.jsx";

export default function UploadFilePWS({ onClose, table, id, onGridReady }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const {loadData, setLoadData} = useContext(MyContext)

    const handleFileChange = (event) => {
        setSelectedFiles(event.target.files);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        setSelectedFiles(event.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            // toast.warning("Vui lòng chọn file để upload.");
            return;
        }

        const totalFiles = selectedFiles.length; // Total number of files
        let filesSaved = 0; // Track the number of files successfully saved

        try {
            for (let file of selectedFiles) {
                const { data, error } = await getCurrentUserLogin();
                const response = await uploadFiles([file]);
                const type = response.files[0].fileName.split('.').pop();
                let fileData = {
                    name: response.files[0].fileName,
                    url: response.files[0].fileUrl,
                    type: type,
                    table: table,
                    table_id: id,
                };

                // Save file data to DB
                await createNewFile(fileData);
                setLoadData(!loadData)
                // Increment the count of successfully saved files
                filesSaved += 1;

                // Update the upload progress based on saved files
                const totalProgress = Math.round((filesSaved / totalFiles) * 100);
                setUploadProgress(totalProgress);
            }

            await onGridReady();
            await onClose();
            toast.success("Tất cả các file đã được upload và lưu thành công!");
        } catch (error) {
            toast.error("Lỗi khi upload hoặc lưu file:", error);
        } finally {
            setSelectedFiles([]);
            setUploadProgress(0);
        }
    };

    return (
        <Box
            className="upload-popup-container"
            display="flex"
            justifyContent="center"
            alignItems="center"
        >
            <Paper className="upload-popup" elevation={3} sx={{ p: 3, width: 400 }}>
                <Box
                    className="header-popup"
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                >
                    <Typography variant="h6">Upload File</Typography>
                    <IconButton onClick={onClose}>
                        <CgCloseR />
                    </IconButton>
                </Box>
                <Grid container spacing={1} display={"flex"}  justifyContent={"center"} alignItems="center" >
                    <Grid item xs={12}>
                        <Box
                            className={`upload-area ${isDragging ? "dragging" : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            sx={{
                                border: "2px dashed gray",
                                borderRadius: 2,
                                p: 3,
                                textAlign: "center",
                                cursor: "pointer",
                                "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                                },
                                width:'340px'
                            }}
                        >
                            <UploadIcon fontSize="large" />
                            <Typography variant="body1" mt={2}>
                                Kéo thả file vào đây hoặc
                            </Typography>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<UploadIcon />}
                                sx={{ mt: 2 }}
                            >
                                Chọn File
                                 {/*<Input style={{display:'none'}} type="file" accept="*"  onChange={handleFileChange} />  chọn 1 file*/}
                                <Input style={{display:'none'}} type="file" accept="*" multiple onChange={handleFileChange} />{/*chọn nhiều file*/}


                            </Button>
                            {selectedFiles.length > 0 && (
                                <Grid item xs={12}>
                                    <Box mt={2} sx={{ width: "100%" }}>
                                        {Array.from(selectedFiles).map((file) => (
                                            <Typography key={file.name} variant="body2">
                                                {file.name}
                                            </Typography>
                                        ))}
                                    </Box>

                                </Grid>
                            )}
                        </Box>

                    </Grid>
                    {uploadProgress > 0 ? (
                    <Box  sx={{ width: "340px" }}>
                        <Typography variant="body2" align="center" mt={1}>
                            {`${uploadProgress}%`}
                        </Typography>
                        <LinearProgress className={'progress-bar-upload'}
                        variant="determinate"
                        value={uploadProgress}
                        sx={{ height: "1em" }}
                    />
                    </Box>
                    ):(
                        <Box  sx={{ width: "340px" }}>
                            <Typography variant="body2" align="center" mt={1}>
                            </Typography>
                           <Box  sx={{ height: "2em" }}></Box>
                        </Box>
                    )}

                </Grid>


                <Grid item xs={12} mt={1}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0}
                        fullWidth
                        sx={{ py: 2 }}
                    >
                        Upload
                    </Button>
                </Grid>
            </Paper>
        </Box>
    );
}

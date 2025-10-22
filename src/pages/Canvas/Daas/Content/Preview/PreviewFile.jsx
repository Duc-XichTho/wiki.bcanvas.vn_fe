import PropTypes from 'prop-types';
import css from './PreviewComponent.module.css';  // Import CSS module
import DocViewer, {DocViewerRenderers} from "react-doc-viewer";
import {useParams} from "react-router-dom";
import {getAllFileChild, getFileChildDataById} from "../../../../../apis/fileChildService.jsx";
import React, {useEffect, useState} from "react";
import ActionDisplayRichNoteSwitch from "../../../../KeToanQuanTri/ActionButton/ActionDisplayRichNoteSwitch.jsx";
import RichNoteKTQTRI from "../../../../Home/SelectComponent/RichNoteKTQTRI.jsx";
import {Button} from "antd";

const PreviewFile = () => {
    const [data, setData] = useState()
    const {idFile} = useParams()
    const [isShowInfo, setIsShowInfo] = useState(false);
    const handleShowInfo = () => {
        setIsShowInfo(prevState => !prevState);
    };
    const fetchDataFileChild = async () => {
        try {
            const value = await getFileChildDataById(idFile);
            if (value?.id) {
                if (value.url) {
                    value.url = encodeURI(value.url);
                }

                setData(value);
            }
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu file con:", error);
        }
    };

    useEffect(() => {
        if (idFile) {
            fetchDataFileChild();
        }
        setIsShowInfo(false)
    }, [idFile]);


    if (!data || !data.type) return null;

    const imgTypes = ["jpg", "png", "svg", "jpeg", "gif"];
    const isImage = imgTypes.some(type => data.type.includes(type));
    const docTypes = ["doc", "docx", 'xls', 'xlsx', "txt", "csv"];
    const isDoc = docTypes.some(type => data.type.includes(type));
    const isPDF = data.type.includes("pdf");
    const isEncoded = (str) => {
        // Kiểm tra các ký tự bất thường hoặc mã hóa đặc biệt
        return /%[0-9A-F]{2}|\\x[0-9A-F]{2}|Ã|Â|Â|¼|½|¾|¿/.test(str);
    };

    const fixEncoding = (str) => {
        if (!isEncoded(str)) return str; // Nếu không bị mã hóa thì trả về nguyên bản

        try {
            const bytes = new Uint8Array([...str].map(char => char.charCodeAt(0)));
            const decoded = new TextDecoder('utf-8').decode(bytes);
            return decoded;
        } catch {
            return str;
        }
    };

    // const handleDownload = (url, fileName, isPDF) => {
    //     if (isPDF) {
    //         window.open(url, '_blank');
    //         return;
    //     }
    //
    //     const link = document.createElement("a");
    //     link.href = url;
    //     link.download = fileName || 'downloaded_file';
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link);
    // };

    const handleDownload = async (url, fileName , ) => {
        try {
            const response = await fetch(url, {
                mode: 'cors',
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    return (
        <div className={css.previewBody}>
            <div className={css.header}>
                <span>
                    {/*{fixEncoding(data?.name)}*/}
                </span>
                <div className={css.headerRight}>
                    <Button
                        onClick={() => handleDownload(data.url, fixEncoding(data.name), isPDF)}
                    >
                        Tải về
                    </Button>
                    <ActionDisplayRichNoteSwitch isChecked={isShowInfo} onChange={handleShowInfo}/>
                </div>

            </div>
            <div className={css.content}>
                {isShowInfo &&
                    <div style={{width: '100%', height: 'max-content', boxSizing: "border-box" , marginBottom : '10px'}}>
                        <RichNoteKTQTRI table={`${idFile}_Canvas_file`}/>
                    </div>}
                {isImage && <img src={data.url} alt={data.name} className={css.previewImage}/>}
                {isPDF && <iframe src={data.url} className={css.previewPdf} title={fixEncoding(data.name)}></iframe>}
                {/*{isDoc && (*/}
                {/*    <div className={css.previewDoc}>*/}
                {/*        <DocViewer*/}
                {/*            documents={[{uri: data.url, fileType: 'docx'}]}*/}
                {/*            pluginRenderers={DocViewerRenderers}*/}
                {/*        />*/}
                {/*    </div>*/}
                {/*)}*/}
                {!isImage && !isPDF && (
                    <div className={css.previewDefault}>
                        <p> Preview không khả dụng.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

PreviewFile.propTypes = {
    data: PropTypes.object.isRequired,
};

export default PreviewFile;

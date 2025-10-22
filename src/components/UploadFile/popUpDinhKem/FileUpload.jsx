import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
// Ag Grid LogicFunction
import {AgGridReact} from 'ag-grid-react';
import {toast} from 'react-toastify';
import '../../../pages/Home/AgridTable/agComponent.css';
import {FaRegEye} from 'react-icons/fa';
import {IoCloudDownloadOutline} from 'react-icons/io5';
import JSZip from 'jszip';
import axios from 'axios';
import {PiDownloadLight} from 'react-icons/pi';
import PreviewComponent from "./PreviewComponent.jsx";
import UploadFileForm from "../UploadFileForm.jsx";
import {saveAs} from 'file-saver';

import PopupDeleteAgrid from "../../../pages/Home/popUpDelete/popUpDeleteAgrid.jsx";
import {getAllFile} from "../../../apis/fileService.jsx";
import AG_GRID_LOCALE_VN from "../../../pages/Home/AgridTable/locale.jsx";

export default function FileUpload(props) {
    const table = 'File-Upload'
    const gridRef = useRef();
    const [rowData, setRowData] = useState([]);
    const [colDefs, setColDefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewData, setPreviewData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const defaultColDef = useMemo(() => {
        return {
            editable: true,
            filter: false,
            suppressMenu: true,
            cellStyle: {fontSize: '14.5px'},
        };
    });

    const onGridReady = useCallback(async () => {
        getAllFile().then((data) => {
            let row = data.filter((e) => e.table.includes(props.table) && e.table_id == props.id);
            setRowData(row);
        });
    }, []);

    useEffect(() => {
        setLoading(true)
        getAllFile().then((data) => {
            let row = data.filter((e) => e.table.includes(props.table) && e.table_id == props.id);
            setRowData(row);
            setLoading(false)
        });
    }, [props.id]);
    const handlePreview = (data) => {
        setPreviewData(data);
        setShowPreview(true);
    };
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(false);
                setColDefs([
                    {
                        field: 'id',
                        headerName: 'STT',
                        hide: true,
                    },
                    {
                        field: 'name',
                        headerName: 'Tên file',
                        width: 625,
                        editable: false,
                    },
                    {
                        field: 'download',
                        headerName: 'Tải xuống',
                        cellStyle: {textAlign: 'center'},
                        width: 90,
                        editable: false,
                        cellRenderer: (params) => {
                            return (
                                <button
                                    onClick={() => handleDownload(params.data)}
                                    style={{cursor: 'pointer', fontSize: '14.5px', background: 'none'}}
                                >
                                    <IoCloudDownloadOutline/>
                                </button>
                            );
                        },
                    },

                    {
                        field: 'preview',
                        headerName: 'Xem trước',
                        cellStyle: {textAlign: 'center'},
                        width: 95,
                        cellRenderer: (params) => {
                            return (
                                <button
                                    onClick={() => handlePreview(params.data)}
                                    style={{cursor: 'pointer', fontSize: '14.5px', background: 'none'}}
                                >
                                    <FaRegEye/>
                                </button>
                            );
                        },
                        editable: false,
                    },
                    {
                        pinned: 'right',
                        width: '50',
                        field: 'action',
                        suppressHeaderMenuButton: true,
                        cellStyle: {alignItems: "center", display: "flex"},
                        headerName: '',
                        maxWidth: 50,
                        cellRenderer: (params) => {
                            if (!params.data || !params.data.id) {
                                return null;
                            }
                            return (
                                <PopupDeleteAgrid {...params.data}
                                                  id={params.data.id}
                                                  table={table}
                                                  reload={onGridReady}
                                                  card={props.card}
                                />

                            );
                        },
                        editable: false,
                    },
                ]);
            } catch (error) {
               console.log(error)
            }
        };
        fetchData();
    }, [onGridReady]);

    const handleDownload = async (data) => {
        try {
            const response = await fetch(data.url, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();

            saveAs(blob, data.name);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download failed!');
        }
    };

    const handleDownloadAll = async () => {
        try {
            const zip = new JSZip();
            const downloadPromises = rowData.map(async (file) => {
                const response = await axios.get(file.url, {responseType: 'blob'});
                zip.file(file.name, response.data);
            });

            await Promise.all(downloadPromises);
            const content = await zip.generateAsync({type: 'blob'});
            saveAs(content, `${props.table}.zip`);
        } catch (error) {
            console.error('Download all error:', error);
            toast.error('Download all files failed!');
        }
    };
    return (
        <>
            <div>
                <div className={'header-powersheet'}
                     style={{display: 'flex', justifyContent: 'end', alignItems: 'center'}}>
                    <div style={{display: 'flex', gap: '10px', marginRight: '30px'}}>
                        <button
                            onClick={handleDownloadAll}
                            style={{background: 'none', display: 'flex', justifyContent: 'space-between'}}
                        >
                            Tải xuống toàn bộ
                            <PiDownloadLight style={{fontSize: 20, marginLeft: '5px'}}/>
                        </button>
                    </div>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <UploadFileForm
                            id={props.id}
                            table={props.table}
                            style={{fontSize: 15}}
                            onGridReady={onGridReady}

                        />
                    </div>
                </div>
                <div
                    style={{
                        height: '40vh',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        marginTop: '15px',
                    }}
                >
                    {loading && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                position: 'absolute',
                                width: '100%',
                                zIndex: '1000',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            }}
                        >
                            <img src={'1'} alt="Loading..." style={{width: '70px', height: '70px'}}/>
                        </div>
                    )}
                    <div className="ag-theme-quartz" style={{height: '100%', width: '100%'}}>
                        <AgGridReact
                            ref={gridRef}
                            rowData={rowData}
                            defaultColDef={defaultColDef}
                            columnDefs={colDefs}
                            rowSelection="multiple"
                            animateRows={true}
                            paginationPageSizeSelector={[500, 1000, 2000, 3000, 5000]}
                            localeText={AG_GRID_LOCALE_VN}
                            onGridReady={onGridReady}
                        />
                    </div>
                </div>
                {showPreview && <PreviewComponent data={previewData} onClose={() => setShowPreview(false)}/>}
            </div>
        </>
    );
}

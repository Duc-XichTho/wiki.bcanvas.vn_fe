import PropTypes from 'prop-types';
import './PreviewComponent.css';
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";

const PreviewComponent = ({ data, onClose }) => {
    if (!data) return null;

    const imgTypes = ["jpg", "png", "svg", "jpeg", "gif"];
    const isImage = imgTypes.some(type => data.type.includes(type));
    const docTypes = ["doc", "docx",'xls', 'xlsx',"txt","csv"];
    const isDoc = docTypes.some(type => data.type.includes(type));
    const isPDF = data.type.includes("pdf");

    return (
        <div className="preview-modal">
            <div className="preview-modal-content">
                <span className="preview-close" onClick={onClose}>&times;</span>
                <h2>Preview</h2>
                <div className="preview-body">
                    {isImage && <img src={data.url} alt={data.name} className="preview-image"/>}
                    {isPDF && <iframe src={data.url} className="preview-pdf" title={data.name}></iframe>}
                    {isDoc && (
                        <div className="preview-doc">
                            <DocViewer
                                documents={[{uri: data.url, fileType: 'docx'}]}
                                pluginRenderers={DocViewerRenderers}
                            />
                        </div>
                    )}
                    {!isImage && !isPDF && !isDoc && (
                        <div className="preview-default">
                            <p>Định dạng tệp tin không hỗ trợ việc xem trước.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

PreviewComponent.propTypes = {
    data: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default PreviewComponent;

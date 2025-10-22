import PropTypes from 'prop-types';
import css from './PreviewComponent.module.css';  // Import CSS module
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";

const PreviewFile = ({ data }) => {
    if (!data || !data.type) return null;

    const imgTypes = ["jpg", "png", "svg", "jpeg", "gif"];
    const isImage = imgTypes.some(type => data.type.includes(type));
    const docTypes = ["doc", "docx", 'xls', 'xlsx', "txt", "csv"];
    const isDoc = docTypes.some(type => data.type.includes(type));
    const isPDF = data.type.includes("pdf");

    return (
        <div className={css.previewBody}>
            {isImage && <img src={data.url} alt={data.name} className={css.previewImage} />}
            {isPDF && <iframe src={data.url} className={css.previewPdf} title={data.name}></iframe>}
            {isDoc && (
                <div className={css.previewDoc}>
                    <DocViewer
                        className={css.docContent}
                        documents={[{ uri: data.url, fileType: 'docx' }]}
                        pluginRenderers={DocViewerRenderers}
                    />
                </div>
            )}
            {!isImage && !isPDF && !isDoc && (
                <div className={css.previewDefault}>
                    <p>Định dạng tệp tin không hỗ trợ việc xem trước.</p>
                </div>
            )}
        </div>
    );
};

PreviewFile.propTypes = {
    data: PropTypes.object.isRequired,
};

export default PreviewFile;

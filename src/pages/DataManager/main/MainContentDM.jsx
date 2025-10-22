import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import ShowData from "./tableData/ShowData";

const MainContentDM = () => {
    const { idFileNote, stepId } = useParams();
    const location = useLocation();
    const [path, setPath] = useState(location.pathname);
// templateId -> timestamp
    
    useEffect(() => {
        if (location.pathname.includes('data-manager/data')) {
            setPath('Table');
        } else if (location.pathname.includes('data-manager/file')) {
            setPath('File');
        }
    }, [idFileNote, location]);

    // No socket handling here; moved to HeaderDM.jsx

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'center', marginTop: 20   }}>
            <div style={{ width: '95%', height: 'calc(100% - 150px)' }}>
                {path === 'Table' && idFileNote && <ShowData idFileNote={idFileNote} stepId={stepId} />}
            </div>
        </div>
    );
};

export default MainContentDM;

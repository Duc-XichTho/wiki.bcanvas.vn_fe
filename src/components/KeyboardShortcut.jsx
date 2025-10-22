import {useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';

const KeyboardShortcut = () => {
    const {buSelect, companySelect} = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e) => {
            const tagName = e.target.tagName.toLowerCase();
            if (tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable) {
                return;
            }

            // Phím tắt cho các trang
            /* Comment lại code cũ để sau này có thể dùng lại
            if (e.shiftKey && e.code === 'Digit1') {
                navigate('/canvas');
            }
            else if (e.shiftKey && e.code === 'Digit2') {
                navigate(`/canvas/${companySelect}/${buSelect}/ke-toan-quan-tri`);
            }
            else if (e.shiftKey && e.code === 'Digit3') {
                navigate(`/canvas/${companySelect}/${buSelect}/cong-cu/project-manager`);
            }
            else if (e.shiftKey && e.code === 'Digit8') {
                window.open('https://sab.io.vn', '_blank');
            } else if (e.shiftKey && e.code === 'Digit9') {
                navigate('/admin');
            }else if (e.shiftKey && e.code === 'Digit5') {
                navigate('/gateway');
            }
            */

            // Phím tắt navigation
            if (e.shiftKey && e.code === 'Digit1') {
                navigate('/data-manager');
            }
            else if (e.shiftKey && e.code === 'Digit2') {
                navigate(`/analysis-review`);
            }
            else if (e.shiftKey && e.code === 'Digit3') {
                navigate(`/fdr`);
            }
            else if (e.shiftKey && e.code === 'Digit9') {
                navigate('/process-guide');
            }
            

            else if (e.shiftKey && e.code === 'KeyA') {
                window.dispatchEvent(new CustomEvent('addFile'));
            }
            else if (e.shiftKey && e.code === 'KeyN') {
                window.dispatchEvent(new CustomEvent('openCreateModal'));
            }
            else if (e.shiftKey && e.code === 'KeyF') {
                // Focus vào ô tìm kiếm
                window.dispatchEvent(new CustomEvent('focusSearch'));
            }
            else if (e.shiftKey && e.code === 'KeyP') {
                // Mở modal Add Step trong PipelineSteps
                window.dispatchEvent(new CustomEvent('openAddStepModal'));
            }
            
            // ALT + số để chuyển tab trong Analysis Review
            else if (e.altKey && e.code === 'Digit1') {
                // Chuyển đến tab Data
                window.dispatchEvent(new CustomEvent('switchTab', { detail: 'data' }));
            }
            else if (e.altKey && e.code === 'Digit2') {
                // Chuyển đến tab Statistics
                window.dispatchEvent(new CustomEvent('switchTab', { detail: 'statistics' }));
            }
            else if (e.altKey && e.code === 'Digit3') {
                // Chuyển đến tab Dashboard
                window.dispatchEvent(new CustomEvent('switchTab', { detail: 'business' }));
            }
            else if (e.altKey && e.code === 'Digit4') {
                // Chuyển đến tab Table Analytics
                window.dispatchEvent(new CustomEvent('switchTab', { detail: 'table-report' }));
            }
   
   
        };
            window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [navigate]);


    return null;
};

export default KeyboardShortcut;

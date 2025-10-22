import ReactDOM from 'react-dom';

const TooltipPortal = ({ children }) => {
    return ReactDOM.createPortal(
        children,
        document.body // Render tooltip vào body
    );
};

export default TooltipPortal;

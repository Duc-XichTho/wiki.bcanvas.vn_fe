import ReactDOM from 'react-dom';

const TooltipHeaderPortal = ({ children }) => {
    return ReactDOM.createPortal(
        children,
        document.body
    );
};

export default TooltipHeaderPortal;

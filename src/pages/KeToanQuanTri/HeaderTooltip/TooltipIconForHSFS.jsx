import './TooltipIcon.css';
import TooltipPortal from './TooltipPortal';
import { GoQuestion } from "react-icons/go";
import { useState } from "react";

const financialRatios = [
    { header: 'Hệ số thanh khoản', description: 'Chỉ số thanh khoản (liquidity ratio) hay hệ số khả năng thanh toán nợ ngắn hạn là một nhóm những chỉ số giúp cho nhà quản trị đo lường được khả năng thanh toán nghĩa vụ tài chính ngắn hạn trong vòng một năm của doanh nghiệp mà không cần huy động vốn ở bên ngoài.' },
    { header: 'Tỷ số thanh toán nhanh', description: 'Tỷ số thanh toán nhanh là một thước đo cho thấy khả năng của doanh nghiệp trong việc thanh toán các khoản nợ ngắn hạn bằng những tài sản có thể nhanh chóng chuyển đổi thành tiền mặt...' },
    { header: 'Tỷ số vốn ngắn hạn/ nợ ngắn hạn', description: 'Đánh giá khả năng của doanh nghiệp sử dụng vốn ngắn hạn để trả nợ ngắn hạn. (Cao hơn là an toàn hơn)' },
    { header: 'Tỷ số nợ', description: 'Tỷ số nợ là một thước đo cho thấy mức độ phụ thuộc của doanh nghiệp vào nguồn vốn vay để hoạt động...' },
    { header: 'Vòng quay tài sản', description: 'Đo lường hiệu quả sử dụng tài sản để tạo ra doanh thu...' },
    { header: 'Ngày phải thu công nợ', description: 'Thời gian trung bình để thu được tiền từ khách hàng từ khi xuất hóa đơn tới khi nhận tiền (Thấp hơn là tốt hơn)' },
    { header: 'Ngày phải trả công nợ', description: 'Thời gian trung bình để trả tiền cho nhà cung cấp (Cao hơn là tốt hơn)' },
    { header: 'Hệ số hiệu quả sinh lời', description: 'Gồm các nhóm chỉ số cung cấp thông tin về khả năng sinh lời từ hoạt động kinh doanh của doanh nghiệp...' },
    { header: 'Tỷ suất lãi gộp', description: 'Tỷ suất lãi gộp là thước đo hiệu quả hoạt động kinh doanh cốt lõi của một doanh nghiệp...' },
    { header: 'Tỷ suất lãi ròng', description: 'Tỷ suất lãi ròng là thước đo hiệu quả hoạt động tổng thể của doanh nghiệp...' },
    { header: 'Operation margin', description: 'Tỷ số Operation margin (biên lợi nhuận hoạt động) là một thước đo cho thấy hiệu quả hoạt động cốt lõi của một doanh nghiệp...' },
    { header: 'EBITDA Margin', description: 'EBITDA (Lợi nhuận trước thuế, lãi vay, khấu hao) là 1 con số được ưa chuộng khi đánh giá kết quả kinh doanh của doanh nghiệp vì nó thể hiện được khả năng tạo ra dòng tiền...' },
    { header: 'Tỷ trọng biến phí định phí', description: 'Tỷ trọng chi phí cố định và chi phí biến đổi cho ta biết cấu trúc chi phí của doanh nghiệp...' },
    { header: 'Chi phí biến đổi', description: 'Chi phí biến đổi là chi phí phát sinh trực tiếp để tạo ra doanh thu...' },
    { header: 'Chi phí cố định', description: 'Chi phí cố định là các chi phí không thể thay đổi tức thời...' }
];

const TooltipIconForHSFS = (props) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState({});

    const handleMouseEnter = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const tooltipData = financialRatios.find(ratio => ratio.header === props.data.header);

        if (tooltipData) {
            setTooltipStyle({
                position: 'absolute',
                top: rect.top - 10,
                left: rect.left + rect.width / 2,
                transform: 'translateX(7%)',
                zIndex: 1000,
                overflowY: 'auto'
            });
            setShowTooltip(true);
        }
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
    };

    const findDescription = (header) => {
        const item = financialRatios.find(ratio => ratio.header === header);
        return item ? item.description : '';
    };

    return (
        <div className="icon-text-container">
            <div>{props.data.header}</div>
            <div
                className="icon"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <GoQuestion />
            </div>
            {showTooltip && (
                <TooltipPortal>
                    <div className="tooltip-2" style={tooltipStyle}>
                        <span>{findDescription(props.data.header)}</span>
                    </div>
                </TooltipPortal>
            )}
        </div>
    );
};

export default TooltipIconForHSFS;

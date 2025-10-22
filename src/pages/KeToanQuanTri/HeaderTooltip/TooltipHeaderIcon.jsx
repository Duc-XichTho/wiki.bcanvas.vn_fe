import './TooltipHeaderIcon.css';
import TooltipHeaderPortal from './TooltipHeaderPortal.js';
import {GoQuestion} from "react-icons/go";
import {useState, useEffect, useContext} from "react";
import {MyContext} from "../../../MyContext.jsx";

const functionsData = [
    {
        table: 'Kmf',
        description: <>
            <p>
                - <strong><i>Điền ‘Phân nhóm (Code)’ </i></strong>: Các giá trị có thể điền (Bắt buộc): <br/> CFTC <br/> MC <br/> FC <br/> VC <br/> DT <br/>
                <br/>
                - <strong><i>Điền ‘Nhóm (Group)’ </i></strong>: <br/> a. Doanh Thu (bắt buộc phải có) <br/> b. Chi Phí <br/> c. Chi phí quản lý <br/> d. Chi phí Bán hàng <br/>…
            </p>
        </>
    },
    {
        table: 'Kmns',
        description: <>
            <p>
                - <strong><i>Điền ‘Mô tả’ </i></strong>: Các giá trị có thể điền: <br/> 1-Thu hoạt động <br/> 3-Chi hoạt động<br/>4-Thu khác <br/> 5-Chi khác <br/>6-Điều chuyển nội bộ <br/> …
                <br/>

            </p>
        </>
    },
    {
        table: 'Unit',
        description: <>
            <p>
                - <strong><i>Điền ‘Nhóm (Group)’ </i></strong>: Đặt tên nhóm cho các đơn vị cùng nhóm. <br/>
                <br/>

            </p>
        </>
    },
    {
        table: 'Product',
        description: <>
            <p>
                - <strong><i>Điền ‘Nhóm (Group)’ </i></strong>: Đặt tên nhóm(Group) cho các sản phẩm cùng nhóm. <br/>
                <br/>

            </p>
        </>
    },
    {
        table: 'Deal',
        description: <>
            <p>
                - <strong><i>Điền ‘Nhóm (Group)’ </i></strong>: Đặt tên nhóm(Group) cho các Deal cùng nhóm <br/>
                <br/>

            </p>
        </>
    },

    {
        table: 'Vendor',
        description: <>
            <p>
                - <strong><i>Điền ‘Nhóm (Group)’ </i></strong>: Đặt tên nhóm(Group) cho các khách hàng  cùng nhóm <br/>
                <br/>

            </p>
        </>
    },

    {
        table: 'SoPhanBoSanPham',
        description: <>
        </>
    },
    {
        table: 'SoPhanBoDonVi',
        description: <>
        </>
    },
    {
        table: 'SoPhanBoDeal',
        description: <>
        </>
    },
];
const TooltipHeaderIcon = ({table}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState({});
    const [lastUpdate, setLastUpdate] = useState(localStorage.getItem('lastUpdateFE'));
    const matchedFunction = functionsData.find(item => item.table === table);
    const date = new Date(lastUpdate);
    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    const handleMouseEnter = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipStyle({
            position: 'absolute',
            top: rect.top - 5,
            left: rect.left - rect.width / 2 ,
            transform: 'translateX(9%)',
            zIndex: 1000,
        });
        setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
    };

    useEffect(() => {
            setLastUpdate(localStorage.getItem('lastUpdateFE'));
    }, [localStorage.getItem('lastUpdateFE')]);

    useEffect(() => {
        const iconElement = document.getElementById(`icon-${table}`);
        if (iconElement) {
            iconElement.style.display = matchedFunction ? 'flex' : 'none';
        }
    }, [table, matchedFunction]);

    // Không hiển thị icon nếu không có matchedFunction
    if (!matchedFunction) {
        return null;
    }

    const updatedDescription = ['SoPhanBoSanPham', 'SoPhanBoDonVi', 'SoPhanBoDeal'].includes(matchedFunction.table)
        ? (
            <p>
                1. Thời gian cập nhật cuối cùng: {formatDate(date)} <br/>
                2. Đảm bảo tất cả cơ chế phân bổ đều có giá trị <br/>
                3. Đảm bảo tổng toàn bộ các cột phân bổ bằng toàn bộ PL Value ở sổ kế toán <br/>
            </p>
        )
        : matchedFunction.description;

    return (
        <div className="icon-container" style={{position: 'relative'}}>
            <div
                id={`icon-${table}`}
                className="icon"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <GoQuestion/>
            </div>
            {showTooltip && (
                <TooltipHeaderPortal>
                    <div className="tooltip" style={tooltipStyle}>
                        <span>
                            {updatedDescription}
                        </span>
                    </div>
                </TooltipHeaderPortal>
            )}
        </div>
    );
};

export default TooltipHeaderIcon;

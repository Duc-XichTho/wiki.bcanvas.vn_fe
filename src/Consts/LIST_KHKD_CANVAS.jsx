import {Goals, Typing, PlanActualIcon, Tui3GangIcon} from "../icon/svg/IconSvg.jsx";

export const LIST_KHKD_CANVAS = [
    {
        icon: <Goals width={20} height={17}/>,
        label: 'Thiết lập kế hoạch',
        key: 1
    },
    {
        icon: <Typing width={20} height={17}/>,
        label: 'Nhập liệu thực thi',
        key: '2'
    },
    {
        icon: <PlanActualIcon width={20} height={17}/>,
        label: 'Thực hiện vs kế hoạch',
        key: '3'
    },
    {
        icon: <Tui3GangIcon width={20} height={17}/>,
        label: 'Ước tính lãi lỗ',
        key: '4'
    },
]
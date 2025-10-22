import { useNavigate } from "react-router-dom";
import css from "./Header.module.css";
import { BackCanvas } from '../../../icon/svg/IconSvg.jsx';
import ProfileSelect from "../../Home/SelectComponent/ProfileSelect.jsx";

export default function Header() {
    const navigate = useNavigate();

    return (
        <div className={css.navContainer}>
            <div className={css.header_left}>
                <div className={css.backCanvas}
                     onClick={() => navigate('/dashboard')}
                >
                    <BackCanvas height={20} width={20}/>
                </div>
                <span style={{ fontSize: '20px' }}>🤖</span>
                <div className={css.headerLogo}>
                    Công cụ xử lý file AI
                </div>
            </div>
            <div className={css.header_right}>
                <div className={css.username}>
                    <ProfileSelect />
                </div>
            </div>
        </div>
    );
}

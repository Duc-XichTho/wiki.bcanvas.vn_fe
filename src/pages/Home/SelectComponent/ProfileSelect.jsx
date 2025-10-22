import * as React from "react";
import { useNavigate } from "react-router-dom";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { message, Modal,Button } from "antd";
import { getCurrentUserLogin, logout } from "../../../apis/userService.jsx";
import CauHinh from "../AgridTable/DanhMuc/CauHinh.jsx";
import css from './SelectComponent.module.css'
import { Avatar } from 'antd';
import { useMediaQuery } from 'react-responsive';
export default function ProfileSelect({color = '#454545'}) {
    const media = useMediaQuery({ query: '(max-width: 768px)' });
    const [currentUser, setCurrentUser] = React.useState(null);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [isShowCauHinh, setIsShowCauHinh] = React.useState(false);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();

    const fetchCurrentUserLogin = async () => {
        const { data, error } = await getCurrentUserLogin();
        if (error) {
            message.error(error.message);
            return null;
        }
        return data;
    };

    React.useEffect(() => {
        const fetchUser = async () => {
            const user = await fetchCurrentUserLogin();
            setCurrentUser(user);
        };
        fetchUser();
    }, []);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleOpenCauHinh = () => {
        setAnchorEl(null)
        setIsShowCauHinh(true);
    };
    const handleCloseCauHinh = () => {
        setIsShowCauHinh(false);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };


    const handleLogout = async () => {
        try {
            await logout();
            handleClose();
            navigate("/", { replace: true });
        } catch (error) {
            console.error("Error logging out:", error);
            message.error("Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại sau!", {
                position: "bottom-center",
            });
        }
    };

    const navigateAdmin = () => {
        handleClose();
        navigate("/adminApp");
    };

    return (
        <>
            <Button
              
                onClick={handleClick}
                style={{ color: "#454545", textTransform: "none", padding: '5px 0 5px 5px', margin: 0 , borderRadius: '12px'}}
                type="text"
            >
                <div className={css.container}>
                {media ? null : <span className={css.currentUserName} style={{ color: color }}>{currentUser?.name}</span>}
                    <Avatar src={<img src={currentUser?.picture} alt="avatar" />} size={35} />
                    {/*<img*/}
                    {/*    src="/live.svg"*/}
                    {/*    alt=""*/}
                    {/*    style={{ width: "30px", marginLeft: "5px" }}*/}
                    {/*/>*/}
                </div>
            </Button>
            <Menu
                id="basic-menu"
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    "aria-labelledby": "basic-button",
                }}
                sx={{
                    marginLeft: "30px"
                }}
            >
                { (currentUser?.isSuperAdmin || (currentUser?.isAdmin && currentUser?.isRealAdmin)) && (
                    <>
                        <MenuItem style={{ fontSize: "14px" }} onClick={handleOpenCauHinh}>
                            Cấu hình
                        </MenuItem>
                        <MenuItem style={{ fontSize: "14px" }} onClick={navigateAdmin}>
                            Admin
                        </MenuItem>
                    </>
                )}
                <MenuItem style={{ fontSize: "14px" }} onClick={handleLogout}>
                    Đăng xuất
                </MenuItem>
            </Menu>
            <Modal
                title={'Cấu hình'}
                open={isShowCauHinh}
                onCancel={handleCloseCauHinh}
                centered
                width={1120}
                footer={(<>

                </>)}
            >
                <CauHinh
                    isShowCauHinh={isShowCauHinh}
                />
            </Modal>
        </>
    );
}

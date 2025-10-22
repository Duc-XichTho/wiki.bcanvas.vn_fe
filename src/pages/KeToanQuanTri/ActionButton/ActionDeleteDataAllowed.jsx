import React, {useState} from "react";
import Popover from '@mui/material/Popover';
import {Button} from "antd";
import Typography from '@mui/material/Typography';
import {deleteKenh} from "../../../apisKTQT/kenhService.jsx";
import {toast} from "react-toastify";
import {deleteProduct} from "../../../apisKTQT/productService.jsx";
import {deleteUnit} from "../../../apisKTQT/unitService.jsx";
import {deleteKmf} from "../../../apisKTQT/kmfService.jsx";
import {deleteKmns} from "../../../apisKTQT/kmnsService.jsx";
import {deleteProject} from "../../../apisKTQT/projectService.jsx";
import {deleteVendor} from "../../../apisKTQT/vendorService.jsx";
import {deleteCostPool} from "../../../apis/costPoolService.jsx";

export default function ActionDeleteDataAllowed({table, listDataAllowDelete, loadData}) {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };


    const open = Boolean(anchorEl);
    const id = open ? 'reset-popover' : undefined;

    const handleDeteleMany = async () => {
        try {
            if (table === "Kenh") {
                await Promise.all(listDataAllowDelete.map((item) => deleteKenh(item.id)));
            }
            if (table === "Vendor") {
                await Promise.all(listDataAllowDelete.map((item) => deleteVendor(item.id)));
            }
            if (table === "CostPool") {
                await Promise.all(listDataAllowDelete.map((item) => deleteCostPool(item.id)));
            }
            if (table === "Product") {
                await Promise.all(listDataAllowDelete.map((item) => deleteProduct(item.id)));
            }
            if (table === "Unit") {
                await Promise.all(listDataAllowDelete.map((item) => deleteUnit(item.id)));
            }
            if (table === "Kmf") {
                await Promise.all(listDataAllowDelete.map((item) => deleteKmf(item.id)));
            }
            if (table === "Kmns") {
                await Promise.all(listDataAllowDelete.map((item) => deleteKmns(item.id)));
            }
            if (table === "Project") {
                await Promise.all(listDataAllowDelete.map((item) => deleteProject(item.id)));
            }
            await loadData()
            toast.success("Xóa thành công !!! ");
        } catch (error) {
            console.error("Error deleting items:", error);
        }
    };

    return (
        <div>
            <Button
                type="primary"
                onClick={handleClick}
                style={{backgroundColor: "#ee8b67", borderColor: "#ee8b67"}}
            >
                Xóa danh mục không sử dụng
            </Button>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',  // Hiển thị ngay dưới nút bấm
                    horizontal: 'left',  // Căn trái theo nút bấm
                }}
                transformOrigin={{
                    vertical: 'top',     // Bắt đầu từ phía trên của Popover
                    horizontal: 'center',  // Căn trái theo Popover
                }}
                sx={{
                    '& .MuiPaper-root': {
                        padding: '8px 12px',
                        borderRadius: '4px',
                        maxWidth: '255px',
                        marginTop: '8px',  // Thêm khoảng cách nhỏ giữa nút và Popover
                        position: 'relative',
                    },
                }}
            >

                <Typography sx={{fontSize: '14px', marginBottom: '8px'}}>
                    Xóa dữ liệu cho phép
                </Typography>
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '5px'}}>
                    <Button onClick={handleDeteleMany} color="error" size="small">
                        Xác nhận
                    </Button>
                    <Button onClick={handleClose} color="primary" size="small">
                        Hủy
                    </Button>
                </div>
            </Popover>
        </div>
    );
}

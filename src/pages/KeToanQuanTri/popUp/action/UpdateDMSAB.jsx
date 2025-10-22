import { Button, message } from "antd"; // Import message từ antd
import { updateDMFromSAB } from "../../../../apisKTQT/updateDMFromSABService.jsx";

const UpdateDMSAB = () => {
    const handleUpdate = async () => {
        try {
            const response = await updateDMFromSAB(); // Gọi hàm cập nhật
            
            if (response.status === 200) { // Kiểm tra mã trạng thái
                message.success('Cập nhật thành công!'); // Hiển thị thông báo thành công
                setTimeout(()=>{
                    window.location.reload()
                },500)
            } else {
                message.error('Có lỗi xảy ra, vui lòng thử lại.'); // Thông báo lỗi nếu không phải 200
            }
        } catch (error) {
            message.error('Lỗi: ' + error.message); // Hiển thị lỗi nếu có
        }
    };

    return (
        <>
            <Button onClick={handleUpdate} style={{fontSize : '15px', width : '120px'}}>Update DM</Button>
        </>
    );
};

export default UpdateDMSAB;

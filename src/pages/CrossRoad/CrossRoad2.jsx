import css from './CrossRoad2.module.css'
import { useState, useEffect, useContext } from "react"
import { Card, Button, Modal, Flex, Input, message } from 'antd';
import { Todo, Admin, Accounting, ReportBuilder, ReportCanvas, Wiki } from '../../icon/svg/IconSvg'
import { createFeedback } from '../../apis/feedbackService.jsx'
import { MyContext } from "../../MyContext.jsx";
const { TextArea } = Input;

const CrossRoad2 = () => {
  const { currentUser } = useContext(MyContext);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openFeedback, setOpenFeedback] = useState(false);
  const [titleFeedback, setTitleFeedback] = useState('');
  const [bodyFeedback, setBodyFeedback] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const listPage = [
    { id: 1, icon: <ReportCanvas />, title: 'Trung tâm báo cáo (Report Canvas)', desc: 'Xem báo cáo tài chính & dữ liệu' },
    { id: 2, icon: <ReportBuilder />, title: 'Sản xuất báo cáo (Report Builder)', desc: 'Xây dựng các báo cáo tài chính' },
    { id: 3, icon: <Accounting />, title: 'Quản lý kế toán (Accounting)', desc: 'Quản lý nghiệp vụ kế toán' },
    { id: 4, icon: <Wiki />, title: 'Wiki', desc: 'Kho tài nguyên' },
    { id: 5, icon: <Todo />, title: 'Quản lý việc (To-do)', desc: 'Quản lý việc nhanh - hiệu quả' },
    { id: 6, icon: <Admin />, title: 'Quản lý người dùng (Admin)', desc: 'Cấu hình phân quyền' },
    { id: 7, icon: <Todo />, title: 'Gateway', desc: 'Gateway' },
  ]

  const onChangeTitle = (e) => {
    setTitleFeedback(e.target.value);
  };

  const onChangeBody = (e) => {
    setBodyFeedback(e.target.value);
  };

  const handleCloseFeedback = () => {
    setTitleFeedback('');
    setBodyFeedback('');
    setOpenFeedback(false);
  };

  const renderFeedback = () => {

    return (
      <Flex vertical gap={16}>
        <Input
          placeholder="tiêu đề"
          showCount maxLength={100}
          value={titleFeedback}
          onChange={onChangeTitle}
        />
        <TextArea
          showCount
          maxLength={2000}
          placeholder="nội dung"
          style={{
            height: 260,
            resize: 'none',
          }}
          value={bodyFeedback}
          onChange={onChangeBody}
        />
      </Flex>
    )
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayOfWeek = weekdays[currentTime.getDay()];

  const day = currentTime.getDate();
  const month = currentTime.getMonth() + 1;
  const year = currentTime.getFullYear();

  const handleSelectPage = (page) => {
    const { id } = page

    const pageRoutes = {
      1: `${import.meta.env.VITE_DOMAIN_URL}/canvas`,
      2: `${import.meta.env.VITE_DOMAIN_URL}/ke-toan-quan-tri`,
      3: `${import.meta.env.VITE_DOMAIN_URL}/accounting`,
      4: 'https://sab.io.vn',
      5: `${import.meta.env.VITE_DOMAIN_URL}/project-manager`,
      6: `${import.meta.env.VITE_DOMAIN_URL}/admin`,
      7: `${import.meta.env.VITE_DOMAIN_URL}/gateway`,
    };

    const url = pageRoutes[id];

    if (url) {
      id === 4 ? window.open(url, '_blank') : (window.location.href = url);
    } else {
      console.warn('Page ID không hợp lệ:', id);
    }
  }


  const renderCard = (page) => (
    <div className={css.cardContent}>
      <div className={css.cardIcon}>{page.icon}</div>
      <div className={css.cardInfo}>
        <div className={css.cardTitle}>{page.title}</div>
        <div className={css.cardDesc}>{page.desc}</div>
      </div>
    </div>
  )

  const handleSendEmail = async () => {

    setConfirmLoading(true);

    if (!titleFeedback.trim() || !bodyFeedback.trim()) {
      message.warning("Vui lòng nhập tiêu đề và nội dung!");
      setConfirmLoading(false);
      return;
    }

    const emailData = {
      senderName: currentUser?.name,
      senderEmail: currentUser?.email,
      title: titleFeedback,
      body: bodyFeedback,
    };

    try {
      const response = await createFeedback(emailData);

      if (response.data.code === 'OK') {
        message.success('Gửi thành công');
        setConfirmLoading(false);
        handleCloseFeedback();
      } else {
        setConfirmLoading(false);
        message.error('Gửi thất bại');
      }
    } catch (error) {
      setConfirmLoading(false);
      console.error("Lỗi gửi email:", error);
    }

  };

  return (
    <>
      <div className={css.main}>
        <div className={css.container}>
          <div className={css.left}>
            <div className={css.leftTop}>
              <Card>
                {listPage.map(page => (
                  <Card.Grid
                    onClick={() => handleSelectPage(page)}
                    key={page.id}>{renderCard(page)}
                  </Card.Grid>
                ))}
              </Card>
            </div>
            <div className={css.leftBotton}>
              <Button type='text' onClick={() => setOpenFeedback(true)}>Yêu cầu hỗ trợ</Button>
              <Button type='text' onClick={() => window.open('https://sab.io.vn')}>Tới sab.io.vn</Button>
            </div>
          </div>
          <div className={css.right}>
            <div className={css.rightContainer}>
              <div className={css.rightDay}><span>{dayOfWeek}, ngày {day} tháng {month} năm {year}</span></div>
              <div className={css.rightHour}>  <span>{hours}:{minutes}:{seconds}</span></div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        width={700}
        title="Yêu cầu hỗ trợ"
        confirmLoading={confirmLoading}
        centered
        open={openFeedback}
        onOk={() => handleSendEmail()}
        onCancel={() => handleCloseFeedback()}
        okText="Gửi"
        cancelText="Hủy"
        maskClosable={false}
        styles={{
          body: {
            height: 350,
            overflowY: 'auto',
          },
        }}
      >
        {renderFeedback()}
      </Modal>
    </>
  )
}

export default CrossRoad2
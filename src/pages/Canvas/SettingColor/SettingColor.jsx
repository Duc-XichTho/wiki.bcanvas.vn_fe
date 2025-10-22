import css from './SettingColor.module.css';
import { useEffect, useState } from 'react';
import { Button, ColorPicker, message, Modal } from 'antd';
import { createSetting, getSettingByType, updateSetting } from '../../../apis/settingService';

const SettingColor = ({ isOpen, onClose }) => {
  const [listColor, setListColor] = useState(null)
  let defaultColors = [{"id": 1, "color": "#FF0000"}, {"id": 2, "color": "#914343"}, {"id": 3, "color": "#5C5858"}, {"id": 4, "color": "#4255B3"}, {"id": 5, "color": "#000DFC"}, {"id": 6, "color": "#DCA0A0"}, {"id": 7, "color": "#FF006A"}, {"id": 8, "color": "#FFFB00"}]

  const fetchData = async () => {
    try {
      let data = await getSettingByType('SettingColor')
      if (!data) {
        data = await createSetting({
          type: 'SettingColor',
          setting: defaultColors
        });
      }
      setListColor(data)
    } catch (error) {
      console.error('Lỗi khi lấy thông tin:', error);
    }
  }

  useEffect(() => {
    fetchData()
  }, [isOpen])

  const handleColorChange = (color, id) => {
    setListColor(prevList => {
      const newSettings = [...prevList.setting];
      const index = newSettings.findIndex(item => item.id === id);
      if (index !== -1) {
        newSettings[index] = { ...newSettings[index], color: color.toHexString().toUpperCase() };
      }
      return { ...prevList, setting: newSettings };
    });
  };

  const handleSave = async () => {
    try {
      console.log(listColor);
      await updateSetting(listColor)
      await fetchData()
      message.success('Đã lưu')
      onClose()
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
    }
  }

  return (
      <Modal
          title="Cấu hình Color"
          width={250}
          centered
          open={isOpen}
          footer={() => {
            return (
                <div className={css.footer}>
                  <Button size='small' type='primary' onClick={handleSave}>Lưu</Button>
                  <Button size='small' onClick={onClose}>Đóng</Button>
                </div>
            )
          }}
          className={css.modal}
      >
        <div className={css.colorPicker}>
          {listColor?.setting.map((item) => {
            return (
                <div key={item.id} className={css.colorPickerWrap}>
                  <span>Màu {item.id}</span>
                  <ColorPicker
                      value={item.color}
                      size="large"
                      showText
                      onChange={(color) => handleColorChange(color, item.id)}
                  />
                </div>
            )
          })}
        </div>
      </Modal>
  )
}

export default SettingColor

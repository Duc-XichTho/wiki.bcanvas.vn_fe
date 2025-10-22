import css from "./Template.module.css"
import { useState, useEffect } from "react";
import { Modal, Input, Popover, Button, message, Popconfirm } from "antd";
import { Plus } from "lucide-react";
import { MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { createNewTemplate, updateTemplate, deleteTemplate } from "../../../../../apis/templateService.jsx";

import { getAllTemplate } from "../../../../../apis/templateService.jsx";

const Template = ({
  chainSelected,
  templateSelected,
  setTemplateSelected,
}) => {
  const [allTemplates, setAllTemplates] = useState([]);
  const [listTemplateFilter, setListTemplateFilter] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [openModalCreate, setOpenModalCreate] = useState(false);
  const [openModalUpdate, setOpenModalUpdate] = useState(false);
  const [openPopovers, setOpenPopovers] = useState({});
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmLoadingUpdate, setConfirmLoadingUpdate] = useState(false);
  const [valueNameTemplate, setValueNameTemplate] = useState('');
  const [valueNameTemplateUpdate, setValueNameTemplateUpdate] = useState('');

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const showNotification = (type, content) => {
    messageApi.open({
      type,
      content,
    });
  };

  const fetchAllTemplate = async () => {
    try {
      const data = await getAllTemplate();
      setAllTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  useEffect(() => {
    const filteredData = allTemplates.filter(template => template.chain_id === chainSelected.id);
    setListTemplateFilter(filteredData);
  }, [chainSelected, allTemplates]);

  useEffect(() => {
    fetchAllTemplate();
  }, []);


  const handleOpenChange = (newOpen, id) => {
    setOpenPopovers((prevState) => ({
      ...prevState,
      [id]: newOpen,
    }));
  };

  const handleCreateTemplate = async () => {
    try {
      setConfirmLoading(true);
      const data = {
        chain_id: chainSelected.id,
        name: valueNameTemplate,
      }
      const response = await createNewTemplate(data);

      await delay(2000);

      switch (response.status) {
        case 201:
          showNotification("success", "Tạo thành công.");
          setValueNameTemplate('');
          await fetchAllTemplate();
          break;
        default:
          showNotification("error", "Có lỗi xảy ra");
          break;
      }

    } catch (error) {
      console.log("Error:", error);
      showNotification("error", "Có lỗi xảy ra");
    } finally {
      setConfirmLoading(false);
      setOpenModalCreate(false);
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      setConfirmLoadingUpdate(true);
      const data = {
        id: templateSelected.id,
        name: valueNameTemplateUpdate,
      }
      const response = await updateTemplate(data);

      await delay(2000);
      switch (response.status) {
        case 200:
          showNotification("success", "Cập nhật thành công.");
          setValueNameTemplateUpdate('');
          await fetchAllTemplate();
          break;
        default:
          showNotification("error", "Có lỗi xảy ra");
          break;
      }
    } catch (error) {
      console.log("Error:", error);
      showNotification("error", "Có lỗi xảy ra");
    } finally {
      setConfirmLoadingUpdate(false);
      setOpenModalUpdate(false);
    }
  }

  const handleDeleteTemplate = async (item) => {
    try {
      const response = await deleteTemplate(item.id);
      await delay(2000);
      switch (response.status) {
        case 200:
          showNotification("success", "Xóa thành công.");
          setTemplateSelected(null);
          await fetchAllTemplate();
          break;
        default:
          showNotification("error", "Có lỗi xảy ra");
          break;
      }
    } catch (error) {
      console.log("Error:", error);
      showNotification("error", "Có lỗi xảy ra");
    }
  };

  const handleOpenPopoverUpdate = (item) => {
    setValueNameTemplateUpdate(item.name)
    setOpenPopovers(false);
    setOpenModalUpdate(true);

  }

  const popoverContent = (item) => {
    return (
      <div className={css.popoverContent}>
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenPopoverUpdate(item)}
        />
        <Popconfirm
          title="Xóa Template"
          description="Bạn có chắc chắn muốn xóa không?"
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={async () => await handleDeleteTemplate(item)}
          placement="bottom"
        >
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
          />
        </Popconfirm>
      </div>
    )
  };

  return (
    <>
      {contextHolder}
      <div className={css.main}>
        <div className={css.menuGroup}>
          <div className={css.menuHeader}>
            <div className={css.menuTitle}>
              <div>
                <span><b>Quản lý Template</b></span>
              </div>
            </div>
            <div className={css.changePosition}>
              <Button type="text" icon={<Plus />} onClick={() => setOpenModalCreate(true)} />
            </div>
          </div>
          <div className={css.menuContent}>
            {listTemplateFilter.map((item) => (
              <div
                key={item.id}
                className={`${css.menuData} ${templateSelected?.id === item.id
                  ? css.selected
                  : ""
                  }`}
                onClick={() => setTemplateSelected(item)}
              >
                <div className={css.templateInfoContainer}>
                  <div className={css.templateInfo}>
                    <span>{item.name}</span>
                  </div>
                  <div className={css.templateAction}>
                    <Popover
                      content={popoverContent(item)}
                      trigger="click"
                      placement="right"
                      open={!!openPopovers[item.id]}
                      onOpenChange={(e) => handleOpenChange(e, item.id)}
                    >
                      <Button type="text" size="small" icon={<MoreOutlined />} />
                    </Popover>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Modal
        centered
        title="Tạo Template"
        okText="Tạo"
        cancelText="Hủy"
        open={openModalCreate}
        onOk={async () => await handleCreateTemplate()}
        confirmLoading={confirmLoading}
        onCancel={() => setOpenModalCreate(false)}
      >
        <Input
          placeholder="nhập tên"
          value={valueNameTemplate}
          onChange={(e) => setValueNameTemplate(e.target.value)}
        />
      </Modal>
      <Modal
        centered
        title="Sửa tên Template"
        okText="Lưu"
        cancelText="Hủy"
        open={openModalUpdate}
        onOk={async () => await handleUpdateTemplate()}
        confirmLoading={confirmLoadingUpdate}
        onCancel={() => setOpenModalUpdate(false)}
      >
        <Input
          placeholder="nhập tên"
          value={valueNameTemplateUpdate}
          onChange={(e) => setValueNameTemplateUpdate(e.target.value)}
        />
      </Modal>
    </>
  )
}

export default Template
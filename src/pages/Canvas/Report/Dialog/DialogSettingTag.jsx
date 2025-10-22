import React, {useEffect, useState} from "react";
import {Button, Form, Input, Modal, Table} from "antd";
import {createNewTag, deleteTag, getAllTag, updateTag} from "../../../../apis/tagService.jsx";

const DialogSettingTag = ({visible, onClose, setTags}) => {
    const [listTags, setListTags] = useState([]);
    const [editingKey, setEditingKey] = useState('');
    const [form] = Form.useForm();
    const isEditing = (record) => record.key === editingKey;

    const fetchTag = async () => {
        const data = await getAllTag();
        const filteredData = data.filter(tag => tag.table == 'report');
        setListTags(filteredData.map((item, index) => ({...item, key: index})));
    };

    useEffect(() => {
        if (visible) {
            fetchTag();
        }
    }, [visible]);

    const edit = (record) => {
        form.setFieldsValue({...record});
        setEditingKey(record.key);
    };

    const cancel = () => {
        setEditingKey('');
    };

    const save = async (key) => {
        try {
            const row = await form.validateFields();
            const newData = [...listTags];
            const index = newData.findIndex((item) => key === item.key);

            if (index > -1) {
                const item = newData[index];
                const updatedItem = {...item, ...row};
                await updateTag(updatedItem);

                newData.splice(index, 1, updatedItem);
                setListTags(newData);
                setEditingKey('');
            }
        } catch (err) {
            console.log('Validate Failed:', err);
        }
    };


    const columns = [
        {
            title: 'Tên Tag',
            dataIndex: 'name',
            editable: true,
            width: '80%', // Chiều rộng 60% bảng
        },
        {
            title: 'Hành động',
            dataIndex: 'action',
            width: '20%', // Chiều rộng 40% bảng
            render: (_, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <span>
                    <Button onClick={() => save(record.key)} type="link">
                        Lưu
                    </Button>
                    <Button onClick={cancel} type="link">
                        Hủy
                    </Button>
                </span>
                ) : (
                    <>
                        <Button
                            disabled={editingKey !== ''}
                            onClick={() => edit(record)}
                            type="link"
                        >
                            Sửa
                        </Button>
                        <Button
                            onClick={() => handleDelete(record.key)}
                            type="link"
                            danger
                        >
                            Xóa
                        </Button>
                    </>
                );
            },
        },
    ];


    const mergedColumns = columns.map((col) => {
        if (!col.editable) {
            return col;
        }

        return {
            ...col,
            onCell: (record) => ({
                record,
                editable: col.editable,
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
            }),
        };
    });

    const EditableCell = ({
                              editing,
                              dataIndex,
                              title,
                              record,
                              children,
                              ...restProps
                          }) => {
        return (
            <td {...restProps}>
                {editing ? (
                    <Form.Item
                        name={dataIndex}
                        style={{margin: 0}}
                        rules={[
                            {
                                required: true,
                                message: `${title} không được để trống!`,
                            },
                        ]}
                    >
                        <Input/>
                    </Form.Item>
                ) : (
                    children
                )}
            </td>
        );
    };

    const handleAdd = async () => {
        const newTag = {
            name: "",
            table: 'report'
        };

        const createdTag = await createNewTag(newTag);
        setListTags([{...createdTag, key: listTags.length}, ...listTags]);
    };



    const handleDelete = async (key) => {
        const newData = [...listTags];
        const index = newData.findIndex((item) => key === item.key);

        if (index > -1) {
            const item = newData[index];

            await deleteTag(item.id);

            newData.splice(index, 1);
            setListTags(newData);
        }
    };

    const hanleClose = () => {
        setTags(listTags)
        onClose()
    }

    return (
        <Modal
            title={
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span>Quản lý Tag</span>
                    <Button
                        type="primary"
                        size="small"
                        onClick={handleAdd}
                        style={{
                            marginRight: '50px',
                            fontSize: '12px', // Kích thước chữ nhỏ hơn
                            padding: '2px 8px' // Điều chỉnh khoảng cách trong nút cho gọn hơn
                        }}
                    >
                        Thêm mới
                    </Button>
                </div>


            }
            visible={visible}
            onCancel={hanleClose}
            footer={null}
            width={800}
        >
            <Form form={form} component={false}>
                <Table
                    components={{
                        body: {
                            cell: EditableCell,
                        },
                    }}
                    bordered
                    dataSource={listTags}
                    columns={mergedColumns}
                    rowClassName="editable-row"
                    pagination={listTags.length > 5 ? {pageSize: 5} : false}
                />
            </Form>
        </Modal>


    );
};

export default DialogSettingTag;

import React, { useState } from "react";
import {
    Button,
    Input,
    Modal,
    Table,
    Space,
    Typography,
    Progress,
    Row,
    Col,
    Popconfirm,
    Select,
    Upload,
    Card
} from "antd";
import {
    UploadOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    EditOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { toast } from "react-toastify";
import { uploadFileService } from "../../apis/uploadFileService";
import { createNewFile } from "../../apis/fileService";
import { log, re } from "mathjs";

const SlideManager = ({ slides, setSlides, table = "Onboarding-Guide", tableId = 1 }) => {

    const [openDialog, setOpenDialog] = useState(false);
    const [editingSlide, setEditingSlide] = useState(null);
    const [formValues, setFormValues] = useState({
        title: "",
        type: undefined,
        src: "",
        order: slides.length + 1,
    });

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const handleOpenDialog = () => {
        setEditingSlide(null); // Reset form khi thêm mới
        setFormValues({ title: "", type: undefined, src: "", order: slides.length + 1 });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedFiles([]);
        setUploadProgress(0);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
    };

    const handleSelectChange = (value) => {
        setFormValues({ ...formValues, type: value });
    };

    const handleSaveSlide = () => {
        const updatedSlides =
            editingSlide !== null
                ? slides.map((slide) =>
                    slide.order === editingSlide ? { ...formValues, order: editingSlide } : slide
                )
                : [
                    ...slides,
                    {
                        ...formValues,
                        order: slides.length + 1,
                    },
                ];

        setSlides(updatedSlides);
        setOpenDialog(false);
    };

    const handleEditSlide = (order) => {
        const slideToEdit = slides.find((slide) => slide.order === order);
        setEditingSlide(order);
        setFormValues(slideToEdit);
        setOpenDialog(true);
    };

    const handleDeleteSlide = (order) => {
        const updatedSlides = slides
            .filter((slide) => slide.order !== order)
            .map((slide, index) => ({ ...slide, order: index + 1 })); // Cập nhật lại thứ tự
        setSlides(updatedSlides);
    };

    const handleMoveSlide = (order, direction) => {
        const index = slides.findIndex((slide) => slide.order === order);
        if (direction === "up" && index > 0) {
            const newSlides = [...slides];
            [newSlides[index - 1].order, newSlides[index].order] = [
                newSlides[index].order,
                newSlides[index - 1].order,
            ];
            setSlides(newSlides);
        } else if (direction === "down" && index < slides.length - 1) {
            const newSlides = [...slides];
            [newSlides[index + 1].order, newSlides[index].order] = [
                newSlides[index].order,
                newSlides[index + 1].order,
            ];
            setSlides(newSlides);
        }
    };

    const handleFileChange = (event) => {
        setSelectedFiles(event.target.files);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        setSelectedFiles(event.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            // toast.warning("Vui lòng chọn file để upload.");
            return;
        }

        try {
            const response = await uploadFileService(selectedFiles);
            console.log(response)
       
                const file = response.files[0]
                const fileData = {
                    name: file.fileName,
                    url: file.fileUrl,
                    type: file.fileExtension,
                    table: table,
                    table_id: tableId,
                };
                console.log(fileData)
                await createNewFile(fileData);
                setFormValues((prevValues) => ({ ...prevValues, src: file.fileUrl }));

          



            toast.success("File đã được upload thành công!");
        } catch (error) {
            toast.error("Lỗi khi tải lên file.");
        } finally {
            setSelectedFiles([]);
            setUploadProgress(0);
        }
    };

    return (
        <div>
            <Button
                type="primary"
                style={{ marginBottom: "10px" }}
                onClick={handleOpenDialog}
            >
                Thêm slide
            </Button>

            {/* Dialog thêm/sửa */}
            <Modal
                open={openDialog}
                onCancel={handleCloseDialog}
                title={editingSlide !== null ? "Sửa slide" : "Thêm slide"}
                footer={[
                    <Button key="cancel" onClick={handleCloseDialog}>
                        Hủy
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleSaveSlide}>
                        {editingSlide !== null ? "Lưu" : "Thêm"}
                    </Button>
                ]}
                width={600}
            >
                <Input
                    placeholder="Tiêu đề"
                    name="title"
                    value={formValues.title}
                    onChange={handleFormChange}
                    style={{ marginBottom: 16 }}
                />
                <Select
                    placeholder="Chọn loại slide"
                    style={{ width: '100%', marginBottom: 16 }}
                    value={formValues.type || undefined}
                    onChange={handleSelectChange}
                >
                    <Select.Option value="iframe">PDF, Video</Select.Option>
                    <Select.Option value="img">Ảnh</Select.Option>
                    <Select.Option value="tiptap">Note</Select.Option>
                </Select>
                {(formValues.type == 'img' || formValues.type == 'iframe') &&
                    <>
                        <Input
                            placeholder="Đường dẫn (URL)"
                            name="src"
                            value={formValues.src}
                            onChange={handleFormChange}
                            style={{ marginBottom: 16 }}
                        />
                        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', margin: '16px 0' }}>
                            Hoặc
                        </Typography.Text>

                        {/* Upload File */}
                        <Upload.Dragger
                            name="file"
                            beforeUpload={(file) => {
                                setSelectedFiles([file]);
                                return false;
                            }}
                            onRemove={() => setSelectedFiles([])}
                            fileList={selectedFiles.length > 0 ? Array.from(selectedFiles).map((file, index) => ({
                                uid: index,
                                name: file.name,
                                status: 'done',
                            })) : []}
                            style={{ marginBottom: 16 }}
                        >
                            <p className="ant-upload-drag-icon">
                                <UploadOutlined />
                            </p>
                            <p className="ant-upload-text">Kéo thả file vào đây hoặc nhấp để tải lên</p>
                        </Upload.Dragger>

                        <Button
                            type="primary"
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0}
                            style={{ width: '100%', marginTop: 16 }}
                        >
                            Upload
                        </Button>


                    </>



                }



                {uploadProgress > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <Progress percent={uploadProgress} />
                        <Typography.Text style={{ display: 'block', textAlign: 'center' }}>
                            {`${uploadProgress}%`}
                        </Typography.Text>
                    </div>
                )}
            </Modal>

            {/* Table */}
            <Table
                dataSource={slides.sort((a, b) => a.order - b.order).map(slide => ({
                    ...slide,
                    key: slide.order
                }))}
                style={{ marginTop: 20 }}
                columns={[
                    {
                        title: 'Order',
                        dataIndex: 'order',
                        key: 'order',
                    },
                    {
                        title: 'Title',
                        dataIndex: 'title',
                        key: 'title',
                    },
                    {
                        title: 'Type',
                        dataIndex: 'type',
                        key: 'type',
                    },
                    {
                        title: 'Source (URL)',
                        dataIndex: 'src',
                        key: 'src',
                        render: (text) => (
                            <a
                                href={text}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {text}
                            </a>
                        ),
                    },
                    {
                        title: 'Hành động',
                        key: 'action',
                        render: (_, record) => {
                            const isProtectedSlide = record.src.startsWith("/") && record.order === 1;
                            const isFirstSlide = record.order === 1;
                            const isLastSlide = record.order === slides.length;

                            return (
                                <Space>
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={() => handleEditSlide(record.order)}
                                    />

                                    {!isProtectedSlide && (
                                        <Popconfirm
                                            title="Bạn có chắc chắn muốn xóa?"
                                            onConfirm={() => handleDeleteSlide(record.order)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button
                                                danger
                                                type="primary"
                                                icon={<DeleteOutlined />}
                                            />
                                        </Popconfirm>
                                    )}

                                    {!isProtectedSlide && !isFirstSlide && (
                                        <Button
                                            icon={<ArrowUpOutlined />}
                                            onClick={() => handleMoveSlide(record.order, "up")}
                                        />
                                    )}

                                    {!isProtectedSlide && !isLastSlide && (
                                        <Button
                                            icon={<ArrowDownOutlined />}
                                            onClick={() => handleMoveSlide(record.order, "down")}
                                        />
                                    )}
                                </Space>
                            );
                        },
                    },
                ]}
            />
        </div>
    );
};

export default SlideManager;


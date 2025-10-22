import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Modal, Button, Form, Select, Typography } from "antd";
// API
import { getAllInput } from "../../../../../../apis/inputService";
import { getAllStep } from "../../../../../../apis/stepService";
import { getAllSubStep } from "../../../../../../apis/subStepService";
import { updateDinhKhoan } from "../../../../../../apis/dinhKhoanService";

const { Text } = Typography;

const SettingPopup = ({
    styles,
    openDialog,
    handleCancel,
    form,
    sub_step_id,
    formStep,
    dinhKhoanId
}) => {
    let { idTemp } = useParams()
    const [listInputForGet, setListInputForGet] = useState([]);
    const [inputOptions, setInputOptions] = useState([]);

    const getAllInputOfTemp = async () => {
        const steps = await getAllStep();

        let filterStep = steps.filter(step => step.template_id == idTemp);

        const subSteps = await getAllSubStep();

        let filterStepIds = filterStep.map(step => step.id);

        let filterSubStep = subSteps.filter(subStep =>
            filterStepIds.some(id => subStep.step_id == id)
        );
        const data = await getAllInput();
        let finalFilteredData = data.filter(input =>
            filterSubStep.some(sub => sub.id == input.sub_step_id)
        );

        finalFilteredData = finalFilteredData.filter(item =>
            formStep.some(form => form.id == item.sub_step_id)
        );

        const inputOptionList = listInputForGet.map(item => ({
            label: item.label,
            value: item.id
        }));

        setInputOptions(inputOptionList);
        setListInputForGet(finalFilteredData);
        return finalFilteredData;
    };

    useEffect(() => {
        getAllInputOfTemp();
    }, [sub_step_id])

    const handleSubmit = async (values) => {
        try {
            // const updateData = {
            //     dien_giai_setting: values.dien_giai_setting || [],
            //     so_tien_setting: values.so_tien_setting || null
            // };
            // await updateDinhKhoan({
            //     id: dinhKhoanId,
            //     ...updateData
            // });
            // handleCancel();
        } catch (error) {
            console.error("Failed to update Dinh Khoan:", error);
            // Handle error (show error message, etc.)
        }
    };

    return (
        <Modal
            className={styles.settingsModal}
            title="Settings"
            open={openDialog}
            onCancel={handleCancel}
            footer={null}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className={styles.settingsForm}
            >
                <div className={styles.formRow}>
                    <div>
                        <div className={styles.labelContainer}>
                            <Text strong>Diễn giải</Text>
                        </div>
                        <Form.Item
                            name="dien_giai_setting"
                            className={styles.formItem}
                            rules={[{ required: true, message: 'Please select Diễn giải options' }]}
                        >
                            <Select
                                mode="multiple"
                                placeholder="Select Diễn giải"
                                options={inputOptions}
                                className={styles.selectInput}
                            />
                        </Form.Item>
                    </div>

                    <div>
                        <div className={styles.labelContainer}>
                            <Text strong>Số tiền</Text>
                        </div>
                        <Form.Item
                            name="so_tien_setting"
                            className={styles.formItem}
                            rules={[{ required: true, message: 'Please select Số tiền' }]}
                        >
                            <Select
                                placeholder="Select Số tiền"
                                options={inputOptions}
                                className={styles.selectInput}
                            />
                        </Form.Item>
                    </div>

                    <div>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className={styles.submitButton}
                            >
                                Save
                            </Button>
                        </Form.Item>
                    </div>
                </div>
            </Form>
        </Modal>
    )
};

export default SettingPopup;

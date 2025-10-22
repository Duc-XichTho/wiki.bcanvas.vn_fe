import React, {useContext, useEffect, useState} from "react";
import {Col, Form, Modal, Row, Typography} from "antd";
import {AddQuick, SearchQuick} from "../../../icon/IconSVG.js";
import css from './CreateQuick.module.css'
import {MyContext} from "../../../MyContext.jsx";
import {getCurrentUserLogin} from "../../../apis/userService.jsx";
import {createNewCard, getAllCard} from "../../../apis/cardService.jsx";
import {createTimestamp} from "../../../generalFunction/format.js";
import {createNewChain, getAllChain} from "../../../apis/chainService.jsx";
import {getAllSubStep} from "../../../apis/subStepService.jsx";
import {getAllStep} from "../../../apis/stepService.jsx";
import {useNavigate} from "react-router-dom";
import {NOT_DONE_YET} from "../../../Consts/STEP_STATUS.js";
import {getAllTemplate} from "../../../apis/templateService.jsx";
import DieuChuyenKho from "./DieuChuyenKho.jsx";
import CreateQuickDanhMuc from "./CreateQuickDanhMuc.jsx";
import PopUpFormCreatePhieu from "./formCreatePhieu.jsx";
import TraCuuNhanh from "./TraCuuNhanh.jsx";
import {
    CONG_NO_PHAI_THU,
    CONG_NO_PHAI_TRA,
    DANH_MUC_SP_BAN,
    DANH_SACH_KMKQKD,
    DANH_SACH_KMTC,
    DANH_SACH_NHAN_VIEN,
    TIEN_TUC_THOI,
    TON_KHO_TUC_THOI
} from "../../../Consts/TRA_CUU_NHANH_LIST.js";

const {Title} = Typography;

export default function CreateQuickMenu({onClose, open}) {
    const currentMilliseconds = Date.now();
    const [openForm, setOpenForm] = useState(false);
    const [keySelect, setKeySelect] = useState('');
    const [typeSelect, setTypeSelect] = useState('');
    const [isModalPhieuOpen, setIsModalPhieuOpen] = useState(false);
    const [isDieuChuyenKhoOpen, setIsDieuChuyenKhoOpen] = useState(false);
    const [isTraCuuNhanh, setIsTraCuuNhanh] = useState(false);
    const [optionTraCuuNhanh, setOptionTraCuuNhanh] = useState('');
    const {setLoadData, selectedCompany, currentYear, currentMonth, currentDay, chainTemplate2Selected, setChainTemplate2Selected} = useContext(MyContext)
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate()

    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };
    useEffect(() => {
        fetchCurrentUser()
    }, []);

    const handleClose = () => {
        setOpenForm(false);
        setIsModalPhieuOpen(false)
        setTypeSelect('')
        setKeySelect('')
    }


    const quickMenuData = [
        {
            title: "Tra cứu nhanh",
            options: [
                {key: TIEN_TUC_THOI, name: TIEN_TUC_THOI},
                {key: CONG_NO_PHAI_THU, name: CONG_NO_PHAI_THU},
                {key: CONG_NO_PHAI_TRA, name: CONG_NO_PHAI_TRA},
                {key: TON_KHO_TUC_THOI, name: TON_KHO_TUC_THOI},
                {key: DANH_MUC_SP_BAN, name: DANH_MUC_SP_BAN},
                {key: DANH_SACH_KMKQKD, name: DANH_SACH_KMKQKD},
                {key: DANH_SACH_KMTC, name: DANH_SACH_KMTC},
                {key: DANH_SACH_NHAN_VIEN, name: DANH_SACH_NHAN_VIEN},
            ],
            icon: SearchQuick
        },
        {
            title: "Nghiệp vụ nhanh",
            options: [
                {key: "1", name: "Thu tiền mặt", templateName: 'Phiếu thu / Báo có'},
                {key: "2", name: "Thu ngân hàng", templateName: 'Phiếu thu / Báo có'},
                {key: "3", name: "Chi tiền mặt", templateName: 'Phiếu chi / UN chi'},
                {key: "4", name: "Chi ngân hàng", templateName: 'Phiếu chi / UN chi'},
                // {key: "5", name: "Điều chuyển tiền"},
                {key: "6", name: "Hóa đơn bán", templateName: 'Hóa đơn'},
                {key: "7", name: "Đề nghị thanh toán", templateName: "Đề nghị thanh toán"},
                {key: "8", name: "Tạm ứng", templateName: "Tạm ứng"},
                {key: "9", name: "Bút toán tổng hợp", templateName: "Bút toán tổng hợp"},
            ],
            icon: AddQuick
        },
        {
            title: "Thêm danh mục",
            options: [
                {key: "khach-hang", name: "Khách hàng"},
                {key: "nha-cung-cap", name: "Nhà cung cấp"},
                {key: "soQuanLyTaiSan", name: "Mã tài sản / CCDC"},
                {key: "hop-dong", name: "Hợp đồng"}
            ],
            icon: AddQuick
        },

        {
            title: "Kho",
            options: [
                {key: "PhieuNhap", name: "Nhập kho", templateName: "Nhập kho"},
                {key: "PhieuXuat", name: "Xuất kho", templateName: "Xuất kho"},
                {key: "DieuChuyenKho", name: "Điều chuyển kho", templateName: "Điều chuyển kho"},
                // {key: "18", name: "Nghiệp vụ khác"}
            ],
            icon: AddQuick
        }
    ];

    function findNameOption(type, value) {
        let typeData = quickMenuData.find(item => item.title === type);
        if (typeData) {
            let obj = typeData.options.find(opt => opt.key == value);
            return obj
        } else {
            return 'Phiếu nhanh '
        }
    }

    const handleOpen = async (type, value) => {
        // Điều kiện kiểm tra xem cần gọi API nào
        let shouldFetchCards = false;
        let shouldFetchChains = true;
        let shouldFetchTemps = false;
        let shouldFetchSteps = false;
        let shouldFetchSubSteps = false;

        // Kiểm tra xem type nào cần dữ liệu từ API
        if (type === "Kho" || type === "Nghiệp vụ nhanh") {
            shouldFetchCards = true;
            shouldFetchChains = true;
            shouldFetchTemps = true;
            shouldFetchSteps = true;
            shouldFetchSubSteps = true;
        }

        // Chỉ gọi API khi cần thiết
        const [cards, chains, temps, allStep, subSteps] = await Promise.all([
            shouldFetchCards ? getAllCard() : Promise.resolve([]),
            shouldFetchChains ? getAllChain() : Promise.resolve([]),
            shouldFetchTemps ? getAllTemplate() : Promise.resolve([]),
            shouldFetchSteps ? getAllStep() : Promise.resolve([]),
            shouldFetchSubSteps ? getAllSubStep() : Promise.resolve([]),
        ]);

        if (type == "Thêm danh mục") {
            setOpenForm(true);
            setTypeSelect(type);
            setKeySelect(value);
        } else if (type == "Nghiệp vụ nhanh" || type == "Kho") {
            setOpenForm(false);
            let selected = findNameOption(type, value)
            if (selected) {
                let template = temps.find(item => item.name === selected.templateName);
                const steps = allStep
                    .filter(step => step.template_id == template.id)
                    .map(step => {
                        step.status = NOT_DONE_YET;
                        const mau = allStep.find(item => item.type == 'M|' + step.type);

                        step.subSteps = mau
                            ? subSteps.filter(subStep => subStep.step_id == mau.id)
                            : subSteps.filter(subStep => subStep.step_id == step.id);

                        return step;
                    });
                const data = {
                    name: `${selected.templateName} nhanh`,
                    template_id: template.id,
                    chain_id: template.chain_id,
                    cau_truc: steps,
                    created_at: createTimestamp(),
                    company: selectedCompany !== 'Toàn bộ' ? selectedCompany : '',
                    year: currentYear,
                };
                const newCard = await createNewCard(data);
                let listCard = cards.filter(card => card.template_id == template.id)
                setChainTemplate2Selected({
                    type: 'chain2',
                    data: {
                        ...chainTemplate2Selected.data,
                        selectedTemplate: {
                            ...template,
                            cards: [newCard.data, ...listCard],
                        }
                    }
                })
                navigate(`/accounting/chains/${template?.chain_id}/templates/${template?.id}/cards/${newCard?.data?.id}/steps/${steps[0].id}`);
                onClose();
            }
        } else if (type == "Tra cứu nhanh") {
            setIsTraCuuNhanh(true)
            setKeySelect(value);
        }
    };

    return (
        <>
            <Modal
                open={open}
                centered
                onCancel={onClose}
                footer={null}
                closable={false}
                width={850}
                bodyStyle={{fontFamily: "'Roboto', sans-serif"}}
                className={css.modal}
            >
                <Form layout="vertical" style={{width: "100%", maxHeight: '600px', overflowX: 'hidden',}}>
                    <Row gutter={[24, 16]}>
                        {quickMenuData.map((group, index) => (
                            <Col span={8} key={index}>
                                <h4 className={css.title}>{group.title}</h4>
                                {group.options.map((item) => (
                                    <div onClick={() => handleOpen(group.title, item.key,)}
                                         key={item.key}
                                         className={css.item}
                                    >
                                        <img src={group.icon} alt=""/>
                                        <span>{item.name}</span>
                                    </div>
                                ))}
                            </Col>
                        ))}
                    </Row>
                </Form>
            </Modal>
            {
                openForm && <CreateQuickDanhMuc onClose={handleClose}
                                                open={openForm}
                                                keySelect={keySelect}
                                                typeSelect={typeSelect}
                />
            }
            {
                isModalPhieuOpen && <PopUpFormCreatePhieu table={keySelect}
                                                          onClose={() => setIsModalPhieuOpen(false)}
                                                          open={isModalPhieuOpen}
                                                          reload={() => {
                                                          }}
                                                          currentUser={currentUser}
                />

            }
            {
                isDieuChuyenKhoOpen && <DieuChuyenKho open={isDieuChuyenKhoOpen}
                                                      onClose={() => setIsDieuChuyenKhoOpen(false)}
                                                      table={keySelect}
                />
            }
            {
                isTraCuuNhanh && <TraCuuNhanh open={isTraCuuNhanh}
                                              onClose={() => setIsTraCuuNhanh(false)}
                                              table={keySelect}
                />
            }

        </>
    );
}

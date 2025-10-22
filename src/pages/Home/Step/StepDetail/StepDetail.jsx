import SubStepItem from "../../SubStep/SubStepItem/SubStepItem.jsx";
import css from './StepDetail.module.css'
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCardDataById, updateCard } from "../../../../apis/cardService.jsx";
import { DONE, DUYET1, NOT_DONE_YET, PENDING } from "../../../../Consts/STEP_STATUS.js";
import { MyContext } from "../../../../MyContext.jsx";
import { getAllSubStep } from "../../../../apis/subStepService.jsx";
import { getCurrentUserLogin } from "../../../../apis/userService.jsx";
import { Button, ConfigProvider, message } from "antd";
import { getUserClassByEmail } from "../../../../apis/userClassService.jsx";
import { BoBuocIcon } from "../../../../icon/IconSVG.js";
import { getDonHangByCode, updateDonHang } from "../../../../apis/donHangService.jsx";
import { getDonMuaHangByCode, updateDonMuaHang } from "../../../../apis/donMuaHangService.jsx";
import { SA, SF } from "../../../../Consts/LIST_STEP_TYPE.js";

const checkPermissions = (id, userClassData, accessType) => {
    const defaultPermissions = {
        id,
        read: false,
        create: false,
        delete: false,
        update: false,
        confirm: false,
        approve1: false,
        approve2: false,
    };

    const matchingRecords = userClassData
        .flatMap((permission) => permission[accessType])
        .filter((access) => access?.id == id);

    if (!matchingRecords.length) return defaultPermissions;

    return matchingRecords.reduce((acc, record) => {
        Object.keys(acc).forEach((key) => {
            if (key !== 'id') {
                acc[key] = acc[key] || record.permissions[key];
            }
        });
        return acc;
    }, defaultPermissions);
};

export default function StepDetail() {
    const { idCard, idStep } = useParams();
    const codeDonHang = `DH|${idCard}`;
    const [listSubStep, setListSubStep] = useState([]);
    const [step, setStep] = useState(null);
    const [card, setCard] = useState({});
    const {
        setLoadData,
    } = useContext(MyContext);
    const [currentUser, setCurrentUser] = useState(null);
    const [userClassOfCurrentUser, setUserClassOfCurrentUser] = useState([]);
    const [permissionsStep, setPermissionsStep] = useState({});
    const [permissionsSubStep, setPermissionsSubStep] = useState([]);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const { data } = await getCurrentUserLogin();
            if (data) setCurrentUser(data);
        } catch (error) {
            console.error("Error fetching current user:", error);
        }
    }, []);

    const fetchUserPermissions = useCallback(async () => {
        try {
            const data = await getUserClassByEmail();
            const filteredData = data.filter(item => item.module === 'SAB-FA');
            setUserClassOfCurrentUser(filteredData);
        } catch (error) {
            console.error("Error fetching user permissions:", error);
        }
    }, []);

    const fetchSubSteps = useCallback(async () => {
        try {
            const data = await getAllSubStep();
            const filteredSubSteps = data.filter(item => item.step_id == idStep);
            filteredSubSteps.sort((a, b) => a.position - b.position);
            setListSubStep(filteredSubSteps);
        } catch (error) {
            console.error("Error fetching sub steps:", error);
        }
    }, [idStep]);

    const fetchCardData = useCallback(async () => {
        try {
            const data = await getCardDataById(idCard);

            setCard(data);

            const stepData = data.cau_truc.find(item => item.id == idStep);
            setStep(stepData);

            if (stepData?.subSteps) {
                const permissions = stepData.subSteps.map(subStep =>
                    checkPermissions(subStep.id, userClassOfCurrentUser, "subStepAccess")
                );
                setPermissionsSubStep(permissions);
            }
        } catch (error) {
            console.error("Error fetching card data:", error);
        }
    }, [idCard, idStep, userClassOfCurrentUser]);

    const changeStatus = async (status) => {
        try {
            let updatedStep = { ...step, status };
            let updateCardPayload = {
                ...card,
                cau_truc: card.cau_truc.map((s) => (s.id == idStep ? updatedStep : s)),
            };

            if (step.type === SA) {
                const donBanHang = await getDonHangByCode(codeDonHang);

                if (!donBanHang || Object.keys(donBanHang).length === 0) {
                    message.warning("Đơn Bán Hàng chưa được khởi tạo!");
                    return;
                }

                await updateDonHang(donBanHang.id, { trang_thai: "done" });

                if (status == PENDING || status == DONE) {
                    updateCardPayload.so_tien =
                        Number(donBanHang.tien_truoc_thue) + Number(donBanHang.tien_thue);
                    updateCardPayload.mo_ta = donBanHang.ngay_dat_hang;
                    const codeKhachHang = donBanHang.code_khach_hang;
                    const nameKhachHang = donBanHang.name_khach_hang;
                    updateCardPayload.mo_ta2 = `${codeKhachHang} - ${nameKhachHang}`;
                    updateCardPayload.trang_thai = "Đang TH";
                }

            } else if (step.type === SF) {
                const deNghiMua = await getDonMuaHangByCode(codeDonHang);

                if (!deNghiMua || Object.keys(deNghiMua).length === 0) {
                    message.warning("Đề Nghị Mua Hàng chưa được khởi tạo!");
                    return;
                }

                await updateDonMuaHang(deNghiMua.id, { trang_thai: "done" });

                if (status == PENDING || status == DONE) {
                    updateCardPayload.so_tien =
                        Number(deNghiMua.tien_truoc_thue) + Number(deNghiMua.tien_thue);
                    updateCardPayload.mo_ta = deNghiMua.ngay_mua_hang;
                    const codeBoPhanDeNghi = deNghiMua.code_bo_phan_de_nghi;
                    const nameBoPhanDeNghi = deNghiMua.name_bo_phan_de_nghi;
                    updateCardPayload.mo_ta2 = `${codeBoPhanDeNghi} - ${nameBoPhanDeNghi}`;
                    updateCardPayload.trang_thai = "Đang TH";
                }
            }





            if (status == DONE) {
                updateCardPayload.trang_thai = "Hoàn thành";
                message.success('Duyệt thành công.');
                setLoadData(pre => !pre);
            }
            // else {
            //     message.success('Đã xác nhận.');
            //     setLoadData(pre => !pre);
            // }

            await updateCard(updateCardPayload).then(() => {
                setStep(updatedStep);
            });
        } catch (error) {
            console.error("Error changing status:", error);
            setLoadData(pre => !pre);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    useEffect(() => {
        if (currentUser) fetchUserPermissions();
    }, [currentUser, fetchUserPermissions]);

    useEffect(() => {
        fetchSubSteps();
        fetchCardData();
    }, [fetchSubSteps, fetchCardData]);

    useEffect(() => {
        if (userClassOfCurrentUser.length > 0) {
            setPermissionsStep(checkPermissions(idStep, userClassOfCurrentUser, "stepAccess"));
        }
    }, [idStep, userClassOfCurrentUser]);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Khi subSteps thay đổi, kích hoạt loading
        if (step?.subSteps) {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 500); // Giả lập thời gian xử lý
        }
    }, [step?.subSteps]);


    return (
        <div className={css.stepDetailContainer}>
            <div className={css.subStepContainer}>
                {/*{isLoading && (*/}
                {/*    <div*/}
                {/*        style={{*/}
                {/*            display: 'flex',*/}
                {/*            justifyContent: 'center',*/}
                {/*            alignItems: 'center',*/}
                {/*            height: '76%',*/}
                {/*            position: 'absolute',*/}
                {/*            width: '68%',*/}
                {/*            zIndex: '1000',*/}
                {/*            backgroundColor: 'rgba(255, 255, 255, 0.96)',*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        <img src='/loading_moi_2.svg' alt="Loading..." style={{width: '650px', height: '550px'}}/>*/}
                {/*    </div>*/}
                {/*)}*/}

                {step?.subSteps?.sort((a, b) => a.position - b.position).map((subStep) => (
                    <SubStepItem
                        key={subStep.id}
                        subStep={subStep}
                        idCard={idCard}
                        listSubStep={step.subSteps}
                        permissionsSubStep={permissionsSubStep.find(p => p.id == subStep.id)}
                    />
                ))}
            </div>
            <div className={css.stepDetailButtonContainer}>
                {step?.skipable && (
                    <Button
                        type="default"
                        onClick={() => changeStatus(DONE)}
                        style={{
                            backgroundColor: '#9E9E9E',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <img
                            src={BoBuocIcon}
                            alt="Bỏ bước"
                            style={{
                                width: '16px',
                                height: '16px',
                            }}
                        />
                        <span>Bỏ bước</span>
                    </Button>
                )}
                <ConfigProvider>
                    {/* Nút "Xác nhận" */}
                    {/* <Button
                        type="primary"
                        onClick={() => changeStatus(PENDING)}
                        disabled={step?.status !== NOT_DONE_YET}
                        style={{
                            backgroundColor: (step?.status === NOT_DONE_YET) ? '#2AA75E' : '#CDEBD2',
                            color: (step?.status === NOT_DONE_YET) ? '#fff' : '#262626',
                            fontWeight: 450
                        }}
                    >
                        {(step?.status === NOT_DONE_YET) ? 'Xác nhận' : 'Đã xác nhận'}
                    </Button> */}

                    {/* Nút "Duyệt 1" */}
                    {/* <Button
                        type="default"
                        onClick={() => changeStatus(DUYET1)}
                        disabled={step?.status !== PENDING}
                        style={{
                            backgroundColor: (step?.status === PENDING) ? '#2AA75E' : (step?.status === NOT_DONE_YET) ? '#d9d9d9' : '#CDEBD2',
                            color: (step?.status === PENDING) ? 'white' : '#262626',
                            fontWeight: 450
                        }}
                    >
                        {(step?.status === DUYET1 || step?.status === DONE) ? 'Đã duyệt 1' : 'Duyệt 1'}
                    </Button> */}

                    {/* Nút "Duyệt 2" Bỏ không dùng */}
                    {/* <Button
                        type="default"
                        onClick={() => changeStatus(DONE)}
                        disabled={step?.status !== DUYET1}
                        style={{
                            backgroundColor: (step?.status === DUYET1) ? '#2AA75E' : (step?.status === PENDING || step?.status === NOT_DONE_YET) ? '#d9d9d9' : '#CDEBD2',
                            color: (step?.status === NOT_DONE_YET || step?.status === PENDING) ? '#262626' : (step?.status === DUYET1) ? 'white' : '#262626',
                            fontWeight: 450
                        }}
                    >
                        {(step?.status === DONE) ? 'Đã duyệt 2' : 'Duyệt 2'}
                    </Button> */}
                    {/* <Button
                        type="default"
                        onClick={() => changeStatus(DONE)}
                        disabled={step?.status !== PENDING}
                        style={{
                            backgroundColor: (step?.status === PENDING) ? '#2AA75E' : (step?.status === NOT_DONE_YET) ? '#d9d9d9' : '#CDEBD2',
                            color: (step?.status === PENDING) ? 'white' : '#262626',
                            fontWeight: 450
                        }}
                    >
                        {(step?.status === DONE) ? 'Đã duyệt' : 'Duyệt'}
                    </Button> */}
                </ConfigProvider>


            </div>
        </div>
    );
}

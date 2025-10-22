import {getAllSettingGroup} from "../../apisKTQT/settingGroupService.jsx";
import {useContext, useState} from "react";
import {MyContext} from "../../MyContext.jsx";
import {getAllCompany} from "../../apis/companyService.jsx";
import {KHONG_THE_TRUY_CAP} from "../../Consts/TITLE_HEADER.js";


export async function getPermissionDataNhomBC(type, user, userClasses, fetchUserClasses, uCSelected_CANVAS, data) {
    if (!(userClasses?.length > 0)) {
        fetchUserClasses();
    }

    const setting = await getAllSettingGroup();
    let userAccess = [];

    for (const e of userClasses) {
        if (e?.module === 'CANVAS' && e.id == uCSelected_CANVAS) {
            userAccess = e?.reportChartGroup?.[type] || [];
        }
    }

    if (user.data?.isAdmin) {
        return data
    } else {
        if (data) {
            let filterSetting = setting.filter(s => userAccess?.includes(s.id))
            if (filterSetting?.length > 0) {
                return data.filter(e => filterSetting.some(s => s?.name == e?.group))
            }
        } else {
            return []
        }
    }

}
export async function getPermissionDataNhomDV(type, user, userClasses, fetchUserClasses, uCSelected_CANVAS, data) {
    if (!(userClasses?.length > 0)) {
        fetchUserClasses();
    }

    const setting = await getAllSettingGroup();
    let userAccess = [];

    for (const e of userClasses) {
        if (e?.module === 'CANVAS' && e.id == uCSelected_CANVAS) {
            userAccess = e?.reportChartGroup?.[type] || [];
        }
    }

    if (user.data?.isAdmin) {
        return data
    } else {
        if (data) {
            let filterSetting = setting.filter(s => userAccess?.includes(s.id))
            if (filterSetting?.length > 0) {
                return data.filter(e => filterSetting.some(s => `${s?.stt}-${s?.name}` == (e?.group)))
            }

        } else {
            return []
        }
    }

}

export async function getPermissionDataCty(type, user, userClasses, fetchUserClasses, uCSelected_CANVAS) {
    if (!(userClasses?.length > 0)) {
        fetchUserClasses();
    }

    const company = await getAllCompany();
    let userAccess = new Set();

    for (const e of userClasses) {
        if (e?.module === 'CANVAS' && e.id == uCSelected_CANVAS) {

            userAccess = e?.reportChartGroup?.[type] || [];

        }
    }
    if (userAccess.includes('all')) {
        return [...company,{id: 99999999,name: 'HQ - Hợp nhất', code: 'HQ'}]
    } else {
        return company.filter(s => userAccess.includes(s.id));
    }

}

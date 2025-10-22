import {getAllSettingGroup} from "../../apisKTQT/settingGroupService.jsx";
import {useContext, useState} from "react";
import {MyContext} from "../../MyContext.jsx";
import {getAllFileNotePad, getFileNotePadByIdController} from "../../apis/fileNotePadService.jsx";
import {KHONG_THE_TRUY_CAP} from "../../Consts/TITLE_HEADER.js";


export async function getPermissionDataBC(key, user, userClasses, fetchUserClasses) {
    let data = await getAllFileNotePad()
    data = data.find(e => e?.type?.includes(key))
    if (!(userClasses?.length > 0)) {
        fetchUserClasses()
    }
    let userAccess = []
    if (user.data?.isAdmin) {
        return data.name;
    } else {

        for (const e of userClasses) {
            if (e?.module == 'CANVAS') {
                if (e?.userAccess.includes(user.data?.email)) {
                    userAccess = userAccess.concat(e?.reportChart)
                }
            }
        }
        if (userAccess.includes(data.type)) {
            return data?.name

        } else {
            return KHONG_THE_TRUY_CAP
        }
    }
}
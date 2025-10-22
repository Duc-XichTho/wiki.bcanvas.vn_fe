import {getAllSettingGroup} from "../../../../apisKTQT/settingGroupService.jsx";

export async function permissionForKtqt(user, userClasses, fetchUserClasses) {
    // if (!(userClasses?.length > 0)) {
    //     fetchUserClasses();
    // }
    //
    // const setting = await getAllSettingGroup();
    // let userAccess = [];
    //
    // for (const e of userClasses) {
    //
    //     if (e?.module === 'SAB-FA' &&  e.userAccess.includes(user.data?.email)) {
    //         userAccess = e?.info || [];
    //
    //     }
    // }
    //
    // if (user.data?.isAdmin) {
    //     return true
    // } else {
    //     return userAccess?.includes('edit');
    // }
return true
}
export async function permissionForViewKTQT(user, userClasses, fetchUserClasses) {
    // if (!(userClasses?.length > 0)) {
    //     fetchUserClasses();
    // }
    //
    // const setting = await getAllSettingGroup();
    // let userAccess = [];
    //
    // for (const e of userClasses) {
    //
    //     if (e?.module === 'SAB-FA' &&  e.userAccess.includes(user.data?.email)) {
    //         userAccess = userAccess.concat(e?.info || []) ;
    //
    //     }
    // }
    // if (user.data?.isAdmin) {
    //     return true
    // } else {
    //
    //     return userAccess?.includes('edit') || userAccess?.includes('view');
    // }
return true
}
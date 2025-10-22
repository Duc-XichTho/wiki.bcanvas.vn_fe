export function setPermissionsListUnit(listUnit, currentUser){

    if(currentUser?.isAdmin|| currentUser?.permissions?.listBU?.includes('ALL') ){
        listUnit.push({name:'Total', code: 'Total', groupKH: 'Total'});
        return listUnit
    }
    else {
        try {
            let listGroupKH= listUnit.filter(e=>currentUser.permissions.listBU.some(bu => bu === e.code) ).map(m=> m.groupKH)
            listUnit = listUnit.filter(e => listGroupKH.some(u => u === e.groupKH));
            return listUnit
        }catch (e){
            console.log(e)
            return []
        }

    }
}

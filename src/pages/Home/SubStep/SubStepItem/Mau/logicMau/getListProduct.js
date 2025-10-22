export function getListProductTU(data, kmfs, kmns, vuViecs) {
    let key = 100;
    data.forEach((item) => {
        item.key = key++;
        let kmf = kmfs.find(kmf => kmf.code == item.code_kmf);
        if (kmf) {
            item.id_kmf = kmf.id;
        }
        let km = kmns.find(km => km.code == item.code_kmns);
        if (km) {
                item.id_kmns = km.id;
        }
        let vv = vuViecs.find(vv => vv.code == item.code_vu_viec);
        if (vv) {
            item.id_vu_viec = vv.id;
        }
        item.don_gia = item.gia_ban
        item.thue = item.thue_vat
    })
    return data;
}
export function getListProductDNTT(data, kmfs, kmns, vuViecs) {
    let key = 100;
    data.forEach((item) => {
        item.key = key++;
        let kmf = kmfs.find(kmf => kmf.code == item.code_kmf);
        if (kmf) {
            item.id_kmf = kmf.id;
        }
        let km = kmns.find(km => km.code == item.code_kmns);
        if (km) {
                item.id_kmns = km.id;
        }
        let vv = vuViecs.find(vv => vv.code == item.code_vu_viec);
        if (vv) {
            item.id_vu_viec = vv.id;
        }

        item.code_hang_hoa = item.code
        item.id_hang_hoa = item.id_hang_hoa
    })

    return data;
}

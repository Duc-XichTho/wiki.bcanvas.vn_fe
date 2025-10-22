import {filterGroup} from "../../functionKTQT/chartSetUp/setUpSection.js";

export function calculateDataTeam(data, kmfList, currentMonth, teamListDB) {
    const teamOrder = {};
    teamListDB.forEach(entry => {
        teamOrder[entry.code] = entry.stt;
    });
    kmfList.forEach((item) => {
        item.group = item.group ? item.group.split('.')[1] : 'Khác';
    })
    let uniqueGroupsKMF = filterGroup([...new Set(kmfList.map((unit) => unit.group))]).sort();
    uniqueGroupsKMF = uniqueGroupsKMF.map(e =>
        e.split('.')[1] ? e.split('.')[1] : e
    )
    const groupMap = kmfList.reduce((acc, item) => {
        if (!acc[item.group]) {
            acc[item.group] = [];
        }
        acc[item.group].push(item.name);
        return acc;
    }, {});
    data = data.filter((e) => e.pl_type && e.pl_type !== '' && e.pl_value);
    let teamList = new Map(data.map((item) => [item.team_code, {team: item.team_code || null}]));
    teamList = Array.from(teamList.values());
    teamList.sort((a, b) => {
        const sttA = teamOrder[a.team] || Infinity;
        const sttB = teamOrder[b.team] || Infinity;
        return sttA - sttB;
    });
    let result = [];
    let countLayer = 1;
    teamList.forEach((e) => {
        if (e.team !== null) {
            let layer = countLayer++;
            result.push({kmf: e.team, layer: layer + ''});
        }
    });
    // result.push({kmf: null, layer: countLayer + ''});
    let currentLayer = 1;
    let layerMap = {};
    result.forEach((r) => {
        layerMap[r.kmf] = r.layer;
    });
    teamList.forEach((item) => {
        let parentLayer = layerMap[item.team];
        if (parentLayer) {
            uniqueGroupsKMF.forEach((e) => {
                let baseLayer = parentLayer.toString().split('.')[0];
                let isUniqueInBaseLayer = !result.some((r) => r.kmf === e && r.layer.toString().startsWith(baseLayer));
                if (isUniqueInBaseLayer) {
                    const newLayer = `${parentLayer}.${currentLayer}`;
                    result.push({
                        kmf: e,
                        layer: newLayer,
                    });
                    currentLayer++;
                }
            })
        }
    });
    result.forEach((item) => {
        for (let month = 1; month <= 12; month++) {
            item[`${month}`] = 0;
        }
    });
    const totals = {};
    data.forEach((item) => {
        let groupKey = null;
        for (const [group, codes] of Object.entries(groupMap)) {
            if (codes.includes(item.kmf)) {
                groupKey = group;
                break;
            }
        }
        if (groupKey) {
            const key = `${groupKey}*${+item.month}*${item.team_code}`;
            if (!totals[key]) {
                totals[key] = 0;
            }
            totals[key] += parseFloat(item.pl_value);
        }
    });
    result.forEach((item) => {
        let parentLayer = item.layer.split('.')[0];
        let parent = result.find((r) => r.layer == parentLayer);
        for (const key in totals) {
            const [groupKey, month, team_code] = key.split('*');
            if (item.kmf === groupKey && team_code == String(parent.kmf)) {
                item[`${month}`] = totals[key];
            }
        }
    });
    let groupedResult = result.reduce((acc, item) => {
        let parentLayer = item.layer.split('.')[0];
        if (!acc[parentLayer]) {
            acc[parentLayer] = [];
        }
        acc[parentLayer].push(item);

        return acc;
    }, {});
    for (let parentLayer in groupedResult) {
        groupedResult[parentLayer].sort((a, b) => b[0] - a[0]);
    }
    let sortedResult = Object.values(groupedResult).flat();

    result = sortedResult;

    result.forEach((item) => {
        if (!item.layer.includes('.')) {
            for (let month = 1; month <= 12; month++) {
                const layerPrefix = item.layer + '.';
                const layerItems = result.filter((subItem) => subItem.layer && subItem.layer.startsWith(layerPrefix));
                const total = layerItems.reduce((acc, subItem) => acc + (subItem[`${month}`] || 0), 0);
                item[`${month}`] = total;
            }
        }
    });
    result.forEach((item) => {
        item[`0`] = 0;
        for (let month = 1; month <= 12; month++) {
            item[`0`] += item[`${month}`];
        }
    });
    result.forEach((item) => {
        item['change'] = [];
        for (let i = 1; i <= currentMonth; i++) {
            item['change'].push(Math.abs(item[`${i}`]));
        }
        if (!item.layer.includes('.')) {
            item.dp = teamListDB.find(e => e.code === item.kmf)?.dp || ''
        } else {
            item.dp = item.kmf
        }
    });
    result.sort((a, b) => {
        const prefixA = a.layer.split('.')[0];
        const prefixB = b.layer.split('.')[0];
        if (prefixA === prefixB) {
            const t0A = a["0"];
            const t0B = b["0"];
            if (t0A > 0 && t0B > 0) return t0B - t0A;
            if (t0A > 0) return -1;
            if (t0B > 0) return 1;
            return Math.abs(t0A) - Math.abs(t0B);
        }
        return 0;
    });
    return result;
}


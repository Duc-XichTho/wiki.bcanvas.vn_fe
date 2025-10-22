import '../../../index.css';
import React, { useEffect, useState } from 'react';
import { styled } from '@mui/system';
import { Tabs } from '@mui/base/Tabs';
import { TabsList as BaseTabsList } from '@mui/base/TabsList';
import { TabPanel as BaseTabPanel } from '@mui/base/TabPanel';
import { buttonClasses } from '@mui/base/Button';
import { Tab as BaseTab, tabClasses } from '@mui/base/Tab';
import HSFS from './HSFS.jsx';
import BaoCaoCDTC from './CDTC/BaoCaoCDTC.jsx';
import BaoCaoPBNhomSP from './KQKD/SP/BaoCaoPBNhomSP.jsx';
import BaoCaoThuChi from "./ThuChi/BaoCaoThuchi.jsx";
import BaoCaoPBT from "./KQKD/Team/BaoCaoPBT.jsx";
import BaoCaoPBNhomSP2 from "./KQKD/SP/BaoCaoPBNhomSP2.jsx";
import { getCurrentUserLogin } from "../../../apis/userService.jsx";
import { ENUM_SUB_TAB } from "../../../Consts/ENUM_SUB_TAB.js";
import BaoCaoTongQuat from "./BaoCaoTongQuat.jsx";
import BaoCaoGroupUnit from "./KQKD/DV/BaoCaoGroupUnit.jsx";
import BaoCaoGroupMonth from "./KQKD/DV/BaoCaoGroupMonth.jsx";


export default function BaoCaoTaiChinh({ company }) {
    const [currentUser, setCurrentUser] = useState(null);
    const { viewPermissions, editPermissions } = currentUser?.permissions ? currentUser?.permissions : {};
    const availableTabs = Object.entries(ENUM_SUB_TAB.BAOCAO_TAICHINH)
    //     .filter(([key, value]) => {
    //     if (!viewPermissions) return false;
    //     return viewPermissions.includes(value) || editPermissions.includes(value) || currentUser?.isAdmin || viewPermissions.some(permission => permission.includes('ALL')) ||
    //         editPermissions.some(permission => permission.includes('ALL'));
    //     ;
    // });

    const fetchCurrentUser = async () => {
        const { data, error } = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const defaultTabValue = availableTabs.length > 0 ? availableTabs[0][0] : 1;

    return (
        <>
            <Tabs defaultValue={defaultTabValue}>
                <TabsList>
                    {availableTabs.map(([key, value], index) => (
                        <Tab key={key} value={key}>{value}</Tab>
                    ))}
                </TabsList>
                <TabPanel value="TONGQUAT">
                    <BaoCaoTongQuat company={company} />
                </TabPanel>
                <TabPanel value="KQKD_NHOMDV">
                    <BaoCaoGroupUnit company={company} />
                </TabPanel>
                <TabPanel value="KQKD_NHOMDV2">
                    <BaoCaoGroupMonth company={company} />
                </TabPanel>
                {/*<TabPanel value="KQKD_DV">*/}
                {/*    <BaoCaoPBDV company={company}/>*/}
                {/*</TabPanel>*/}
                <TabPanel value="KQKD_NHOMSP">
                    <BaoCaoPBNhomSP company={company} />
                </TabPanel>
                <TabPanel value="KQKD_NHOMSP2">
                    <BaoCaoPBNhomSP2 company={company} />
                </TabPanel>
                {/*<TabPanel value="KQKD_SP">*/}
                {/*    <BaoCaoPBSP company={company}/>*/}
                {/*</TabPanel>*/}
                {/*<TabPanel value="KQKD_NHOMDEAL">*/}
                {/*    <BaoCaoGroupDeal company={company}/>*/}
                {/*</TabPanel>*/}
                {/*<TabPanel value="KQKD_DEAL">*/}
                {/*    <BaoCaoDeal company={company}/>*/}
                {/*</TabPanel>*/}
                <TabPanel value="HESO_TAICHINH">
                    <HSFS company={company} />
                </TabPanel>
                <TabPanel value="CANDOI_TAICHINH">
                    <BaoCaoCDTC company={company} />
                </TabPanel>
                <TabPanel value="DONGTIEN">
                    <BaoCaoThuChi company={company} />
                </TabPanel>
                <TabPanel value="KQKD_Team">
                    <BaoCaoPBT company={company} />
                </TabPanel>
            </Tabs>
        </>
    );
}


const Tab = styled(BaseTab)`
  color: var(--text-color);
  cursor: pointer;
  font-weight: 400;
  background-color: transparent;
  line-height: 1.5;
  padding: 0px 70px 20px 0px;
  display: inline-block;
  text-align: center;
  font-size: 16px;
  border: none;

  &.${tabClasses.selected} {
    color: var(--text-color);
    font-weight: bold;
  }

  &.${buttonClasses.disabled} {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TabPanel = styled(BaseTabPanel)`
  flex: 1;
  margin-top: 1em;
`;

const TabsList = styled(BaseTabsList)`
  display: inline-block;
  width: 100%;
  height: 40px;
`;

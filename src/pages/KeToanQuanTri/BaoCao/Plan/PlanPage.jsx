import '../../../../../index.css';
import React from 'react';
import {styled} from '@mui/system';
import {Tabs} from '@mui/base/Tabs';
import {TabsList as BaseTabsList} from '@mui/base/TabsList';
import {TabPanel as BaseTabPanel} from '@mui/base/TabPanel';
import {buttonClasses} from '@mui/base/Button';
import {Tab as BaseTab, tabClasses} from '@mui/base/Tab';
import Plan from "./Plan.jsx";
import PlanActual from "./PlanActual.jsx";
import ActualCungKy from "./ActualCungKy.jsx";
import {ENUM_SUB_TAB} from "../../../../../CONST.js";

export default function PlanPage() {
    return (
        <>
            <Tabs defaultValue={1}>
                <TabsList>
                    <Tab value={1}>{ENUM_SUB_TAB.KEHOACH_THUCHIEN.KEHOACH_KQKD}</Tab>
                    <Tab value={2}>{ENUM_SUB_TAB.KEHOACH_THUCHIEN.SOSANH_KH_TH}</Tab>
                    <Tab value={3}>{ENUM_SUB_TAB.KEHOACH_THUCHIEN.SOSANH_TH_CUNGKY}</Tab>
                </TabsList>
                <TabPanel value={1}>
                    <Plan company={'HQ'}/>
                </TabPanel>
                <TabPanel value={2}>
                    <PlanActual company={'HQ'}/>
                </TabPanel>
                <TabPanel value={3}>
                    <ActualCungKy company={'HQ'}/>
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
    padding: 0px 16px;
    display: inline-block;
    text-align: center;
    font-size: 16px;

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
    width: 100%;
`;

const TabsList = styled(BaseTabsList)`
    display: inline-block;
    width: 106%;
    padding: 0px 0 !important;
    height: 40px;
`;


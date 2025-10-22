import React, { useContext, useEffect, useRef, useState } from 'react';
import { styled } from '@mui/system';
import {Tabs, Tabs as BaseTabs} from '@mui/base/Tabs';
import { TabsList as BaseTabsList } from '@mui/base/TabsList';
import { TabPanel as BaseTabPanel } from '@mui/base/TabPanel';
import { buttonClasses } from '@mui/base/Button';
import { Tab as BaseTab, tabClasses } from '@mui/base/Tab';
import SoKeToan from '../SoKeToan.jsx';
// import Luong from "../Luong.jsx";

export default function SKTDieuChinh() {
  return (
    <>
      <Tabs defaultValue={1}>
        <TabsList>
          <Tab value={1}>SKTConsol</Tab>
          <Tab value={2}>SKTInternal</Tab>
        </TabsList>
        <TabPanel value={1}>
          <SoKeToan company={'Group'} />
        </TabPanel>
        <TabPanel value={2}>
          <SoKeToan company={'Internal'} />
        </TabPanel>
      </Tabs>
    </>
  );
}


const Tab = styled(BaseTab)`
  color: #454545;
  cursor: pointer;
  font-weight: 400;
  background-color: transparent;
  line-height: 1.5;
  padding: 0px 70px 20px 0px;
  display: inline-block;
  text-align: center;
  font-size: 16px;

  &.${tabClasses.selected} {
    color: #1976d2;
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


import Kmf from './Kmf.jsx';
import Kmns from './Kmns.jsx';
import styled from 'styled-components';
import {Tabs} from '@mui/base/Tabs';
import {TabsList as BaseTabsList} from '@mui/base/TabsList';
import {TabPanel as BaseTabPanel} from '@mui/base/TabPanel';
import {buttonClasses} from '@mui/base/Button';
import {Tab as BaseTab, tabClasses} from '@mui/base/Tab';
import Project from './Project.jsx';
import Product from './Product.jsx';
import Vendor from './Vendor.jsx';
import Unit from "./Unit.jsx";
import Team from "./Team.jsx";
import Kenh from "./Kenh.jsx";
import CostPool from "./CostPool.jsx";
import {useContext, useState} from "react";
import {MyContext} from "../../../MyContext.jsx";
import {Modal} from "antd";

export default function DMKM({company}) {
    const {checkUpdate, setCheckUpdate} = useContext(MyContext);
    const [activeTab, setActiveTab] = useState(1);
    const handleTabChange = (newTab) => {
        // if (checkUpdate) {
        //     Modal.confirm({
        //         title: 'Xác nhận',
        //         content: 'Bạn có chắc chắn muốn rời khỏi mà không lưu dữ liệu?',
        //         okText: 'Tiếp tục',
        //         cancelText: 'Hủy',
        //         onOk: () => {
        //             setCheckUpdate(false);
        //             setActiveTab(newTab);
        //         },
        //     });
        // } else {
        //     setActiveTab(newTab);
        // }
        setActiveTab(newTab);

    };
    return (
        <>
            <Tabs value={activeTab} onChange={(event, value) => handleTabChange(value)}>
                <TabsList>
                    <Tab value={1}>Danh mục KQKD</Tab>
                    {/*<Tab value={2}>Danh mục KMTC</Tab>*/}
                    <Tab value={3}>Danh mục Đơn vị</Tab>
                    <Tab value={5}>Danh mục Vụ việc</Tab>
                    <Tab value={6}>Danh mục Sản phẩm</Tab>
                    <Tab value={8}>Danh mục Kênh</Tab>
                    {/*<Tab value={7}>Danh mục Khách hàng</Tab>*/}
                    {/*<Tab value={9}>Danh mục Nhóm chi phí</Tab>*/}
                </TabsList>

                <TabPanel value={1}><Kmf company={company} /></TabPanel>
                <TabPanel value={2}><Kmns company={company} /></TabPanel>
                <TabPanel value={3}><Unit company={company} /></TabPanel>
                <TabPanel value={4}><Team company={company} /></TabPanel>
                <TabPanel value={5}><Project company={company} /></TabPanel>
                <TabPanel value={6}><Product company={company} /></TabPanel>
                <TabPanel value={7}><Vendor company={company} /></TabPanel>
                <TabPanel value={8}><Kenh company={company} /></TabPanel>
                <TabPanel value={9}><CostPool company={company} /></TabPanel>
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
  padding: 0px 50px 20px 0px;
  display: inline-block;
  text-align: center;
  font-size: 16px;
  border : none;

  &.${tabClasses.selected} {
    color: #248627;
    font-weight: bold;
  }

  &.${buttonClasses.disabled} {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TabPanel = styled(BaseTabPanel)`
  flex: 1;

`;

const TabsList = styled(BaseTabsList)`
  display: inline-block;
  width: 100%;
  height: 40px;
`;

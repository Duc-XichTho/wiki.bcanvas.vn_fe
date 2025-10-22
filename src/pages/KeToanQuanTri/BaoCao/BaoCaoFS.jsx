import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import 'ag-grid-enterprise';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ModuleRegistry } from '@ag-grid-community/core';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import Joyride, { STATUS } from 'react-joyride';
import './BaoCao.css';

import BaoCaoKQKDFS from './BaoCaoKQKDFS.jsx';
import BaoCaoThuChiFS from './ThuChi/BaoCaoThuChiFS.jsx';
import BaoCaoCDTC from './CDTC/BaoCaoCDTC.jsx';
import { IoIosArrowBack, IoIosArrowDown } from 'react-icons/io';
import HSFS from './HSFS.jsx';
import styles from './FinanceDashboard/BI/BI.module.css';
import clsx from 'clsx';
import AnalysisSideBarV2 from '../../function/analysisSideBarv2.jsx';
import ViewDataPopup from './FinanceDashboard/BI/chartComponent/ViewData.jsx';
import { getAllSoKeToan } from '../../../../apisKTQT/soketoanService.jsx';
import { getAllKmf } from '../../../../apisKTQT/kmfService.jsx';
import { getAllUnits } from '../../../../apisKTQT/unitService.jsx';
import { getAllProduct } from '../../../../apisKTQT/productService.jsx';
import {calculateDataViewKQKDFS2} from "./logic/logicKQKDFS.js";
import {calculateData} from "./KQKD/logicKQKD.js";
import {CURRENT_MONTH} from "../../../../CONST.js";
ModuleRegistry.registerModules([ClientSideRowModelModule, RowGroupingModule, SetFilterModule]);

export default function BaoCaoFS({company}) {
  const [isHSFS, setIsHSFS] = useState(true);
  const [isKQKDOpen, setIsKQKDOpen] = useState(false);
  const [isThuChiOpen, setIsThuChiOpen] = useState(false);
  const [isCDTCOpen, setIsCDTCOpen] = useState(false);
  const [isOverallNotePopupOpened, SetIsOverallNotePopupOpened] = useState(false);
  const [isViewDataPopupOpened, SetISViewDataPopup] = useState(false);
  const [dataOverrall, SetDataOverall] = useState({});
  const [run, setRun] = useState(false); // State to control Joyride
  const steps = [
    // Declare steps as a normal array
    {
      target: '.collapsible-1',
      content: <h2>Đây là phần chỉ số tài chính!</h2>,
    },
    {
      target: '.collapsible-2',
      content: <h2>Đây là phần báo cáo kết quả kinh doanh!</h2>,
    },
    {
      target: '.collapsible-3',
      content: 'Đây là phần báo cáo thu chi!',
      title: 'Báo cáo thu chi',
    },
    {
      target: '.collapsible-4',
      content: (
        <div>
          Đây là phần cân đối tài chính!
          <br />
          <h3>Chi tiết hơn về cân đối tài chính ở đây.</h3>
        </div>
      ),
      title: 'Cân đối tài chính',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRun(false); // Stop Joyride when tour finishes
    }
  };

  const startTour = () => {
    setRun(true); // Start the tour when the button is clicked
  };

  const currentMonth = CURRENT_MONTH;
  function sumAttributesByCode(result_bkkd, code) {
    let sumObj = { code: code };

    result_bkkd.forEach((item) => {
      if (item.code === 'VC') {
        for (let i = 0; i <= 12; i++) {
          if (!sumObj.hasOwnProperty(i)) {
            sumObj[i] = 0;
          }
          sumObj[i] += item[i] || 0;
        }
      }
    });

    return sumObj;
  }
  async function prepareData() {
    let data = await getAllSoKeToan();
    let units = await getAllUnits();
    let products = await getAllUnits();
    const kmfList = await getAllKmf();
    const BCKD = calculateDataViewKQKDFS2(data, null, currentMonth);
    const BCDV = calculateData(data, units, kmfList, 'code', 'unit_code', 'PBDV', 'teams')
    const BCSP = calculateData(data, products, kmfList, 'code', 'product', 'PBSP', 'teams')
    SetDataOverall([{'Kết quả kinh doanh': BCKD}, {'Kết quả kinh doanh theo đơn vị': BCDV}, {'Kết quả kinh doanh theo sản phẩm': BCSP}])
  }
  useEffect(() => {
    prepareData();
  }, []);
  return (
    <div style={{ height: '97vh', overflow: 'auto' }}>
      {/* Joyride Component */}
      {/*<Joyride*/}
      {/*  callback={handleJoyrideCallback}*/}
      {/*  continuous*/}
      {/*  run={run}*/}
      {/*  scrollToFirstStep*/}
      {/*  showProgress*/}
      {/*  showSkipButton*/}
      {/*  steps={steps}*/}
      {/*  styles={{*/}
      {/*    options: {*/}
      {/*      zIndex: 10000,*/}
      {/*    },*/}
      {/*  }}*/}
      {/*/>*/}

      <div style={{ display: 'flex', backgroundColor: 'white', alignItems: 'center', marginBottom: '10px' }}>
        {/*<button onClick={startTour} className={styles.expand_btn}>*/}
        {/*  Giới thiệu*/}
        {/*</button>*/}
        <button className={styles.expand_btn} onClick={() => SetIsOverallNotePopupOpened(true)}>
          Phân tích tổng quan
        </button>

        <div
          className={clsx(
            isOverallNotePopupOpened && styles.analysis_box_opened,
            !isOverallNotePopupOpened && styles.analysis_box_hidden,
            styles.analysis_box
          )}
        >
          <div className={styles.analysis_sidebar}>
            <AnalysisSideBarV2
              close_side_bar_function={SetIsOverallNotePopupOpened}
              data={dataOverrall}
              SetISViewDataPopup={SetISViewDataPopup}
            />
          </div>
        </div>
        {isViewDataPopupOpened ? <ViewDataPopup data={dataOverrall} SetISViewDataPopup={SetISViewDataPopup} /> : null}
      </div>

      <div className="collapsible collapsible-1">
        <button  className="collapsible-header" style={{background: 'none'}} onClick={() => setIsHSFS(!isHSFS)}>
          <span className="button-collapse-extend" >
            {isHSFS ? <IoIosArrowDown size={20} /> : <IoIosArrowBack size={20} />}
          </span>
          <span style={{fontSize:18, color:'#777777'}}>Chỉ số tài chính</span>

        </button>
        <div className={`collapsible-content ${isHSFS ? 'open' : 'collapsed'}`}>
          <HSFS company={company}/>
        </div>
      </div>

      <div className="collapsible collapsible-2">
        <button className="collapsible-header" style={{background: 'none'}} onClick={() => setIsKQKDOpen(!isKQKDOpen)}>
          <span className="button-collapse-extend">
            {isKQKDOpen ? <IoIosArrowDown size={20}/> : <IoIosArrowBack size={20}/>}
          </span>
          <span style={{fontSize: 18, color: '#777777'}}> Báo cáo kết quả kinh doanh</span>
        </button>
        <div className={`collapsible-content ${isKQKDOpen ? 'open' : 'collapsed'}`}>
          <BaoCaoKQKDFS company={company} />
        </div>
      </div>

      <div className="collapsible collapsible-3">
        <button className="collapsible-header" style={{background: 'none'}} onClick={() => setIsThuChiOpen(!isThuChiOpen)}>
          <span className="button-collapse-extend">
            {isThuChiOpen ? <IoIosArrowDown size={20} /> : <IoIosArrowBack size={20} />}
          </span>
          <span style={{fontSize: 18, color: '#777777'}}> Báo cáo thu chi</span>
        </button>
        <div className={`collapsible-content ${isThuChiOpen ? 'open' : 'collapsed'}`}>
          <BaoCaoThuChiFS company={company} />
        </div>
      </div>

      <div className="collapsible collapsible-4">
        <button className="collapsible-header" style={{background: 'none'}} onClick={() => setIsCDTCOpen(!isCDTCOpen)}>
          <span className="button-collapse-extend">
            {isCDTCOpen ? <IoIosArrowDown size={20}/> : <IoIosArrowBack size={20}/>}
          </span>
          <span style={{fontSize: 18, color: '#777777'}}>Cân đối tài chính</span>
        </button>
        <div className={`collapsible-content ${isCDTCOpen ? 'open' : 'collapsed'}`}>
          <BaoCaoCDTC company={company} />
        </div>

      </div>
    </div>
  );
}

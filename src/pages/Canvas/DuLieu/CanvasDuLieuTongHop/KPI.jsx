import css from './KPI.module.css';
import { useState } from 'react';
import { Segmented } from 'antd';
import KPICalculator from '../../../../pages/Canvas/CanvasFolder/KPICalculator/KPICalculator.jsx';
import KPI2Calculator from '../../../../pages/Canvas/CanvasFolder/KPI2Calculator/KPI2Calculator.jsx';

const KPI = () => {
  const [tabSelect, setTabSelect] = useState('Tính biến số kinh doanh');

  
  return (
    <div className={css.main}>
      <div className={css.header}>
        <div className={css.headerWrap}>
          <Segmented
            size="large"
            options={['Tính biến số kinh doanh', ' Đo thực hiện KPI']}
            value={tabSelect}
            onChange={(value) => setTabSelect(value)}
            block
          />
        </div>
      </div>
      <div className={css.body}>
        {tabSelect === 'Tính biến số kinh doanh' ? <KPICalculator /> : <KPI2Calculator />}
      </div>
    </div>
  )
}

export default KPI
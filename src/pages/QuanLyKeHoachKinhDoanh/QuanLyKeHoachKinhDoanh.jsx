import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import css from './QuanLyKeHoachKinhDoanh.module.css'

const QuanLyKeHoachKinhDoanh = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    { path: 'thiet-lap-ke-hoach', label: 'Thiết lập kế hoạch' },
    { path: 'nhap-lieu-thuc-thi', label: 'Nhập liệu thực thi' },
    { path: 'thuc-hien-va-ke-hoach', label: 'Thực hiện và kế hoạch' },
    { path: 'uoc-tinh-lai-lo', label: 'Ước tính lãi lỗ' }
  ]

  const [selectedYear, setSelectedYear] = useState('2025')
  const [selectedClass, setSelectedClass] = useState('Class A')

  const years = ['2025', '2024', '2023', '2022', '2021']
  const userClasses = ['Class A', 'Class B', 'Class C', 'Class D']

  const toggleSider = () => setIsCollapsed(!isCollapsed)

  return (
    <div className={css.container}>
      <div className={`${css.sider} ${isCollapsed ? css.collapsed : ''}`}>
        <div className={css.siderHeader}>
          <div className={css.selectYear}>
            <label className={`${css.selectLabel} ${isCollapsed ? css.hideLabel : ''}`}>Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={css.select}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className={css.selectUserClass}>
            <label className={`${css.selectLabel} ${isCollapsed ? css.hideLabel : ''}`}>User Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={css.select}
            >
              {userClasses.map(userClass => (
                <option key={userClass} value={userClass}>{userClass}</option>
              ))}
            </select>
          </div>
        </div>
        <div className={css.siderContent}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${css.navButton} ${isActive ? css.active : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className={css.siderFooter}>
          <button
            className={css.toggleButton}
            onClick={toggleSider}
          >
            {isCollapsed ? '>' : '<'}
          </button>
        </div>
      </div>
      <div className={css.content}>
        <Outlet />
      </div>
    </div>
  )
}

export default QuanLyKeHoachKinhDoanh
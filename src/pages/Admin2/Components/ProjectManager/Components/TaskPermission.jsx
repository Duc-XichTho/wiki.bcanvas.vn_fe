import { Checkbox } from 'antd';
import css from './TaskPermission.module.css';

const TaskPermission = ({ checkedState, setCheckedState, level, id }) => {
    const handleCheckboxChange = (permission, checked) => {
        const newState = { ...checkedState };
        if (!newState[level][id]) {
            newState[level][id] = {};
        }
        newState[level][id][permission] = checked;
        setCheckedState(newState);
    };

    return (
        <div className={css.checkboxGroup}>
            <Checkbox
                onChange={(e) => handleCheckboxChange('confirm', e.target.checked)}
                checked={checkedState[level][id]?.confirm}
            >
                Xác nhận
            </Checkbox>
            <Checkbox
                onChange={(e) => handleCheckboxChange('approve1', e.target.checked)}
                checked={checkedState[level][id]?.approve1}
            >
                Duyệt 1
            </Checkbox>
            <Checkbox
                onChange={(e) => handleCheckboxChange('approve2', e.target.checked)}
                checked={checkedState[level][id]?.approve2}
            >
                Duyệt 2
            </Checkbox>
        </div>
    );
};

export default TaskPermission; 
import { useContext, useState } from 'react';
import './style.css';
import './formDA.css';
import 'react-datepicker/dist/react-datepicker.css';
import { MyContext } from '../../../../MyContext.jsx';
import MultiSelectDropdown from '../../multiSelectDropdown/MultiSelectDropdown.jsx';
import { handleAddAgl } from '../../function/handleAddAgl.js';
import { BsX } from 'react-icons/bs';
import { components } from 'react-select';

function transformArray(arr, field) {
  return arr.map((item) => ({
    value: item.id,
    label: item[field],
  }));
}

const convertObject = (obj, company) => {
  return {
    project_name: obj.ten,
    note: obj.note,
    project_viet_tat: obj.vietTat,
    pbdt: JSON.stringify({
      teams: obj.selectedTeamDT.map((team) => ({
        team: team.team,
        so_chot: team.so_chot,
      })),
    }),
    pbcptt: JSON.stringify({
      teams: obj.selectedTeamCP.map((team) => ({
        team: team.team,
        so_chot: team.so_chot,
      })),
    }),
    pbcpk: JSON.stringify({
      teams: obj.selectedTeamCPK.map((team) => ({
        team: team.team,
        so_chot: team.so_chot,
      })),
    }),
    show: true,
    company: company,
  };
};

const ProjectForm = ({ onClose, company }) => {
  let table = 'Project';
  let { listUnit, listProject, fetchAllProject } = useContext(MyContext);
  let [selectedTeamDT, setSelectedTeamDT] = useState([]);
  let [selectedTeamCP, setSelectedTeamCP] = useState([]);
  let [selectedTeamCPK, setSelectedTeamCPK] = useState([]);
  const [selectedTeamDTValue, setSelectedTeamDTValue] = useState();
  const [selectedTeamCPValue, setSelectedTeamCPValue] = useState();
  const [ten, setTen] = useState('');
  const [note, setNote] = useState('');
  const [vietTat, setVietTat] = useState('');
  const [isExistVietTat, setIsExistVietTat] = useState(false);
  const handleAddTeamDT = () => {
    if (selectedTeamDTValue && !selectedTeamDT.some((team) => team.team === selectedTeamDTValue)) {
      setSelectedTeamDT([...selectedTeamDT, { team: selectedTeamDTValue, so_chot: 0 }]);
    }
  };

  const handleAddTeamCP = () => {
    if (selectedTeamCPValue && !selectedTeamCP.some((team) => team.team === selectedTeamCPValue)) {
      setSelectedTeamCP([...selectedTeamCP, { team: selectedTeamCPValue, so_chot: 0 }]);
    }
  };
  const handleDeleteTeamCP = (index) => {
    setSelectedTeamCP((prevTeams) => prevTeams.filter((_, i) => i !== index));
  };
  const handleDeleteTeamDT = (index) => {
    setSelectedTeamDT((prevTeams) => prevTeams.filter((_, i) => i !== index));
  };
  const handleInputChangeDT = (e, index) => {
    const { value } = e.target;
    const updatedTeams = [...selectedTeamDT];
    updatedTeams[index].so_chot = value;
    setSelectedTeamDT(updatedTeams);
  };

  const handleInputChangeCP = (e, index) => {
    const { value } = e.target;
    const updatedTeams = [...selectedTeamCP];
    updatedTeams[index].so_chot = value;
    setSelectedTeamCP(updatedTeams);
  };

  function handleSubmit() {
    if (isExistVietTat) {
      return;
    }
    let formData = {
      ten,
      note,
      vietTat,
      selectedTeamDT,
      selectedTeamCP,
      selectedTeamCPK,
    };
    handleAddAgl(company, convertObject(formData, company), table, fetchAllProject);
    onClose();
  }

  const filterAvailableTeams = (selectedTeams) => {
    const selectedTeamNames = selectedTeams.map((team) => team.team);
    return listUnit.filter((team) => !selectedTeamNames.includes(team.code));
  };

  return (
    <div className="popup-form">
      <div className="popup-header">
        <h2>Thêm mới</h2>
      </div>
      <div className="popup-content">
        <div className="form-group-all" style={{height: '48vh'}}>
          <div className="content-pj-1 content-pj-1-input">
            <label htmlFor="ten">Tên chương trình</label>
            <input
                id={'ten'}
                type="text"
                value={ten}
                onChange={(e) => {
                  setTen(e.target.value);
                }}
            />
          </div>
          <div className="content-pj-1 content-pj-1-input">
            <label htmlFor="viet_tat">Mã chương trình</label>
            <input
                id={'viet_tat'}
                type="text"
                value={vietTat}
                onChange={(e) => {
                  let isExistVT = listProject.some((da) => da.project_viet_tat === e.target.value);
                  setIsExistVietTat(isExistVT);
                  setVietTat(e.target.value);
                }}
            />
            {isExistVietTat && (
                <label htmlFor="viet_tat" style={{color: 'red', marginTop: '5px'}}>
                  (*)Tên viết tắt đã tồn tại
                </label>
            )}
          </div>
          <h2>Doanh Thu</h2>
          <label htmlFor="pbt">Danh sách phân bổ theo team:</label>
          <br/>
          {selectedTeamDT.map((team, index) => (
              <div key={index} className="selected-teams-list">
                <p>{team.team}</p>
                <input type="text" value={team.so_chot} onChange={(e) => handleInputChangeDT(e, index)}/>
                <BsX size={25} style={{cursor: 'pointer'}} onClick={() => handleDeleteTeamDT(index)}/>
              </div>
          ))}
          <div className="content-pj-2">
            <button onClick={handleAddTeamDT}>Thêm Đơn vị</button>
            <select id={'pbt'} value={selectedTeamDTValue} onChange={(e) => setSelectedTeamDTValue(e.target.value)}>
              <option value={''}></option>
              {filterAvailableTeams(selectedTeamDT).map((team) => (
                  <option key={team.code} value={team.code}>
                    {team.code}
                  </option>
              ))}
            </select>
          </div>
          <h2>Chi phí trực tiếp</h2>

          <label htmlFor="pbcp">Danh sách phân bổ theo team:</label>
          <br/>
          {selectedTeamCP.map((team, index) => (
              <div key={index} className="selected-teams-list">
                <p>{team.team}</p>
                <input type="text" value={team.so_chot} onChange={(e) => handleInputChangeCP(e, index)}/>
                <BsX size={25} style={{cursor: 'pointer'}} onClick={() => handleDeleteTeamCP(index)}/>
              </div>
          ))}
          <div className="content-pj-2">
            <button onClick={handleAddTeamCP}>Thêm Đơn vị</button>
            <select id={'pbcp'} value={selectedTeamCPValue} onChange={(e) => setSelectedTeamCPValue(e.target.value)}>
              <option value={''}></option>
              {filterAvailableTeams(selectedTeamCP).map((team) => (
                  <option key={team.code} value={team.code}>
                    {team.code}
                  </option>
              ))}
            </select>
          </div>

          <div className="content-pj-1 content-pj-1-input">
            <label htmlFor="ghichu">Ghi chú</label>
            <input
                id={'ghichu'}
                type="text"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                }}
            />
          </div>
        </div>
        <div className="form-actions">
          <button className="action-button save" onClick={handleSubmit}>
            Tạo
          </button>
          <span className="x" onClick={onClose}>
            Hủy
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;

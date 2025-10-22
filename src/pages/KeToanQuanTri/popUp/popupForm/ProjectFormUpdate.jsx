import {useContext, useState} from 'react';
import './style.css';
import 'react-datepicker/dist/react-datepicker.css';
import {MyContext} from '../../../../MyContext.jsx';
import {handleSaveProject} from '../../function/handleSaveProject.js';
import {BsX} from 'react-icons/bs';
import {Dialog} from '@mui/material';

const convertObject = (obj) => {
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
        show: true,
    };
};

function parseData(oldData) {
    return {
        pbdt: JSON.parse(oldData.pbdt),
        pbcptt: JSON.parse(oldData.pbcptt),
    };
}

function getTeamsList(data) {
    if (!data) return [];
    return data.teams;
}

const ProjectForm = ({oldData, setShowProjectFormUpdate}) => {
    let {listUnit, listProject, fetchAllProject} = useContext(MyContext);
    const {pbdt, pbcptt, pbcpk} = parseData(oldData);

    const teamsPBDT = getTeamsList(pbdt);
    const teamsPBCPTT = getTeamsList(pbcptt);

    let table = 'Project';
    let [selectedTeamDT, setSelectedTeamDT] = useState(teamsPBDT);
    let [selectedTeamCP, setSelectedTeamCP] = useState(teamsPBCPTT);

    const [selectedTeamDTValue, setSelectedTeamDTValue] = useState();
    const [selectedTeamCPValue, setSelectedTeamCPValue] = useState();

    const [ten, setTen] = useState(oldData.project_name);
    const [note, setNote] = useState(oldData.note);
    const [vietTat, setVietTat] = useState(oldData.project_viet_tat);
    const [isExistVietTat, setIsExistVietTat] = useState(false);
    const handleAddTeamDT = () => {
        if (selectedTeamDTValue && !selectedTeamDT.some((team) => team.team === selectedTeamDTValue)) {
            setSelectedTeamDT([...selectedTeamDT, {team: selectedTeamDTValue, so_chot: ''}]);
        }
    };
    const handleAddTeamCP = () => {
        if (selectedTeamCPValue && !selectedTeamCP.some((team) => team.team === selectedTeamCPValue)) {
            setSelectedTeamCP([...selectedTeamCP, {team: selectedTeamCPValue, so_chot: ''}]);
        }
    };
    const handleDeleteTeamCP = (index) => {
        setSelectedTeamCP((prevTeams) => prevTeams.filter((_, i) => i !== index));
    };
    const handleDeleteTeamDT = (index) => {
        setSelectedTeamDT((prevTeams) => prevTeams.filter((_, i) => i !== index));
    };
    const handleInputChangeDT = (e, index) => {
        const {value} = e.target;
        const updatedTeams = [...selectedTeamDT];
        updatedTeams[index].so_chot = value;
        setSelectedTeamDT(updatedTeams);
    };

    const handleInputChangeCP = (e, index) => {
        const {value} = e.target;
        const updatedTeams = [...selectedTeamCP];
        updatedTeams[index].so_chot = value;
        setSelectedTeamCP(updatedTeams);
    };

    function handleSubmit(duyet) {
        if (isExistVietTat) {
            return;
        }
        const id = oldData.id;
        let formData = {
            ten,
            vietTat,
            note,
            selectedTeamDT,
            selectedTeamCP,
        };

        let updatedData = convertObject(formData);

        updatedData = {...updatedData, id: id};
        if(duyet===1) {
            updatedData = {...updatedData, duyet:duyet};
        }
        handleSaveProject([updatedData], table, fetchAllProject);
        setShowProjectFormUpdate(false);
    }

    const filterAvailableTeams = (selectedTeams) => {
        const selectedTeamNames = selectedTeams.map((team) => team.team);
        return listUnit.filter((team) => !selectedTeamNames.includes(team));
    };

    return (
        <Dialog open={true} fullWidth maxWidth="md">
            <div className="popup-form">
                <div className="popup-header">
                    <h2>Cập nhật</h2>
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
                                <label htmlFor="so_tien" style={{color: 'red', marginTop: '5px'}}>
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
                                <input type="text" value={team.so_chot}
                                       onChange={(e) => handleInputChangeDT(e, index)}/>
                                <BsX size={25} style={{cursor: 'pointer'}}
                                     onClick={() => handleDeleteTeamDT(index)}/>
                            </div>
                        ))}
                        <div className="content-pj-2">
                            <button onClick={handleAddTeamDT}>Thêm Đơn vị</button>
                            <select id={'pbt'} value={selectedTeamDTValue}
                                    onChange={(e) => setSelectedTeamDTValue(e.target.value)}>
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
                                <input type="text" value={team.so_chot}
                                       onChange={(e) => handleInputChangeCP(e, index)}/>
                                <BsX size={25} style={{cursor: 'pointer'}}
                                     onClick={() => handleDeleteTeamCP(index)}/>
                            </div>
                        ))}
                        <div className="content-pj-2">
                            <button onClick={handleAddTeamCP}>Thêm Đơn vị</button>
                            <select id={'pbcp'} value={selectedTeamCPValue}
                                    onChange={(e) => setSelectedTeamCPValue(e.target.value)}>
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
                        {oldData.duyet != 1 && (
                            <button
                                className="action-button duyet"
                                onClick={() => {
                                    handleSubmit(1);
                                }}
                            >
                                Duyệt
                            </button>
                        )}
                        {oldData.duyet != 1 && (
                            <button className="action-button save" onClick={handleSubmit}>
                                Cập nhật
                            </button>
                        )}
                        <button className="action-button tuchoi" onClick={() => setShowProjectFormUpdate(false)}>
                            Hủy
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ProjectForm;

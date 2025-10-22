import {Outlet, useNavigate, useParams} from "react-router-dom";
import css from "./TemplateContainer.module.css";
import {SearchIcon, SettingCardTemplateIcon} from "../../../../icon/IconSVG.js";
import TemplateList from "../TemplateList/TemplateList.jsx";
import React, {useContext, useEffect, useState} from "react";
import {
    getTemplateDataById,
    createNewTemplate,
    getAllTemplate,
    updateTemplate, deleteTemplate
} from "../../../../apis/templateService.jsx";
import {IconButton} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import {MyContext} from "../../../../MyContext.jsx";
import {getCurrentUserLogin} from "../../../../apis/userService.jsx";
import {getChainDataById} from "../../../../apis/chainService.jsx";
import ActionCreate from "../../AgridTable/actionButton/ActionCreate.jsx";  // Thêm API tạo mới

export default function TemplateWorkFlowContainer() {
    const {id} = useParams();
    const [chain, setChain] = useState({});
    const [templateList, setTemplateList] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const {loadData, setLoadData} = useContext(MyContext);
    const [currentUser, setCurrentUser] = useState(null);

    const navigate = useNavigate();
    const fetchCurrentUser = async () => {
        const {data, error} = await getCurrentUserLogin();
        if (data) {
            setCurrentUser(data);
        }
    };
    useEffect(() => {
        getChainDataById(id).then(data => {
            setChain(data);
        })
        fetchCurrentUser()
    }, [id]);

    useEffect(() => {
        loadListTemplate()
    }, [chain]);

    function loadListTemplate() {
        getAllTemplate().then(data => {
            setTemplateList(data.filter(item => item.chain_id == id));
        })
    }

    const handleCreateNewItem = async () => {
        try {
            await createNewTemplate({name: 'New Template', chain_id: id});
            loadListTemplate()
        } catch (error) {
            console.error("Error creating new template:", error);
        }
    };

    const handleUpdateTemplate = async (id, newName) => {
        try {
            await updateTemplate({id: id, name: newName});
            setLoadData(!loadData);
            loadListTemplate();
        } catch (error) {
            console.error("Error updating template:", error);
        }
    };
    const handleDeleteTemplate = async (id) => {
        try {
            await deleteTemplate(id);
            loadListTemplate();
        } catch (error) {
            console.error("Error deleting template:", error);
        }
    };

    const toggle = () => {
        setIsCollapsed(!isCollapsed);
    };



    return (
        <>
            <div className={css.chainContainer}>
                <div className={`${css.listCardContainer} ${isCollapsed ? css.isCollapsed : css.unCollapsed}`}>
                    {
                        isCollapsed &&
                        <IconButton onClick={toggle} size="small">
                            <MenuIcon/>
                        </IconButton>
                    }
                    {
                        !isCollapsed && (
                            <>
                                <div className={css.headerContainer}>
                                    <div className={css.salesFlow}>
                                        <div className={css.nameSalesFlow}>

                                            <span>Mẫu của {chain.name}</span>
                                            <IconButton onClick={() => navigate('/work-flow/' + id)}>
                                                <img src={SettingCardTemplateIcon} alt=""/>
                                            </IconButton>
                                        </div>
                                        <div className={css.buttonContainer}>
                                            <ActionCreate handleAddRow={handleCreateNewItem}/>
                                            <IconButton onClick={toggle} size="small">
                                                <ChevronLeftIcon/>
                                            </IconButton>
                                        </div>

                                    </div>
                                    <div className={css.searchContainer}>
                                        <div className={css.searchBox}>
                                            <img src={SearchIcon} alt=""/>
                                            <input placeholder="Tìm kiếm"/>
                                        </div>
                                    </div>
                                </div>
                                <div className={css.listCard}>
                                    <TemplateList chainId={id}
                                                  listTemplate={templateList}
                                                  onUpdateTemplate={handleUpdateTemplate}
                                                  onDeleteTemplate={handleDeleteTemplate}
                                                  currentUser={currentUser}
                                                  loadListTemplate={loadListTemplate}/>
                                </div>
                            </>
                        )
                    }

                </div>
                <div className={css.cardDetailContainer}>
                    <Outlet/>
                </div>
            </div>
        </>
    );
}

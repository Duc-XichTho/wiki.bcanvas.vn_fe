import React, {useState, useEffect, useContext} from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import css from "../DanhMuc/KeToanQuanTri.module.css";
import {OffBookMarkIcon, OnBookMarkIcon} from "../../../../icon/IconSVG.js";
import {getItemFromIndexedDB, setItemInIndexedDB} from "../../../../storage/storageService.js";
import {IconButton} from "@mui/material";
import {getAllChainTemplateStepSubStep} from "../../../../apis/chainService.jsx";
import {MyContext} from "../../../../MyContext.jsx";

export default function ActionBookMarkChain({headerTitle}) {
    const table = 'BookMark';
    const location = useLocation();
    const navigate = useNavigate();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarks, setBookmarks] = useState([]);
    const [showBookmarksList, setShowBookmarksList] = useState(false);
    const { setChainTemplate2Selected } = useContext(MyContext)

    useEffect(() => {
        const fetchBookmarks = async () => {
            const existingBookmarks = await getItemFromIndexedDB(table);
            const isAlreadyBookmarked = existingBookmarks.some((bookmark) => bookmark.title === headerTitle);
            setIsBookmarked(isAlreadyBookmarked);
            setBookmarks(existingBookmarks);
        };
        fetchBookmarks();
    }, [headerTitle]);

    const handleBookMark = async () => {
        // const bookmarkData = {title: headerTitle, path: `/accounting/chains/${id}/templates/${idTemp}`};
        const bookmarkData = {title: headerTitle, path: location.pathname};
        const existingBookmarks = await getItemFromIndexedDB(table);

        if (isBookmarked) {
            const updatedBookmarks = existingBookmarks.filter((bookmark) => bookmark.title !== headerTitle);
            await setItemInIndexedDB(table, updatedBookmarks);
            setIsBookmarked(false);
            setBookmarks(updatedBookmarks);
        } else {
            const updatedBookmarks = [bookmarkData, ...existingBookmarks];
            await setItemInIndexedDB(table, updatedBookmarks);
            setIsBookmarked(true);
            setBookmarks(updatedBookmarks);
        }
    };

    const toggleBookmarksList = () => {
        setShowBookmarksList(!showBookmarksList);
    };

    const handleNavigate =  async (path) => {
        const match = path.match(/chains\/(\d+)/);
        const match2 = path.match(/templates\/(\d+)/);
        const dataFull = await getAllChainTemplateStepSubStep();
        const chain2TemplateSelected = dataFull.result.find(item => item.id == match[1]) ?? {};
        const templateSelected = chain2TemplateSelected?.templates?.find(template => template.id == match2[1]);
        console.log(templateSelected)
        setChainTemplate2Selected({
            type: 'chain2',
            data: {
                ...chain2TemplateSelected,
                selectedTemplate: templateSelected
            }
        });
        navigate(path);
    };

    return (
        <>
            <div className={`${css.headerActionButton}`} onClick={handleBookMark}>
                <img src={isBookmarked ? OnBookMarkIcon : OffBookMarkIcon} alt=""/>
            </div>

            <div onMouseEnter={() => setShowBookmarksList(true)}
                 onMouseLeave={() => setShowBookmarksList(false)}>
                <IconButton className={css.bookMarkButton} onClick={toggleBookmarksList}>
                    <img src={OnBookMarkIcon} alt=""/>
                </IconButton>

                {showBookmarksList && (
                    <div className={css.bookmarksList}>
                        <h4>Danh sách Bookmark</h4>
                        <div className={css.bookmarksItemContainer}>
                            {bookmarks.length === 0 ? (
                                <span>Không có bookmark</span>
                            ) : (
                                bookmarks.map((bookmark, index) => (
                                    <div
                                        key={index}
                                        className={css.bookmarkItem}
                                        onClick={() => handleNavigate(bookmark.path)}
                                    >
                                        <span title={bookmark.title}>{bookmark.title}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

        </>
    );
}

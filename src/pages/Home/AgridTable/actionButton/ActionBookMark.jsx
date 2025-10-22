import React, {useState, useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import css from "../DanhMuc/KeToanQuanTri.module.css";
import {OffBookMarkIcon, OnBookMarkIcon} from "../../../../icon/IconSVG.js";
import {getItemFromIndexedDB, setItemInIndexedDB} from "../../../../storage/storageService.js";
import {IconButton} from "@mui/material";

export default function ActionBookMark({headerTitle}) {
    const table = 'BookMark';
    const location = useLocation();
    const navigate = useNavigate();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarks, setBookmarks] = useState([]);
    const [showBookmarksList, setShowBookmarksList] = useState(false);

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

    const handleNavigate = (path) => {
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

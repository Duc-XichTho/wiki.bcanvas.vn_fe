import React, { useEffect, useState } from "react";
import { message } from "antd";
import 'react-quill/dist/quill.snow.css';
import css from './WikiStorage.module.css';
// API
import { getAllTabContent } from "../../../apis/tabContentService";
import { getAllCategory } from "../../../apis/categoryService";
// COMPONENT
import LeftPanel from "./LeftPanel/LeftPanel";
import RightPanel from "./RightPanel/RightPanel";

export default function WikiStorage({ }) {
    const [tabContent, setTabContent] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [categoryList, setCategoryList] = useState([])

    const currentUser = {
        isAdmin: true,
        userEmail: 'hieu0353333494@gmail.com',
    }

    const getTabContentData = async () => {
        try {
            const data = await getAllTabContent();
            const tabContents = currentUser.isAdmin
                ? data
                : data.filter(item => item.userEmail === currentUser.email);

            const TabItemLocalStorage = JSON.parse(localStorage.getItem('selectedTabItem'));

            const formattedTabContents = tabContents.map(item => {
                const createdDate = new Date(item.created_at);
                return {
                    ...item,
                    created_at: createdDate.toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    }),
                    created_time: createdDate.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZone: 'Asia/Ho_Chi_Minh',
                    }),
                };
            });

            if (TabItemLocalStorage) {
                const selectedItem = formattedTabContents.find(item => item.id === TabItemLocalStorage.id);
                setSelectedItem(selectedItem);
            }

            setTabContent(formattedTabContents);

        } catch (e) {
            console.error(e);
            message.error("Lỗi khi lấy tab content");
        }
    };

    const getCategoryData = async () => {
        try {
            const categories = await getAllCategory();
            setCategoryList(categories);
        } catch (e) {
            console.error(e);
            message.error("Lỗi khi lấy category");

        }
    }

    const handleCategoryUpdate = (updatedItem) => {
        setSelectedItem(updatedItem);
    };

    useEffect(() => {
        getTabContentData();
        getCategoryData();
    }, []);

    return (
        <div className={css.container}>
            <div className={css.leftPanel}>
                <LeftPanel
                    tabContent={tabContent}
                    selectedItem={selectedItem}
                    setSelectedItem={setSelectedItem}
                    categories={categoryList}
                    getCategoryData={getCategoryData}
                    getTabContentData={getTabContentData}
                    currentUser={currentUser}
                />
            </div>

            <div className={css.rightPanel}>
                {selectedItem ? (
                    <RightPanel
                        selectedItem={selectedItem}
                        categories={categoryList}
                        onCategoryUpdate={handleCategoryUpdate}
                        getTabContentData={getTabContentData}
                        currentUser={currentUser}
                    />
                ) : (
                    <p className={css.emptyState}>Chọn dữ liệu đã lưu để xem</p>
                )}
            </div>
        </div>
    );
}
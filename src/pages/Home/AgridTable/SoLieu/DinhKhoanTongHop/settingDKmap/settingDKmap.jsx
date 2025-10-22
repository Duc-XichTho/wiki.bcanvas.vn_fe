import React, { useState } from "react";
import { Settings } from "lucide-react";
import css from "./settingDKmap.module.css";
// COMPONENT
import SettingDKMap from "./DKMap/DKMap";

export function SettingDKMapButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                className={css.settingsIcon}
                onClick={() => setIsOpen(true)}
                title="Cài đặt"
            >
                <Settings />
            </button>
            <SettingDKMap
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
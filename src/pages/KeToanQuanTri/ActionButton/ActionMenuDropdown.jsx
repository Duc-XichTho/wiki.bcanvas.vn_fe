import { Button, Popover } from 'antd';
import css from '../BaoCao/BaoCao.module.css';
import { ChevronDown } from 'lucide-react';
import React from 'react';

export default function ActionMenuDropdown({popoverContent , dropdownOpen , setDropdownOpen}) {
    return (
        <>
            <Popover
                content={popoverContent}
                trigger="click"
                open={dropdownOpen}
                onOpenChange={(visible) => setDropdownOpen(visible)}
                placement="bottom"

            >
                <Button className={css.customButton}
                >
                    <ChevronDown size={15} />
                </Button>
            </Popover>
        </>
    )
}

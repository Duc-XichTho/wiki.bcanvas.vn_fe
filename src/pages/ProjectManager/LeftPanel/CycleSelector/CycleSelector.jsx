import React, { useState, useEffect, useRef } from 'react';
import css from './CycleSelector.module.css';

const CycleSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState('Cycle 1 - W1');
    const dropdownRef = useRef(null);

    const cycles = [
        'Cycle 1 - W1',
        'Cycle 1 - W2',
        'Cycle 1 - W3',
        'Cycle 1 - W4'
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={css.container} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={css.trigger}
            >
                <span>{selectedCycle}</span>
                <span className={`${css.arrow} ${isOpen ? css.arrowUp : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className={css.dropdown}>
                    {cycles.map((cycle) => (
                        <button
                            key={cycle}
                            className={css.option}
                            onClick={() => {
                                setSelectedCycle(cycle);
                                setIsOpen(false);
                            }}
                        >
                            {cycle}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CycleSelector;
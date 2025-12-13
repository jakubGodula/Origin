import React, { useState, useRef, useEffect } from 'react';

interface SelectProps {
    value: string | number;
    onChange: (value: string) => void;
    options: (string | number)[];
    placeholder?: string;
    className?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onChange, options, placeholder, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string | number) => {
        onChange(option.toString());
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-left text-white focus:outline-none focus:border-primary/50 transition-colors flex justify-between items-center"
            >
                <span className={!value ? 'text-zinc-500' : ''}>
                    {value || placeholder || 'Select...'}
                </span>
                <span className={`text-xs ml-2 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-zinc-900/95 border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto backdrop-blur-sm">
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className={`w-full text-left px-4 py-2 hover:bg-white/10 transition-colors ${option.toString() === value.toString() ? 'text-primary bg-primary/10' : 'text-zinc-300'}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

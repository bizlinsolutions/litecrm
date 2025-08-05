'use client';

import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiX, FiSearch } from 'react-icons/fi';

interface Option {
    value: string;
    label: string;
    subtitle?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | string[];
    onChange: (value: string | string[]) => void;
    placeholder?: string;
    multiple?: boolean;
    searchable?: boolean;
    className?: string;
    disabled?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    multiple = false,
    searchable = true,
    className = '',
    disabled = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
    const selectedOptions = options.filter(option => selectedValues.includes(option.value));

    const filteredOptions = searchable 
        ? options.filter(option => 
            option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (option.subtitle && option.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : options;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, []);

    const handleOptionClick = (option: Option) => {
        if (multiple) {
            const newValue = selectedValues.includes(option.value)
                ? selectedValues.filter(v => v !== option.value)
                : [...selectedValues, option.value];
            onChange(newValue);
        } else {
            onChange(option.value);
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const removeOption = (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (multiple) {
            const newValue = selectedValues.filter(v => v !== optionValue);
            onChange(newValue);
        }
    };

    const displayText = () => {
        if (selectedOptions.length === 0) return placeholder;
        if (!multiple) return selectedOptions[0]?.label || placeholder;
        if (selectedOptions.length === 1) return selectedOptions[0].label;
        return `${selectedOptions.length} selected`;
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                className={`
                    w-full min-h-[40px] px-3 py-2 border border-gray-300 rounded-md
                    bg-white text-black cursor-pointer flex items-center justify-between
                    focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
                `}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex-1 flex flex-wrap gap-1 items-center">
                    {multiple && selectedOptions.length > 0 ? (
                        selectedOptions.map(option => (
                            <span
                                key={option.value}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                            >
                                {option.label}
                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={(e) => removeOption(option.value, e)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <FiX className="h-3 w-3" />
                                    </button>
                                )}
                            </span>
                        ))
                    ) : (
                        <span className={`text-black ${selectedOptions.length === 0 ? 'text-gray-500' : ''}`}>
                            {displayText()}
                        </span>
                    )}
                </div>
                <FiChevronDown 
                    className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchable && (
                        <div className="p-2 border-b border-gray-200">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="max-h-48 overflow-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-gray-600 text-sm">No options found</div>
                        ) : (
                            filteredOptions.map(option => (
                                <div
                                    key={option.value}
                                    className={`
                                        px-3 py-2 cursor-pointer hover:bg-gray-100 text-gray-900
                                        ${selectedValues.includes(option.value) ? 'bg-blue-50 text-blue-900' : ''}
                                    `}
                                    onClick={() => handleOptionClick(option)}
                                >
                                    <div className="font-medium text-gray-900">{option.label}</div>
                                    {option.subtitle && (
                                        <div className="text-sm text-gray-600">{option.subtitle}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

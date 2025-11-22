"use client";

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    ...props
}) => {
    const baseStyles = "px-6 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm";

    const variants = {
        primary: "bg-primary-transparent text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]",
        secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10",
        outline: "border border-primary text-primary hover:bg-primary/10"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

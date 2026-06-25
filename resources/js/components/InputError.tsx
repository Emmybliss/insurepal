import React from 'react';

interface InputErrorProps {
    message?: string;
    className?: string;
}

export const InputError: React.FC<InputErrorProps> = ({ message, className = '' }) => {
    return message ? <p className={`text-sm text-red-600 dark:text-red-400 ${className}`}>{message}</p> : null;
};

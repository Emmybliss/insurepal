import { useState } from 'react';

export const useFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement
                .requestFullscreen()
                .then(() => {
                    setIsFullscreen(true);
                })
                .catch((err) => console.error(err));
        } else {
            document
                .exitFullscreen()
                .then(() => {
                    setIsFullscreen(false);
                })
                .catch((err) => console.error(err));
        }
    };

    return { isFullscreen, toggleFullscreen };
};

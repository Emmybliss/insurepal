import { Globe } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';

interface LanguageProps {
    id: string;
    code: string;
    flag: string;
}

const languages: LanguageProps[] = [
    {
        id: '1',
        code: 'us',
        flag: '/images/flags/us.png',
    },
    {
        id: '2',
        code: 'fr',
        flag: '/images/flags/fr.png',
    },
    {
        id: '3',
        code: 'ru',
        flag: '/images/flags/ru.png',
    },
    {
        id: '4',
        code: 'ch',
        flag: '/images/flags/ch.png',
    },
    {
        id: '5',
        code: 'sa',
        flag: '/images/flags/sa.png',
    },
    {
        id: '6',
        code: 'in',
        flag: '/images/flags/in.png',
    },
];

const LanguageSelector: React.FC = () => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Globe className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                {/* Header */}
                <div className="flex justify-between border-b p-4">
                    <h3 className="text-lg font-semibold">Languages</h3>
                    <Button variant="ghost" size="sm">
                        Default Language
                    </Button>
                </div>

                {/* Scrollable Content */}
                <ScrollArea className="h-44">
                    <div className="grid grid-cols-3 gap-2 p-4">
                        {languages.map((lang) => (
                            <div key={lang.id} className="flex cursor-pointer flex-col items-center justify-center rounded-full p-2 hover:bg-accent">
                                <img src={lang.flag} alt={lang.code} className="h-8 w-8 rounded-full" />
                                <span className="mt-2 text-sm capitalize">{lang.code}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};

export default LanguageSelector;

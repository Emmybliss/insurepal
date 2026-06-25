import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    status?: 'online' | 'busy' | 'away' | 'offline';
    workload?: number; // Number of active tickets
}

interface AssignmentDropdownProps {
    users: User[];
    selectedUserId?: number;
    onSelect: (userId: number | null) => void;
    placeholder?: string;
    disabled?: boolean;
    showWorkload?: boolean;
    maxWorkload?: number;
    className?: string;
}

export default function AssignmentDropdown({
    users,
    selectedUserId,
    onSelect,
    placeholder = 'Assign to...',
    disabled = false,
    showWorkload = true,
    maxWorkload = 10,
    className = '',
}: AssignmentDropdownProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    const selectedUser = users.find((user) => user.id === selectedUserId);
    const filteredUsers = users.filter(
        (user) => user.name.toLowerCase().includes(searchValue.toLowerCase()) || user.email.toLowerCase().includes(searchValue.toLowerCase()),
    );

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusColor = (status?: User['status']) => {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'busy':
                return 'bg-yellow-500';
            case 'away':
                return 'bg-orange-500';
            case 'offline':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getWorkloadColor = (workload: number) => {
        if (workload === 0) return 'bg-green-100 text-green-800';
        if (workload < maxWorkload * 0.5) return 'bg-blue-100 text-blue-800';
        if (workload < maxWorkload * 0.8) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const handleSelect = (userId: number | null) => {
        onSelect(userId);
        setOpen(false);
        setSearchValue('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className={`justify-between ${className}`} disabled={disabled}>
                    {selectedUser ? (
                        <div className="flex items-center space-x-2">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={selectedUser.avatar} />
                                <AvatarFallback className="text-xs">{getInitials(selectedUser.name)}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{selectedUser.name}</span>
                            {showWorkload && selectedUser.workload !== undefined && (
                                <Badge variant="outline" className={`text-xs ${getWorkloadColor(selectedUser.workload)}`}>
                                    {selectedUser.workload}
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500">{placeholder}</span>
                        </div>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <Command>
                    <CommandInput placeholder="Search users..." value={searchValue} onValueChange={setSearchValue} />
                    <CommandList>
                        <CommandEmpty>No users found.</CommandEmpty>

                        {/* Unassign option */}
                        <CommandGroup>
                            <CommandItem onSelect={() => handleSelect(null)} className="flex items-center space-x-2">
                                <div className="flex flex-1 items-center space-x-2">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
                                        <User className="h-3 w-3 text-gray-500" />
                                    </div>
                                    <span>Unassign</span>
                                </div>
                                {!selectedUserId && <Check className="h-4 w-4" />}
                            </CommandItem>
                        </CommandGroup>

                        {/* Users list */}
                        <CommandGroup>
                            {filteredUsers.map((user) => (
                                <CommandItem key={user.id} onSelect={() => handleSelect(user.id)} className="flex items-center space-x-2">
                                    <div className="flex flex-1 items-center space-x-2">
                                        <div className="relative">
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            {user.status && (
                                                <div
                                                    className={`absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border border-white ${getStatusColor(user.status)}`}
                                                />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-medium">{user.name}</div>
                                            <div className="truncate text-xs text-gray-500">{user.email}</div>
                                        </div>
                                        {user.role && (
                                            <Badge variant="outline" className="text-xs">
                                                {user.role}
                                            </Badge>
                                        )}
                                        {showWorkload && user.workload !== undefined && (
                                            <Badge variant="outline" className={`text-xs ${getWorkloadColor(user.workload)}`}>
                                                {user.workload} tickets
                                            </Badge>
                                        )}
                                    </div>
                                    {selectedUserId === user.id && <Check className="h-4 w-4" />}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

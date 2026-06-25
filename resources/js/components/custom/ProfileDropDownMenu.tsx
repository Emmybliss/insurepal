import { Lock, LogOut, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { getImageUrl } from '@/lib/constants';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Button } from '../ui/button';

export function ProfileDropDownMenu() {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const getInitials = useInitials();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer" asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="relative">
                        <AvatarImage src={`${getImageUrl()}${user?.avatar || ''}`} />
                        <AvatarFallback className="rounded-lg bg-primary text-white dark:bg-white dark:text-primary">
                            {user?.name ? getInitials(user.name) : ''}
                        </AvatarFallback>
                    </Avatar>
                    <span className="absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background bg-emerald-500">
                        <span className="sr-only">Online</span>
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>
                    <div>
                        <div className="text-xs">{user?.name}</div>
                        <div className="text-xs font-normal text-slate-500">{user?.email}</div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem className="">
                        <User className="mr-2 h-4 w-4" />
                        <Link href="/settings/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Lock className="mr-2 h-4 w-4" />
                        <Link href="/settings/password">Change Password</Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                    <Link href={route('logout')} method="post" as="button" className="flex flex-row">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

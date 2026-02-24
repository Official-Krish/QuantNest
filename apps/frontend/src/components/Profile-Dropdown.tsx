import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    BadgeCheckIcon,
    BellIcon,
    CreditCardIcon,
    LogOutIcon,
} from "lucide-react"
import { useEffect, useState } from "react";
import { apiSignout, clearAuthSession } from "@/http";

export function ProfileDropDown() {
    const [avatarUrl, setAvatarUrl] = useState("");
    const handleSignOut = async () => {
        try {
            await apiSignout();
        } catch (error) {
            console.error("Signout failed:", error);
        } finally {
            clearAuthSession();
            localStorage.removeItem("avatarUrl");
        }
        window.location.href = "/"; 
    }
    useEffect(() => {
        const fetchAvatar = async () => {
            const storedAvatar = localStorage.getItem("avatarUrl");
            if (storedAvatar) {
                setAvatarUrl(storedAvatar);
            } else {
                setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
            }
        };
        fetchAvatar();
    }, []);
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                        <AvatarImage src={avatarUrl} alt="User Avatar" />
                        <AvatarFallback>LR</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className=" bg-black text-gray-100 w-48 border border-gray-900">
                <DropdownMenuGroup>
                    <DropdownMenuItem 
                        className="hover:bg-gray-700 cursor-pointer"
                        onClick={() => {
                            window.location.href = "/profile"
                        }}
                    >
                        <BadgeCheckIcon className="mr-2" />
                        Account
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer">
                        <CreditCardIcon className="mr-2" />
                        Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer">
                        <BellIcon className="mr-2" />
                        Notifications
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem className="text-red-400 cursor-pointer"
                    onClick={()=> {
                        void handleSignOut();
                    }}
                >
                    <LogOutIcon className="mr-2" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

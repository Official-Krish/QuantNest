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

export function ProfileDropDown() {
    const handleSignOut = () => {
        localStorage.removeItem("token");
        window.location.href = "/"; 
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
                        <AvatarFallback>LR</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className=" bg-black text-gray-100 w-48 border border-gray-900">
                <DropdownMenuGroup>
                    <DropdownMenuItem className="hover:bg-gray-700">
                        <BadgeCheckIcon className="mr-2" />
                        Account
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-gray-700">
                        <CreditCardIcon className="mr-2" />
                        Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-gray-700">
                        <BellIcon className="mr-2" />
                        Notifications
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem className="text-red-500 cursor-pointer"
                    onClick={()=> {
                        handleSignOut();
                    }}
                >
                    <LogOutIcon className="mr-2" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

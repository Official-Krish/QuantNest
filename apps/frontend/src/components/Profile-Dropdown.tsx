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
    BellIcon,
    CreditCardIcon,
    LogOutIcon,
    SettingsIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { apiGetProfile, apiSignout, clearAuthSession } from "@/http"

export function ProfileDropDown() {
    const [avatarUrl, setAvatarUrl] = useState("")
    const [username,  setUsername]  = useState("")
    const [email,     setEmail]     = useState("")

    const handleSignOut = async () => {
        try   { await apiSignout() }
        catch  { /* silent */ }
        finally {
            clearAuthSession()
            localStorage.removeItem("avatarUrl")
        }
        window.location.href = "/"
    }

    useEffect(() => {
        const fetchAvatar = async () => {
            const stored = localStorage.getItem("avatarUrl") || ""
            if (stored) setAvatarUrl(stored)
            try {
                const profile = await apiGetProfile()
                setUsername(profile.displayName || profile.username || "")
                setEmail(profile.email || "")
                setAvatarUrl(profile.avatarUrl || stored)
            } catch {}
        }
        void fetchAvatar()
    }, [])

    const initials = (username || "U").slice(0, 1).toUpperCase()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-9 w-9 p-0 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-150"
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={avatarUrl} alt="User Avatar" />
                        <AvatarFallback
                        >
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-56 p-1.5 border"
                style={{
                    background: "rgba(10,10,10,0.96)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    boxShadow: "0 16px 48px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset",
                }}
            >
                {/* ── User info header ── */}
                <div
                    className="flex items-center gap-2.5 px-2.5 py-2.5 mb-1 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={avatarUrl} alt="User Avatar" />
                        <AvatarFallback
                            className="text-[12px] font-semibold text-white"
                            style={{ background: "rgba(241,116,99,0.15)" }}
                        >
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-medium text-white/90 truncate leading-tight">
                            {username || "User"}
                        </span>
                        {email && (
                            <span className="text-[11px] text-white/35 truncate leading-tight mt-0.5">
                                {email}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Menu items ── */}
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-white/60 cursor-pointer transition-colors duration-100 focus:text-white/90 focus:bg-white/6"
                        onClick={() => window.location.href = "/profile"}
                    >
                        <SettingsIcon size={14} className="text-white/40 flex-shrink-0" />
                        Account settings
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-white/60 cursor-pointer transition-colors duration-100 focus:text-white/90 focus:bg-white/6"
                        onClick={() => window.location.href = "/coming-soon/:billing"}
                    >
                        <CreditCardIcon size={14} className="text-white/40 flex-shrink-0" />
                        Billing
                        {/* Plan badge */}
                        <span
                            className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(241,116,99,0.12)", color: "#f17463" }}
                        >
                            Starter
                        </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-white/60 cursor-pointer transition-colors duration-100 focus:text-white/90 focus:bg-white/6"
                        onClick={() => window.location.href = "/notifications"}
                    >
                        <BellIcon size={14} className="text-white/40 flex-shrink-0" />
                        Notifications
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator
                    className="my-1.5 mx-1"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                />

                <DropdownMenuItem
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer transition-colors duration-100 focus:bg-red-500/8"
                    style={{ color: "rgba(239,68,68,0.8)" }}
                    onClick={() => void handleSignOut()}
                >
                    <LogOutIcon size={14} className="flex-shrink-0" style={{ color: "rgba(239,68,68,0.6)" }} />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
"use client";

import {HistoryIcon, LogOutIcon, PlayIcon, UserIcon, VideoIcon} from "lucide-react";
import {usePathname} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {cn} from "@/lib/utils";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import {Button} from "@/components/ui/button";
import {useAuth} from "@/lib/hooks/auth";

const navigation = [
    {
        name: "New Video",
        href: "/dashboard",
        icon: VideoIcon,
        description: "Upload a YouTube URL to started",
    },
    {
        name: "My Videos",
        href: "/dashboard/videos",
        icon: PlayIcon,
        description: "See all your videos",
    },
    {
        name: "Progress",
        href: "/dashboard/history",
        icon: HistoryIcon,
        description: "View your in progress video",
    },
    {
        name: "Profile",
        href: "/dashboard/profile",
        icon: UserIcon,
        description: "Manage your profile",
    },
];

export default function SidebarNav() {
    const pathName = usePathname();
    const {user, logout} = useAuth();

    return (
        <Sidebar collapsible="icon" className="border-r border-gray-200">
            <SidebarHeader className="bg-white flex items-center h-16 shrink p-4 border-b border-gray-200">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Image
                        src="/logo.svg"
                        alt="Clip Note Logo"
                        width={32}
                        height={32}
                        className="w-8 h-8 shrink-0"
                    />
                    <span className="text-xl font-bold group-data-[collapsible=icon]:hidden">
                        Clip Note
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="pt-5 pb-4 bg-white">
                <SidebarGroup className="px-3">
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-2">
                            {navigation.map((item) => {
                                const isActive = pathName === item.href;

                                return (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton
                                            render={<Link href={item.href}/>}
                                            className={cn(
                                                "group relative flex items-center px-4 py-3 text-sm h-auto",
                                                isActive
                                                    ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-2xl transition-colors duration-200"
                                                    : "text-gray-700 hover:bg-gray-100 rounded-2xl transition-colors duration-200"
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    "shrink-0 size-5 transition-colors duration-200",
                                                    isActive
                                                        ? "text-primary-foreground"
                                                        : "text-gray-500 group-hover:text-gray-700",
                                                )}
                                                aria-hidden={true}
                                            />
                                            <div className="ml-3 flex flex-col group-data-[collapsible=icon]:hidden">
                                                <span className="font-medium">{item.name}</span>
                                                <span
                                                    className={cn(
                                                        "text-xs mt-0.5",
                                                        isActive
                                                            ? "text-primary-foreground"
                                                            : "text-gray-500 group-hover:text-gray-700",
                                                    )}
                                                >
                                                  {item.description}
                                                </span>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="px-3 pb-4 bg-white">
                <div
                    className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
                    <p className="text-sm text-gray-500 group-data-[collapsible=icon]:hidden">
                        Logged in as <span className="font-medium">{user?.name}</span>
                    </p>
                    <Button variant="ghost" size="icon" className="p-2 shrink-0" onClick={logout}>
                        <LogOutIcon/>
                    </Button>
                </div>
            </SidebarFooter>

            <SidebarRail/>
        </Sidebar>
    );
}
"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LogOut, User } from "lucide-react";
import { SidebarToggle } from "./Sidebar";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-30 glass border-b border-dark-700/50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <SidebarToggle onClick={onMenuClick} />
          <h1 className="text-lg font-semibold lg:hidden">Sprint Planner</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-full bg-dark-700">
              <User className="h-4 w-4 text-dark-300" />
            </div>
            <span className="hidden sm:inline text-dark-300 max-w-[200px] truncate">
              {user?.email ?? user?.name ?? "Loading..."}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  userEmail?: string;
}

export function Navbar({ userEmail }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "?";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[oklch(0.12_0.008_265)]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/dashboard" className="font-black text-base tracking-tight shrink-0">
          <span className="text-primary">Flip</span>
          <span className="text-white">Finder</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/dashboard"
                ? "bg-white/8 text-white"
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            }`}
          >
            Deals
          </Link>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-white/8 hover:border-white/15 bg-white/3 hover:bg-white/6 transition-all">
              <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center text-[10px] font-black text-primary">
                {initials}
              </div>
              <span className="text-xs text-zinc-400 max-w-[140px] truncate hidden sm:block">{userEmail}</span>
            </button>
          } />
          <DropdownMenuContent align="end" className="w-52 bg-zinc-700 border-white/10">
            <div className="px-2 py-2 text-xs text-zinc-500 truncate border-b border-white/5 mb-1">{userEmail}</div>
            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
              className="text-sm cursor-pointer rounded-lg"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </nav>
  );
}

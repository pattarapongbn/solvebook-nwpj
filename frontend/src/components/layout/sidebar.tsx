"use client";

import { Heart, History, Search, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="px-5 py-5">
        <Link href="/search" className="text-lg font-bold tracking-tight">
          Scout
        </Link>
        <p className="mt-0.5 text-xs text-gray-500">Product Research</p>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
                active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

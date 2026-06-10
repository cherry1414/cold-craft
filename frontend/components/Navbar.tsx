"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/", label: "Generate" },
  { href: "/history", label: "History" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#1E1E1E] bg-[#0F0F0F]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#F0F0F0]">
            ColdCraft
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-[#1E1E1E] text-[#F0F0F0]"
                  : "text-[#888] hover:text-[#F0F0F0] hover:bg-[#1A1A1A]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#555]">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulseRing" />
            Powered by Groq
          </span>
        </div>
      </div>
    </header>
  );
}

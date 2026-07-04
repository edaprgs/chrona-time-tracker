"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features",     href: "#features" },
  { label: "How it works", href: "#how-it-works" },
];

export default function LandingNav() {
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sections = NAV_LINKS.map(({ href }) =>
      document.querySelector(href) as HTMLElement | null
    );

    function onScroll() {
      setScrolled(window.scrollY > 20);

      const scrollMid = window.scrollY + window.innerHeight / 3;
      let current = "";
      for (const el of sections) {
        if (el && el.offsetTop <= scrollMid) {
          current = `#${el.id}`;
        }
      }
      setActive(current);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-md shadow-sm shadow-black/5"
          : "bg-background/80 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/icon.svg" alt="Chrona" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-bold tracking-tight">Chrona</span>
        </Link>

        {/* Links */}
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className={cn(
                "relative px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200",
                active === href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {label}
              {/* Animated underline */}
              <span
                className={cn(
                  "absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-primary transition-all duration-300",
                  active === href ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                )}
              />
            </a>
          ))}
        </nav>

        <Link
          href="/login"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

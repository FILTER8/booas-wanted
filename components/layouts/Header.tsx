"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const font = { fontFamily: "var(--font-departure-mono)" };

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";

  const saved = window.localStorage.getItem("theme");
  return saved === "light" ? "light" : "dark";
}

export function Header() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <header className="bg-background">
      <div className="page-shell">
        <div className="grid min-h-[72px] grid-cols-[1fr_auto] items-center gap-6 md:min-h-[88px]">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[22px] uppercase tracking-[-0.05em] text-foreground md:text-[24px]"
              style={font}
            >
              BOOAS WANTED
            </Link>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 -mr-2 items-center justify-center text-muted-foreground transition-colors hover:text-[hsl(var(--foreground)/0.68)]"
              aria-label="Toggle theme"
              type="button"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
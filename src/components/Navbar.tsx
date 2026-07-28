"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import NavItems, { NavItem } from "./NavItems";
import MobileMenu from "./MobileMenu";

function ThemeToggle({ dark, toggle, mounted }: { dark: boolean; toggle: () => void; mounted: boolean }) {
  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 shadow-inner text-[#001e66] dark:text-[#00aeef] hover:text-[#00aeef] dark:hover:text-[#00aeef] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus:outline-none"
      aria-label="Toggle dark mode"
    >
      {dark ? (
        /* Sun icon */
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        /* Moon icon */
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </motion.button>
  );
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("#home");
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const isDark = !dark;
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const navItems: NavItem[] = [
    { label: "Home", href: "#home" },
    { label: "About Us", href: "#about" },
    { label: "District Offices", href: "#offices" },
    { label: "Announcements", href: "#announcements" }
  ];

  // Active section scroll detection observer
  useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash || "#home");
    };

    window.addEventListener("hashchange", handleHashChange);
    
    const observerOptions = {
      root: null,
      rootMargin: "-30% 0px -50% 0px",
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          if (id) {
            setActiveHash(`#${id}`);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    const sections = ["home", "about", "offices", "announcements"];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  return (
    <nav className="bg-[#eef4fa] dark:bg-[#07142F] border-b border-slate-300/80 dark:border-white/10 sticky top-0 z-50 shadow-md relative transition-colors duration-300">

      <div className="w-full pl-6 pr-4">
        <div className="flex justify-between h-20 pt-1.5 items-center">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center cursor-pointer">
              <img 
                src={mounted && dark ? "/LOGO3.png" : "/LOGO2.png"} 
                alt="AquaTrack Logo" 
                className="h-25 w-auto translate-y-1 hover:opacity-90 transition-opacity" 
              />
            </Link>
          </div>

          {/* Right side: Nav links + Theme toggle (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <NavItems items={navItems} activeHash={activeHash} />
            <ThemeToggle dark={dark} toggle={toggleTheme} mounted={mounted} />
          </div>

          {/* Mobile: Theme toggle + Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle dark={dark} toggle={toggleTheme} mounted={mounted} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#001e66] dark:text-white hover:text-[#00aeef] dark:hover:text-[#00aeef] p-2 focus:outline-none transition-colors"
              aria-label="Toggle Mobile Menu"
            >
              <motion.div
                animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </motion.div>
            </button>
          </div>

        </div>
      </div>

      {/* Stateful slide-in Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        items={navItems}
        activeHash={activeHash}
        dark={dark}
        mounted={mounted}
      />
    </nav>
  );
}

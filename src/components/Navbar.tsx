"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import NavItems, { NavItem } from "./NavItems";
import NavbarActions from "./NavbarActions";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("#home");

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
    
    // Observer options: triggers when element takes up significant viewport space
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
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm relative pt-1.5">
      
      {/* The Top Color Ribbon: 3-way color bar for branding */}
      <div className="absolute inset-x-0 top-0 flex h-1.5" aria-hidden="true">
        <span className="flex-1 bg-[#001e66]" /> {/* Navy Blue */}
        <span className="flex-1 bg-[#00aeef]" /> {/* Vivid Azure */}
        <span className="flex-1 bg-[#970006]" /> {/* Crimson Red */}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center cursor-pointer">
              <img 
                src="/LOGO1.png" 
                alt="AquaTrack Logo" 
                className="h-14 w-auto translate-y-1 hover:opacity-90 transition-opacity" 
              />
            </Link>
          </div>

          {/* Desktop Capsule Links */}
          <div className="hidden md:flex items-center">
            <NavItems items={navItems} activeHash={activeHash} />
          </div>

          {/* Desktop Auth/Actions Capsule */}
          <div className="hidden md:flex items-center">
            <NavbarActions />
          </div>

          {/* Mobile responsive drawer toggle button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-[#001e66] hover:text-[#00aeef] p-2 focus:outline-none transition-colors"
              aria-label="Toggle Mobile Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
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
      />
    </nav>
  );
}

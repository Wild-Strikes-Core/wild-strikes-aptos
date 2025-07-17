"use client";
import { useState, useEffect } from "react";
import "@/styles/home.css";

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const sections = [
        { name: "home", element: document.querySelector(".container") },
        { name: "about", element: document.querySelector(".game-overview") },
        { name: "features", element: document.querySelector(".game-features") },
        { name: "demo", element: document.querySelector(".gameplay-section") }
      ];

      // Check sections from bottom to top
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          // If section top is above middle of screen, it's the active section
          if (rect.top <= window.innerHeight / 2) {
            setActiveSection(section.name);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionName: string) => {
    let targetElement;
    
    switch (sectionName) {
      case "home":
        targetElement = document.querySelector(".container");
        break;
      case "about":
        targetElement = document.querySelector(".game-overview");
        break;
      case "features":
        targetElement = document.querySelector(".game-features");
        break;
      case "demo":
        targetElement = document.querySelector(".gameplay-section");
        break;
      default:
        return;
    }

    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: "smooth",
        block: "start"
      });
    }
  };

  return (
    <nav className="navbar">
      <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection("home"); }} className={activeSection === "home" ? "active" : ""}>HOME</a>
      <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection("about"); }} className={activeSection === "about" ? "active" : ""}>ABOUT</a>
      <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection("features"); }} className={activeSection === "features" ? "active" : ""}>FEATURES</a>
      <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection("demo"); }} className={activeSection === "demo" ? "active" : ""}>DEMO</a>
      <a href="#">MINT</a>
    </nav>
  );
}
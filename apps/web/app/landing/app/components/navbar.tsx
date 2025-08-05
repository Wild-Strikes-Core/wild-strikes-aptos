"use client";
import { useState, useEffect } from "react";
import "../styles/home.css";

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("home");
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const sections = [
        { name: "home", element: document.querySelector(".container") },
        { name: "about", element: document.querySelector(".game-overview") },
        { name: "features", element: document.querySelector(".game-features") },
        { name: "demo", element: document.querySelector(".gameplay-section") },
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            setActiveSection(section.name);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

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
        block: "start",
      });
    }
  };

  return (
    <nav className="navbar">
      {/* <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection("home"); }} className={activeSection === "home" ? "active" : ""}>HOME</a> */}
      <a href="/">HOME</a>
      <a href="/whitelist">WHITELIST</a>

      <div className="dropdown">
        <button onClick={() => setShowSocialDropdown(!showSocialDropdown)} className="dropdown-toggle">SOCIAL</button>
        {showSocialDropdown && (
          <div className="dropdown-menu">
            <span className="dropdown-header">Community:</span>
            <a href="https://discord.gg/MA3CSycC" target="_blank" rel="noopener noreferrer">Discord</a>
            <a href="https://twitter.com/Wild_Strikes" target="_blank" rel="noopener noreferrer">X</a>
            <a href="https://www.facebook.com/wildstrikess" target="_blank" rel="noopener noreferrer">Facebook</a>
          </div>
        )}
      </div>

      <div className="dropdown">
        <button onClick={() => setShowMoreDropdown(!showMoreDropdown)} className="dropdown-toggle">MORE</button>
        {showMoreDropdown && (
          <div className="dropdown-menu">
            <a href="https://wild-strikes-1.gitbook.io/wild-strikes/?fbclid=IwY2xjawLnCq1leHRuA2FlbQIxMABicmlkETFYdHoxSkJac3liRHFKMjcxAR7dbuzzkslH6c6yVFXvKIjlriQALsWoPUOqZYQYyLEQfIked26fs5bE1UncSw_aem_GCN9mVULQZFDe010jAd8SQ" target="_blank">Whitepaper</a>
            {/* <a href="/code-of-conduct" target="_blank">Code of Conduct</a> */}
            {/* <a href="/privacy-policy" target="_blank">Privacy Policy</a> */}
            <a href="/terms-and-conditions" target="_blank">Terms of Use</a>
          </div>
        )}
      </div>
    </nav>
  );
}

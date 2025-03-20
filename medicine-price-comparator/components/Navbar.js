import Link from "next/link";
import { FaPills, FaHistory, FaBell, FaUser, FaBars } from "react-icons/fa";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-light" style={{ backgroundColor: "#28a745" }}>
      <div className="container">
        {/* Brand Logo */}
        <Link href="/" className="navbar-brand text-white fw-bold">
          <FaPills className="me-2" /> Pharmacy Comparator
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <FaBars className="text-white" />
        </button>

        {/* Navbar Links */}
        <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link href="/comparator" className="nav-link text-white">
                <FaPills className="me-1" /> Comparator
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/history" className="nav-link text-white">
                <FaHistory className="me-1" /> History
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/alerts" className="nav-link text-white">
                <FaBell className="me-1" /> Alerts
              </Link>
            </li>

            {/* Dropdown Menu for Profile */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle text-white"
                href="#"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
              >
                <FaUser className="me-1" /> Profile
              </a>
              <ul className="dropdown-menu">
                <li><Link href="/profile" className="dropdown-item">My Account</Link></li>
                <li><a href="#" className="dropdown-item">Settings</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a href="#" className="dropdown-item">Logout</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

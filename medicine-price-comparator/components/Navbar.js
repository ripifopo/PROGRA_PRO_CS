import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        {/* Home link */}
        <Link href="/" className="navbar-brand">
          Medicine Price Comparator
        </Link>
        {/* Toggle button for mobile menu */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        {/* Navigation links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link href="/comparator" className="nav-link">Comparator</Link>
            </li>
            <li className="nav-item">
              <Link href="/history" className="nav-link">History</Link>
            </li>
            <li className="nav-item">
              <Link href="/alerts" className="nav-link">Alerts</Link>
            </li>
            <li className="nav-item">
              <Link href="/profile" className="nav-link">Profile</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

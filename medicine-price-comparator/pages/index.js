import Navbar from "../components/Navbar";
import Link from "next/link";
import { FaSearch, FaClipboardList, FaBell } from "react-icons/fa";

export default function Home() {
  return (
    <>
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <div className="container-fluid text-white text-center py-5" style={{ backgroundColor: "#28a745" }}>
        <h1 className="fw-bold">Find the Best Medicine Prices</h1>
        <p className="lead">Compare prices, track price history, and receive alerts from multiple pharmacies.</p>
        <Link href="/comparator" className="btn btn-light btn-lg mt-3 fw-bold">
          <FaSearch className="me-2" /> Start Comparing
        </Link>
      </div>

      {/* Features Section */}
      <div className="container mt-5">
        <div className="row text-center">
          {/* Feature 1 - Comparator */}
          <div className="col-md-4">
            <div className="card shadow-sm p-4">
              <FaSearch className="text-success display-4 mb-3" />
              <h5>Compare Prices</h5>
              <p>Find the best deals across multiple pharmacies.</p>
            </div>
          </div>
          
          {/* Feature 2 - History */}
          <div className="col-md-4">
            <div className="card shadow-sm p-4">
              <FaClipboardList className="text-success display-4 mb-3" />
              <h5>Track Price History</h5>
              <p>Monitor price changes over time to get the best offer.</p>
            </div>
          </div>

          {/* Feature 3 - Alerts */}
          <div className="col-md-4">
            <div className="card shadow-sm p-4">
              <FaBell className="text-success display-4 mb-3" />
              <h5>Set Price Alerts</h5>
              <p>Receive notifications when prices drop.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

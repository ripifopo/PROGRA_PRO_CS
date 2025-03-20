import Navbar from "../components/Navbar";
import { useState } from "react";
import { FaSearch, FaFilter, FaSort } from "react-icons/fa";

export default function Comparator() {
  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState([
    { name: "Paracetamol", price: "$5.00", pharmacy: "Pharmacy A", availability: "In Stock" },
    { name: "Ibuprofen", price: "$6.50", pharmacy: "Pharmacy B", availability: "Limited" },
    { name: "Aspirin", price: "$4.80", pharmacy: "Pharmacy C", availability: "Out of Stock" }
  ]);

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Page Header */}
      <div className="container mt-5 text-center">
        <h1 className="fw-bold">Compare Medicine Prices</h1>
        <p className="lead">Search and compare medicine prices across different pharmacies.</p>
      </div>

      {/* Search and Filter Section */}
      <div className="container mt-4">
        <div className="row">
          {/* Search Bar */}
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-success text-white">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search for a medicine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Button */}
          <div className="col-md-4 text-end">
            <button className="btn btn-outline-success">
              <FaFilter className="me-1" /> Filter Options
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="container mt-4">
        <div className="table-responsive">
          <table className="table table-hover table-bordered">
            <thead className="table-success">
              <tr>
                <th>Medicine</th>
                <th>Price <FaSort /></th>
                <th>Pharmacy</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {medicines
                .filter((med) => med.name.toLowerCase().includes(search.toLowerCase()))
                .map((med, index) => (
                  <tr key={index}>
                    <td>{med.name}</td>
                    <td>{med.price}</td>
                    <td>{med.pharmacy}</td>
                    <td>
                      <span
                        className={`badge ${
                          med.availability === "In Stock"
                            ? "bg-success"
                            : med.availability === "Limited"
                            ? "bg-warning"
                            : "bg-danger"
                        }`}
                      >
                        {med.availability}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

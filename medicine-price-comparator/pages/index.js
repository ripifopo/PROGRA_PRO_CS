import Navbar from "../components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Include the Navbar component */}
      <Navbar />
      <div className="container text-center mt-5">
        {/* Main title */}
        <h1 className="mb-4">Medicine Price Comparator</h1>
        {/* Platform description */}
        <p className="lead">
          Find the best prices for medicines in different pharmacies quickly and easily.
        </p>
        {/* Button linking to the comparator page */}
        <Link href="/comparator" className="btn btn-primary btn-lg mt-3">
          Compare Prices
        </Link>
      </div>
    </>
  );
}

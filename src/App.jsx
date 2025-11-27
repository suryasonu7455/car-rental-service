import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Bookings from "./pages/Bookings";
import AdminImages from "./pages/AdminImages";
import Book from "./pages/Book";
import "./App.css";
// StarField removed

export default function App() {
  return (
    <Router>
      <div className="app">
        <div className="animated-bg" aria-hidden="true" />
        {/* starfield removed */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 18px",
            borderBottom: "1px solid #eee",
          }}
        >
          <h1 style={{ margin: 0 }}>Car Rental Service</h1>
          <nav>
            <Link to="/" style={{ marginRight: "12px" }}>
              Home
            </Link>
            <Link to="/book" style={{ marginRight: "12px" }}>
              Book
            </Link>
            <Link to="/bookings" style={{ marginRight: "12px" }}>
              Bookings
            </Link>
            <Link to="/admin">Admin</Link>
          </nav>
          {/* header controls removed */}
        </header>
        <main style={{ padding: "18px" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<Book />} />
            <Route path="/book/:id" element={<Book />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/admin" element={<AdminImages />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

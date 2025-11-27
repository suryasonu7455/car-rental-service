import React, { useEffect, useState } from "react";
import CarCard from "../components/CarCard";
import { useNavigate } from "react-router-dom";
import { getCars } from "../api";

export default function Home() {
  const [cars, setCars] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async function () {
      try {
        const list = await getCars();
        setCars(list);
      } catch (err) {
        const status = err.response?.status;
        const msg =
          err.response?.data?.error || err.message || "Failed to fetch cars";
        setError(status ? `${status}: ${msg}` : msg);
      }
    })();
  }, []);

  const onBook = (car) => {
    navigate(`/book/${car.id}`);
  };

  return (
    <div>
      <h2>Available Cars</h2>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {cars.map((car) => (
          <CarCard key={car.id} car={car} onBook={onBook} />
        ))}
      </div>

      {message && (
        <div style={{ marginTop: "8px", color: "green" }}>{message}</div>
      )}
      {error && (
        <div style={{ marginTop: "8px", color: "red" }}>Error: {error}</div>
      )}
    </div>
  );
}

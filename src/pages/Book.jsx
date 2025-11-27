import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCars } from "../api";
import BookingForm from "../components/BookingForm";

export default function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async function () {
      try {
        const list = await getCars();
        setCars(list);
        if (id) {
          const found = list.find((c) => String(c.id) === String(id));
          if (found) setSelected(found);
        }
      } catch (err) {
        setError(
          err.response?.data?.error || err.message || "Failed to load cars"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onBookSuccess = (booking) => {
    setMessage(`Booked! Id: ${booking.id}`);
    // navigate to bookings page after a short delay
    setTimeout(() => navigate("/bookings"), 700);
  };

  if (loading) return <div>Loading cars…</div>;

  return (
    <div>
      <h2>Book a Car</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Select car:</label>
        <select
          value={selected?.id || ""}
          onChange={(e) =>
            setSelected(cars.find((c) => String(c.id) === e.target.value))
          }
        >
          <option value="">-- choose a car --</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.make} {c.model} ({c.year})
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <div>
          <div style={{ marginBottom: 12 }}>
            <strong>
              {selected.make} {selected.model}
            </strong>
            <div>
              {selected.type} • {selected.seats} seats •{" "}
              {selected.pricePerDay ? `₹${selected.pricePerDay}` : ""}
            </div>
          </div>
          <BookingForm
            car={selected}
            onSuccess={onBookSuccess}
            onCancel={() => setSelected(null)}
          />
        </div>
      ) : (
        <div>No car selected</div>
      )}

      {message && (
        <div style={{ color: "green", marginTop: 12 }}>{message}</div>
      )}
    </div>
  );
}

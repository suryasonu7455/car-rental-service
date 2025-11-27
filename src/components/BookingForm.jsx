import React, { useState } from "react";
import { createBooking } from "../api";

export default function BookingForm({ car, onSuccess, onCancel }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const booking = await createBooking({
        carId: car.id,
        startDate,
        endDate,
        customer: { name },
      });
      setLoading(false);
      onSuccess(booking);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{ border: "1px solid #eee", padding: "12px", marginTop: "12px" }}
    >
      <h4>
        Book {car.make} {car.model}
      </h4>
      <div>
        <label>Customer name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label>Start date</label>
        <input
          required
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div>
        <label>End date</label>
        <input
          required
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      {error && <div style={{ color: "darkred" }}>{error}</div>}
      <div style={{ marginTop: "8px" }}>
        <button type="submit" disabled={loading}>
          {loading ? "Booking…" : "Confirm Booking"}
        </button>
        <button type="button" onClick={onCancel} style={{ marginLeft: "8px" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

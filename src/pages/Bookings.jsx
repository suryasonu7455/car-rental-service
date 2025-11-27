import React, { useEffect, useState } from "react";
import { getBookings, getCars } from "../api";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);

  useEffect(() => {
    (async function () {
      try {
        const [b, c] = await Promise.all([getBookings(), getCars()]);
        setBookings(b);
        setCars(c);
      } catch (err) {
        // fall back to showing no bookings and log error
        console.error("Failed to fetch bookings or cars", err);
      }
    })();
  }, []);

  const findCar = (id) => cars.find((c) => c.id === id);

  return (
    <div>
      <h2>Bookings</h2>
      {bookings.length === 0 && <div>No bookings yet</div>}
      <ul>
        {bookings.map((bk) => {
          const car = findCar(bk.carId);
          return (
            <li key={bk.id} style={{ marginBottom: "8px" }}>
              <strong>{bk.customer?.name || "Unknown"}</strong> booked{" "}
              <em>
                {car?.make} {car?.model}
              </em>
              <div>
                {new Date(bk.startDate).toLocaleDateString()} →{" "}
                {new Date(bk.endDate).toLocaleDateString()}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

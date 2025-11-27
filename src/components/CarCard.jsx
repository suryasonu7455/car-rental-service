import React, { useState } from "react";
import { formatINR } from "../utils/currency";

export default function CarCard({ car, onBook }) {
  const [imgSrc, setImgSrc] = useState(car.image || "/cars/placeholder.svg");
  const [triedAlt, setTriedAlt] = useState(false);

  function handleImgError(e) {
    if (!triedAlt) {
      const alt = imgSrc.includes("_")
        ? imgSrc.replace(/_/g, "-")
        : imgSrc.replace(/-/g, "_");
      setImgSrc(alt);
      setTriedAlt(true);
      e.currentTarget.src = alt;
      return;
    }
    e.currentTarget.src = "/cars/placeholder.svg";
  }

  return (
    <div
      className="car-card"
      style={{
        border: "1px solid #ccc",
        padding: "12px",
        margin: "8px",
        borderRadius: "8px",
        width: "260px",
      }}
    >
      <img
        src={imgSrc}
        alt={`${car.make} ${car.model}`}
        onError={handleImgError}
        loading="lazy"
        style={{
          width: "100%",
          height: "140px",
          objectFit: "cover",
          borderRadius: "6px",
        }}
      />

      <div style={{ paddingTop: "8px" }}>
        <h3 style={{ margin: "6px 0" }}>
          {car.make} {car.model} ({car.year})
        </h3>
        <p style={{ margin: "6px 0" }}>
          Type: {car.type} • Seats: {car.seats} • {formatINR(car.pricePerDay)}
          /day
        </p>
        {/* image source debug removed */}
        <button onClick={() => onBook(car)}>Book</button>
      </div>
    </div>
  );
}

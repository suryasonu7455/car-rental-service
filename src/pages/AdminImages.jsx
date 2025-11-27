import React, { useEffect, useState } from "react";
import { getCars, updateCar } from "../api";
import axios from "axios";
import { formatINR } from "../utils/currency";

export default function AdminImages() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    (async function () {
      try {
        const list = await getCars();
        setCars(list.map((c) => ({ ...c, editImage: c.image })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveCarImage(car) {
    setSavingId(car.id);
    try {
      const updated = await updateCar(car.id, { image: car.editImage });
      setCars((prev) =>
        prev.map((c) =>
          c.id === car.id ? { ...updated, editImage: updated.image } : c
        )
      );
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message;
      setError(status ? `${status}: ${msg}` : msg);
    } finally {
      setSavingId(null);
    }
  }

  async function resetCarImage(car) {
    setSavingId(car.id);
    try {
      const resp = await axios.post(`/api/cars/${car.id}/reset`);
      const updated = resp.data;
      setCars((prev) =>
        prev.map((c) =>
          c.id === car.id ? { ...updated, editImage: updated.image } : c
        )
      );
      setMessage(`Reset car ${car.id} to default image`);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message;
      setError(status ? `${status}: ${msg}` : msg);
    } finally {
      setSavingId(null);
    }
  }

  async function saveAll() {
    setMessage(null);
    setError(null);
    const toSave = cars.filter((c) => c.editImage !== c.image);
    if (!toSave.length) return setMessage("No changes to save");
    try {
      await Promise.all(
        toSave.map((c) => updateCar(c.id, { image: c.editImage }))
      );
      const list = await getCars();
      setCars(list.map((c) => ({ ...c, editImage: c.image })));
      setMessage(`Saved ${toSave.length} images`);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message;
      setError(status ? `${status}: ${msg}` : msg);
    }
  }

  async function resetAll() {
    setMessage(null);
    setError(null);
    setSavingId("all");
    try {
      await axios.post("/api/images/reset");
      const list = await getCars();
      setCars(list.map((c) => ({ ...c, editImage: c.image })));
      setMessage("Reset all images to defaults");
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message;
      setError(status ? `${status}: ${msg}` : msg);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Admin: Edit Car Images</h2>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <button onClick={saveAll} disabled={savingId === "all"}>
          Save All
        </button>
        <button onClick={resetAll} disabled={savingId === "all"}>
          {savingId === "all" ? "Resetting..." : "Reset All"}
        </button>
        {message && <div style={{ color: "green" }}>{message}</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>ID</th>
            <th style={{ textAlign: "left", padding: 8 }}>Car</th>
            <th style={{ textAlign: "left", padding: 8 }}>Image URL</th>
            <th style={{ textAlign: "left", padding: 8 }}>Preview</th>
            <th style={{ padding: 8 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{car.id}</td>
              <td style={{ padding: 8 }}>
                {car.make} {car.model}{" "}
                <div style={{ color: "#888", fontSize: 12 }}>
                  {formatINR(car.price)}
                </div>
              </td>
              <td style={{ padding: 8 }}>
                <input
                  style={{ width: "100%" }}
                  value={car.editImage || ""}
                  onChange={(e) =>
                    setCars((prev) =>
                      prev.map((c) =>
                        c.id === car.id
                          ? { ...c, editImage: e.target.value }
                          : c
                      )
                    )
                  }
                  placeholder="/cars/my-car.svg or https://..."
                />
              </td>
              <td style={{ padding: 8 }}>
                {car.editImage ? (
                  <img
                    src={car.editImage}
                    alt="preview"
                    style={{
                      width: 120,
                      height: 60,
                      objectFit: "cover",
                      border: "1px solid #ddd",
                    }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <span style={{ color: "#777" }}>No image</span>
                )}
              </td>
              <td style={{ padding: 8 }}>
                <button
                  onClick={() => saveCarImage(car)}
                  disabled={savingId === car.id}
                >
                  {savingId === car.id ? "Saving..." : "Save"}
                </button>
                <button
                  style={{ marginLeft: 8 }}
                  onClick={() => resetCarImage(car)}
                  disabled={savingId === car.id}
                >
                  {savingId === car.id ? "..." : "Reset"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

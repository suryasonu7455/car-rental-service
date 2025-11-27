import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export async function getCars() {
  const resp = await api.get("/cars");
  return resp.data;
}

export async function getCar(id) {
  const resp = await api.get(`/cars/${id}`);
  return resp.data;
}

export async function createBooking(booking) {
  const resp = await api.post("/bookings", booking);
  return resp.data;
}

export async function getBookings() {
  const resp = await api.get("/bookings");
  return resp.data;
}

export async function updateCar(id, patch) {
  const resp = await api.put(`/cars/${id}`, patch);
  return resp.data;
}

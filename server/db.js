import fs from "fs";
import path from "path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { cars as seedCars } from "./data.js";

export const DB_FILE = path.join(process.cwd(), "server", "db.json");

export async function initDb() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const adapter = new JSONFile(DB_FILE);
    // Provide default data schema to satisfy lowdb requirements
    const db = new Low(adapter, { cars: [], bookings: [], images: {} });
    // read data, set defaults
    await db.read();
    db.data = db.data || { cars: [], bookings: [], images: {} };

    // seed cars if missing
    if (!Array.isArray(db.data.cars) || db.data.cars.length === 0) {
      db.data.cars = seedCars.map((c) => ({
        id: c.id,
        make: c.make || "",
        model: c.model || "",
        year: c.year || 0,
        type: c.type || "",
        seats: c.seats || 4,
        price: c.price || 0,
        pricePerDay: c.pricePerDay || c.price || 0,
        image: c.image || "/cars/placeholder.svg",
      }));
    }

    // ensure bookings and images are set
    db.data.bookings = db.data.bookings || [];
    db.data.images = db.data.images || {};

    await db.write();
    return db;
  } catch (err) {
    console.error("initDb error", err);
    throw err;
  }
}

export function getAllCars(db) {
  return (db.data?.cars || []).slice().sort((a, b) => a.id - b.id);
}

export function getCarById(db, id) {
  return (db.data?.cars || []).find((c) => c.id === Number(id));
}

export async function updateCarImage(db, id, image) {
  const car = getCarById(db, id);
  if (!car) return null;
  car.image = image;
  db.data.images = db.data.images || {};
  db.data.images[Number(id)] = image;
  await db.write();
  return { ...car };
}

export function getBookings(db) {
  return (db.data?.bookings || [])
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function createBooking(db, booking) {
  db.data.bookings = db.data.bookings || [];
  const ids = db.data.bookings.map((b) => b.id || 0);
  const nextId = ids.length ? Math.max(...ids) + 1 : 1;
  const row = {
    id: nextId,
    carId: Number(booking.carId),
    startDate: booking.startDate,
    endDate: booking.endDate,
    customer: { name: booking.customer.name },
    createdAt: Date.now(),
  };
  db.data.bookings.push(row);
  await db.write();
  return row;
}

export async function resetImageForCar(db, carId) {
  db.data.images = db.data.images || {};
  delete db.data.images[Number(carId)];
  const seed = seedCars.find((s) => s.id === Number(carId));
  const image = seed && seed.image ? seed.image : "/cars/placeholder.svg";
  const car = getCarById(db, carId);
  if (car) car.image = image;
  await db.write();
  return { ...car };
}

export async function resetAllImages(db) {
  db.data.images = {};
  db.data.cars = (seedCars || []).map((c) => ({
    id: c.id,
    make: c.make || "",
    model: c.model || "",
    year: c.year || 0,
    type: c.type || "",
    seats: c.seats || 4,
    price: c.price || 0,
    pricePerDay: c.pricePerDay || c.price || 0,
    image: c.image || "/cars/placeholder.svg",
  }));
  await db.write();
}

export function getImagesMapFromDb(db) {
  return db.data.images || {};
}

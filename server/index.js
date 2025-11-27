import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { cars as seedCars } from "./data.js";
import {
  initDb,
  getAllCars,
  getCarById,
  updateCarImage,
  getBookings as dbGetBookings,
  createBooking as dbCreateBooking,
  resetImageForCar,
  resetAllImages,
  getImagesMapFromDb,
  DB_FILE,
} from "./db.js";

// Keep a deep copy of original seed data so we can reset to initial images
const originalCars = JSON.parse(JSON.stringify(seedCars));

// Initialize DB
let db;
try {
  db = await initDb();
  console.log("DB initialized and loaded", "dbFile=", DB_FILE);
} catch (err) {
  console.error(
    "DB init failed, falling back to in-memory DB",
    err && err.stack ? err.stack : err
  );
  // Fallback: create a simple in-memory object that mimics lowdb shape
  db = {
    data: { cars: seedCars.map((c) => ({ ...c })), bookings: [], images: {} },
    read: async () => {},
    write: async () => {},
  };
}

// If running with in-memory fallback, warn and show DB path
if (fs.existsSync(DB_FILE)) {
  console.log("DB file exists at", DB_FILE);
} else {
  console.warn(
    "DB file not found on disk, server may be using in-memory fallback"
  );
}

// Make DB read of cars for in-memory normalization
let cars = [];
try {
  cars = getAllCars(db).map((c) => ({ ...c }));
} catch (err) {
  console.warn(
    "Failed to load cars from DB at startup",
    err && err.stack ? err.stack : err
  );
  cars = [];
}
// let bookings = []; // Removed as bookings are now handled by the database

// persistent images mapping file
const IMAGES_FILE = path.join(process.cwd(), "server", "images.json");
let imagesMap = {};
try {
  if (fs.existsSync(IMAGES_FILE)) {
    imagesMap = JSON.parse(fs.readFileSync(IMAGES_FILE, "utf8") || "{}");
    // ensure stored values are strings; drop non-string entries
    Object.keys(imagesMap).forEach((k) => {
      if (typeof imagesMap[k] !== "string") {
        console.warn(`images.json: removing non-string value for key ${k}`);
        delete imagesMap[k];
      }
    });
    // Import overrides into DB (if any) so DB and file are aligned
    try {
      const ids = Object.keys(imagesMap);
      for (const k of ids) {
        const id = Number(k);
        const image = imagesMap[k];
        if (Number.isFinite(id) && typeof image === "string") {
          try {
            await updateCarImage(db, id, image);
          } catch (err) {
            console.warn(`Failed to import image override for car ${id}`, err);
          }
        }
      }
    } catch (err) {
      console.warn("Failed migrating images.json to DB", err);
    }
  }
} catch (err) {
  console.warn("Could not read images.json, starting with empty mapping");
  imagesMap = {};
}

function saveImagesMap() {
  try {
    fs.writeFileSync(IMAGES_FILE, JSON.stringify(imagesMap, null, 2));
  } catch (err) {
    console.error("Failed to write images.json", err);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

function logAndRespond(res, err, message) {
  console.error(message, err && err.stack ? err.stack : err);
  try {
    recentErrors.push({
      time: new Date().toISOString(),
      message,
      detail: err?.message,
      stack: err?.stack,
    });
  } catch (e) {}
  // Return helpful error message + stack trace (development only)
  return res
    .status(500)
    .json({ error: message, detail: err?.message, stack: err?.stack });
}

// enable CORS and JSON body parsing
app.use(cors());
app.use(
  express.json({
    limit: "2mb",
    verify: (req, res, buf) => {
      try {
        req._rawBody = buf ? buf.toString() : "";
      } catch (e) {
        req._rawBody = "";
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// request logger middleware (include content-type)
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.path} content-type=${req.headers["content-type"]}`
  );
  next();
});
// Simple in-memory error capture for debugging
const recentErrors = [];
// Simple in-memory request capture for debugging
const recentRequests = [];

// capture recent requests for debug endpoint
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    try {
      const elapsed = Date.now() - start;
      const entry = {
        time: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        elapsed,
        contentType: req.headers["content-type"],
        body: req.body,
        raw: req._rawBody,
      };
      recentRequests.push(entry);
      if (recentRequests.length > 50) recentRequests.shift();
    } catch (err) {
      console.warn("Failed to record request to recentRequests", err);
    }
  });
  next();
});

// Health endpoint for debug
app.get("/health", (req, res) => {
  try {
    const carsCount = (getAllCars(db) || []).length;
    const bookingsCount = (db.data?.bookings || []).length;
    const imagesCount = Object.keys(getImagesMapFromDb(db) || {}).length;
    return res.json({
      ok: true,
      cars: carsCount,
      bookings: bookingsCount,
      images: imagesCount,
    });
  } catch (err) {
    console.error("Health check failed", err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, error: "Health check failed" });
  }
});

app.get("/debug/errors", (req, res) => {
  res.json(recentErrors.slice(-20));
});

app.get("/debug/requests", (req, res) => {
  res.json(recentRequests.slice(-50));
});

// Debug: show the current DB snapshot
app.get("/debug/db", (req, res) => {
  try {
    if (!db || !db.data)
      return res.status(500).json({ error: "DB not initialized" });
    // Deep clone data so we don't expose internal references
    const snapshot = JSON.parse(JSON.stringify(db.data));
    return res.json({ ok: true, snapshot });
  } catch (err) {
    return logAndRespond(res, err, "Failed to retrieve DB snapshot");
  }
});

// Debug: backup DB to server/db.json.bak
app.post("/debug/db/backup", async (req, res) => {
  try {
    const src = DB_FILE;
    const dst = DB_FILE + ".bak";
    if (!fs.existsSync(src))
      return res.status(500).json({ error: "DB file not found" });
    fs.copyFileSync(src, dst);
    return res.json({ ok: true, path: dst });
  } catch (err) {
    return logAndRespond(res, err, "Failed to backup DB");
  }
});

// Validate that each car's image path exists and normalize; if missing, fallback to placeholder
// apply persisted images from images.json first
for (const car of cars) {
  if (imagesMap[car.id]) {
    car.image = imagesMap[car.id];
    // if DB has an image override for this car, it should already be in the DB and in the cars table
    // if not, set DB image mapping now
    try {
      const dbCar = getCarById(db, car.id);
      if (!dbCar) {
        // nothing
      }
    } catch (err) {
      console.warn("Error checking DB car for image mapping", err);
    }
  }

  try {
    let rawImage = car.image || "";
    if (typeof rawImage !== "string") rawImage = "";
    // Skip normalization for remote URLs and data URIs
    if (/^https?:\/\//i.test(rawImage) || /^data:/i.test(rawImage)) continue;
    const rel = rawImage.replace(/^\//, ""); // remove leading slash
    const parsed = path.parse(rel);
    const dirPart = parsed.dir || "cars";
    const baseName = parsed.name;
    const origExt = parsed.ext || ".svg";

    const tryNames = new Set();
    tryNames.add(baseName);
    tryNames.add(baseName.replace(/_/g, "-"));
    tryNames.add(baseName.replace(/-/g, "_"));

    const extsToTry = [origExt, ".svg", ".png", ".jpg", ".jpeg"];

    let found = false;
    for (const name of tryNames) {
      for (const e of extsToTry) {
        const candidate = path.join(dirPart, name + e);
        const candidatePath = path.join(process.cwd(), "public", candidate);
        if (fs.existsSync(candidatePath)) {
          car.image = "/" + candidate.replace(/\\\\/g, "/");
          console.log(
            `Normalized image for ${car.make} ${car.model} to ${car.image}`
          );
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      car.image = "/cars/placeholder.svg";
      console.warn(
        `image missing for car ${car.make} ${car.model}, set to placeholder`
      );
    }
    // If normalization changed the in-memory car.image (compared to db), persist it
    try {
      const dbCar = getCarById(db, car.id);
      if (dbCar && dbCar.image !== car.image) {
        await updateCarImage(db, car.id, car.image);
      }
    } catch (err) {
      console.warn(
        "Failed to update normalized image in DB for car",
        car.id,
        err
      );
    }
  } catch (err) {
    console.error("Error validating images", err);
  }
}

app.get("/api/cars", async (req, res) => {
  try {
    const rows = getAllCars(db);
    console.log(`GET /api/cars -> ${rows.length} rows`);
    return res.json(rows);
  } catch (err) {
    return logAndRespond(res, err, "Failed to fetch cars");
  }
});

app.get("/api/cars/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "Invalid car id" });
  const car = getCarById(db, id);
  if (!car) return res.status(404).json({ error: "Car not found" });
  return res.json(car);
});

// Update car (supports updating `image` field)
app.put("/api/cars/:id", async (req, res) => {
  const id = Number(req.params.id);
  console.log("PUT /api/cars/:id body=", req.body, "raw=", req._rawBody);
  const car = getCarById(db, id);
  if (!car) return res.status(404).json({ error: "Car not found" });

  const { image } = req.body || {};
  if (!image) return res.status(400).json({ error: "Missing image in body" });
  if (typeof image !== "string")
    return res.status(400).json({ error: "Image must be a string" });

  // Accept remote http/https URLs as-is
  if (/^https?:\/\//i.test(image) || /^data:/i.test(image)) {
    const updated = await updateCarImage(db, id, image);
    console.log(`Updating car ${id} image to remote URL`);
    imagesMap[updated.id] = updated.image;
    saveImagesMap();
    return res.json(updated);
  }

  // If the image is a local path, validate and normalize as done at startup
  try {
    const rel = image.replace(/^\//, "");
    const parsed = path.parse(rel);
    const dirPart = parsed.dir || "cars";
    const baseName = parsed.name;
    const origExt = parsed.ext || ".svg";

    const tryNames = new Set();
    tryNames.add(baseName);
    tryNames.add(baseName.replace(/_/g, "-"));
    tryNames.add(baseName.replace(/-/g, "_"));
    const extsToTry = [origExt, ".svg", ".png", ".jpg", ".jpeg"];

    let found = false;
    for (const name of tryNames) {
      for (const e of extsToTry) {
        const candidate = path.join(dirPart, name + e);
        const candidatePath = path.join(process.cwd(), "public", candidate);
        if (fs.existsSync(candidatePath)) {
          const normalized = "/" + candidate.replace(/\\\\/g, "/");
          const updated = await updateCarImage(db, id, normalized);
          imagesMap[updated.id] = updated.image;
          saveImagesMap();
          return res.json(updated);
        }
      }
      if (found) break;
    }
    if (!found) {
      car.image = "/cars/placeholder.svg";
    }
    const updated = await updateCarImage(db, id, car.image);
    console.log(`Updated car ${id} image to ${updated.image}`);
    imagesMap[updated.id] = updated.image;
    saveImagesMap();
    return res.json(updated);
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Server error while validating image" });
  }
});

// (migrated reset now handled below with DB-backed persistence)
app.post("/api/cars/:id/reset", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "Invalid car id" });
  const car = getCarById(db, id);
  if (!car) return res.status(404).json({ error: "Car not found" });
  try {
    const updated = await resetImageForCar(db, id);
    if (imagesMap[id]) delete imagesMap[id];
    saveImagesMap();
    return res.json(updated);
  } catch (err) {
    return logAndRespond(res, err, "Server error while resetting image");
  }
});

// Reset all images overrides to defaults
app.post("/api/images/reset", async (req, res) => {
  try {
    await resetAllImages(db);
    imagesMap = {};
    saveImagesMap();
    return res.json({ message: "Images reset" });
  } catch (err) {
    return logAndRespond(res, err, "Server error resetting images");
  }
});

function datesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA;
}

app.post("/api/bookings", async (req, res) => {
  console.log("POST /api/bookings body=", req.body, "raw=", req._rawBody);
  const { carId, startDate, endDate, customer } = req.body;
  if (!carId || !startDate || !endDate || !customer) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
    return res.status(400).json({ error: "Invalid dates" });
  }

  const car = getCarById(db, Number(carId));
  if (!car) return res.status(404).json({ error: "Car not found" });

  // check availability
  const all = dbGetBookings(db).filter((b) => b.carId === car.id);
  const conflict = all.find((b) =>
    datesOverlap(new Date(b.startDate), new Date(b.endDate), start, end)
  );
  if (conflict) {
    return res.status(409).json({ error: "Car not available for these dates" });
  }

  const booking = await dbCreateBooking(db, {
    carId: car.id,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    customer,
  });
  return res.status(201).json(booking);
});

app.get("/api/bookings", async (req, res) => {
  try {
    const rows = dbGetBookings(db);
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch bookings from DB", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// get persisted images map
app.get("/api/images", (req, res) => {
  try {
    const dbMap = getImagesMapFromDb(db);
    if (Object.keys(dbMap).length) return res.json(dbMap);
  } catch (err) {
    console.warn("Failed to read images from DB", err);
  }
  res.json(imagesMap);
});

// Global error handler: log and return a 500 JSON response
app.use((err, req, res, next) => {
  console.error("Unhandled error", err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Debug errors: http://localhost:${PORT}/debug/errors`);
});

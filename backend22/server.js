
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "campusconnect"
};

let db;

// Check backend
app.get("/", (req, res) => {
  res.send("CampusConnect backend is working!");
});

// Get all events
app.get("/events", async (req, res) => {
  try {
    const [events] = await db.execute(`
      SELECT
        e.id,
        e.name,
        e.category,
        DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date,
        e.venue,
        e.description,
        e.capacity,
        COUNT(r.id) AS registered_count,
        GREATEST(e.capacity - COUNT(r.id), 0) AS seats_remaining
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY
        e.id, e.name, e.category, e.event_date,
        e.venue, e.description, e.capacity
      ORDER BY e.event_date ASC
    `);

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load events." });
  }
});

// Add an event
app.post("/events", async (req, res) => {
  try {
    const {
      name,
      category,
      event_date,
      venue,
      description,
      capacity
    } = req.body;

    if (
      !name?.trim() ||
      !category ||
      !event_date ||
      !venue?.trim() ||
      !Number.isInteger(Number(capacity)) ||
      Number(capacity) < 1
    ) {
      return res.status(400).json({
        message: "Please enter valid event details."
      });
    }

    const [result] = await db.execute(
      `INSERT INTO events
       (name, category, event_date, venue, description, capacity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category,
        event_date,
        venue.trim(),
        description || "",
        Number(capacity)
      ]
    );

    res.status(201).json({
      message: "Event added successfully!",
      id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to add event." });
  }
});

// Delete an event
app.delete("/events/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    const [result] = await db.execute(
      "DELETE FROM events WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found." });
    }

    res.json({ message: "Event deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to delete event. Check database relationships."
    });
  }
});

// Register a student
app.post("/registrations", async (req, res) => {
  try {
    const { name, rollNumber, email, eventId } = req.body;
    const id = Number(eventId);

    if (
      !name?.trim() ||
      !rollNumber?.trim() ||
      !email?.trim() ||
      !Number.isInteger(id) ||
      id < 1
    ) {
      return res.status(400).json({
        message: "Please enter valid student details."
      });
    }

    const [events] = await db.execute(
      "SELECT id, capacity FROM events WHERE id = ?",
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: "Event not found." });
    }

    const [counts] = await db.execute(
      "SELECT COUNT(*) AS total FROM registrations WHERE event_id = ?",
      [id]
    );

    if (Number(counts[0].total) >= Number(events[0].capacity)) {
      return res.status(400).json({
        message: "This event has no seats remaining."
      });
    }

    const [result] = await db.execute(
      `INSERT INTO registrations
       (student_name, roll_number, email, event_id)
       VALUES (?, ?, ?, ?)`,
      [name.trim(), rollNumber.trim(), email.trim(), id]
    );

    res.status(201).json({
      message: "Registration successful!",
      id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to register student."
    });
  }
});

// Get all registrations
app.get("/registrations", async (req, res) => {
  try {
    const [registrations] = await db.execute(`
      SELECT
        r.id,
        r.student_name,
        r.roll_number,
        r.email,
        r.event_id,
        e.name AS event_name
      FROM registrations r
      INNER JOIN events e ON r.event_id = e.id
      ORDER BY r.id DESC
    `);

    res.json(registrations);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to load registrations."
    });
  }
});

// Connect to MySQL and start backend
async function startServer() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log("MySQL connected successfully!");

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
}

startServer();

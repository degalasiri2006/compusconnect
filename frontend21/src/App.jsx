
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

const emptyEvent = {
  name: "",
  category: "Workshop",
  event_date: "",
  venue: "",
  description: "",
  capacity: "50"
};

function App() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [page, setPage] = useState("events");
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [student, setStudent] = useState({
    name: "",
    rollNumber: "",
    email: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  async function loadEvents() {
    try {
      const response = await fetch(`${API}/events`);
      if (!response.ok) {
        throw new Error("Could not load events.");
      }

      const data = await response.json();
      setEvents(data);
    } catch {
      setError("Cannot connect to the backend. Check that it is running.");
    }
  }

  async function loadRegistrations() {
    try {
      const response = await fetch(`${API}/registrations`);
      if (!response.ok) {
        throw new Error("Could not load registrations.");
      }

      setRegistrations(await response.json());
    } catch {
      setError("Could not load registrations.");
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function addEvent(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventForm,
          capacity: Number(eventForm.capacity)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add event.");
      }

      setMessage("Event added successfully!");
      setEventForm(emptyEvent);
      await loadEvents();
      setPage("events");
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function registerStudent(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...student,
          eventId: selectedEvent.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setMessage("Registration successful!");
      setStudent({ name: "", rollNumber: "", email: "" });
      setSelectedEvent(null);
      await loadEvents();
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  // Delete Event feature
  async function deleteEvent(event) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.name}"?`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/events/${event.id}`, {
        method: "DELETE"
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not delete event.");
      }

      setMessage(data.message || "Event deleted successfully!");
      await loadEvents();
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    }
  }

  async function openRegistrations() {
    setError("");
    await loadRegistrations();
    setPage("registrations");
  }

  const filteredEvents = events.filter((event) =>
    `${event.name} ${event.category} ${event.venue}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function updateEvent(field, value) {
    setEventForm((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function updateStudent(field, value) {
    setStudent((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  return (
    <div className="app">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("events");
            setMessage("");
            setError("");
          }}
        >
          <span className="brand-icon">C</span>
          <span>CampusConnect</span>
        </a>

        <nav>
          <button
            className={page === "events" ? "nav-button active" : "nav-button"}
            onClick={() => {
              setPage("events");
              setMessage("");
              setError("");
            }}
          >
            Events
          </button>

          <button
            className={page === "add" ? "nav-button active" : "nav-button"}
            onClick={() => {
              setPage("add");
              setMessage("");
              setError("");
            }}
          >
            + Add Event
          </button>

          <button
            className={
              page === "registrations"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={openRegistrations}
          >
            Registrations
          </button>
        </nav>
      </header>

      <main>
        {message && <div className="notice success">{message}</div>}
        {error && <div className="notice error">{error}</div>}

        {page === "events" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">YOUR CAMPUS, YOUR COMMUNITY</p>

                <h1>
                  Discover events.
                  <br />
                  <span>Make memories.</span>
                </h1>

                <p className="hero-text">
                  Find workshops, competitions and campus activities.
                  Register for your next college experience.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    document
                      .getElementById("event-list")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Explore Events →
                </button>
              </div>

              <div className="hero-art" aria-hidden="true">
                <div className="art-circle">✦</div>
                <div className="art-card">
                  <span>UPCOMING AT CAMPUS</span>
                  <strong>
                    Learn. Create.
                    <br />
                    Connect.
                  </strong>
                  <div className="art-dots">●　●　●</div>
                </div>
              </div>
            </section>

            <section id="event-list" className="events-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">WHAT'S HAPPENING</p>
                  <h2>Campus events</h2>
                  <p className="muted">
                    Explore activities and reserve your place.
                  </p>
                </div>

                <input
                  className="search"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="stats">
                <div className="stat-card">
                  <strong>{events.length}</strong>
                  <span>Total events</span>
                </div>

                <div className="stat-card">
                  <strong>
                    {events.reduce(
                      (sum, e) =>
                        sum + Number(e.registered_count || 0),
                      0
                    )}
                  </strong>
                  <span>Registrations</span>
                </div>

                <div className="stat-card">
                  <strong>
                    {events.reduce(
                      (sum, e) =>
                        sum + Number(e.seats_remaining || 0),
                      0
                    )}
                  </strong>
                  <span>Seats available</span>
                </div>
              </div>

              <div className="event-grid">
                {filteredEvents.map((event, index) => (
                  <article className="event-card" key={event.id}>
                    <div className={`event-banner banner-${index % 4}`}>
                      <span className="category">{event.category}</span>

                      <span className="banner-symbol">
                        {["✦", "⌘", "♫", "▦"][index % 4]}
                      </span>
                    </div>

                    <div className="event-content">
                      <h3>{event.name}</h3>

                      <p className="description">
                        {event.description ||
                          "Join us for this campus event."}
                      </p>

                      <p className="event-detail">
                        ▦　{event.event_date}
                      </p>

                      <p className="event-detail">
                        ⌖　{event.venue}
                      </p>

                      <div className="seats-row">
                        <span>{event.seats_remaining} seats left</span>
                        <span>
                          {event.registered_count}/{event.capacity} registered
                        </span>
                      </div>

                      <div className="seat-track">
                        <div
                          style={{
                            width: `${
                              Math.min(
                                100,
                                (Number(event.registered_count) /
                                  Math.max(1, Number(event.capacity))) *
                                  100
                              )
                            }%`
                          }}
                        />
                      </div>

                      <button
                        className="primary-button full"
                        disabled={
                          Number(event.seats_remaining) <= 0 ||
                          event.event_date <
                            new Date().toISOString().slice(0, 10)
                        }
                        onClick={() => {
                          setSelectedEvent(event);
                          setMessage("");
                          setError("");
                        }}
                      >
                        {event.event_date <
                        new Date().toISOString().slice(0, 10)
                          ? "Event has passed"
                          : Number(event.seats_remaining) <= 0
                            ? "Fully booked"
                            : "Register Now →"}
                      </button>

                      {/* Delete Event button */}
                      <button
                        type="button"
                        className="delete-button full"
                        onClick={() => deleteEvent(event)}
                      >
                        Delete Event
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {filteredEvents.length === 0 && (
                <p className="empty">
                  No events found. Try another search or add an event.
                </p>
              )}
            </section>
          </>
        )}

        {page === "add" && (
          <section className="form-page">
            <p className="eyebrow">ADMIN DASHBOARD</p>
            <h1>Add a new event</h1>

            <p className="muted">
              Enter the details below. Your event will be saved in MySQL.
            </p>

            <form className="panel event-form" onSubmit={addEvent}>
              <label>
                Event name *
                <input
                  required
                  maxLength="150"
                  value={eventForm.name}
                  onChange={(e) =>
                    updateEvent("name", e.target.value)
                  }
                  placeholder="e.g. AI and Machine Learning Workshop"
                />
              </label>

              <div className="form-row">
                <label>
                  Category *
                  <select
                    required
                    value={eventForm.category}
                    onChange={(e) =>
                      updateEvent("category", e.target.value)
                    }
                  >
                    <option>Workshop</option>
                    <option>Technical</option>
                    <option>Cultural</option>
                    <option>Sports</option>
                    <option>Seminar</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Event date *
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={eventForm.event_date}
                    onChange={(e) =>
                      updateEvent("event_date", e.target.value)
                    }
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Venue *
                  <input
                    required
                    maxLength="150"
                    value={eventForm.venue}
                    onChange={(e) =>
                      updateEvent("venue", e.target.value)
                    }
                    placeholder="e.g. Seminar Hall"
                  />
                </label>

                <label>
                  Seat capacity *
                  <input
                    required
                    type="number"
                    min="1"
                    max="100000"
                    value={eventForm.capacity}
                    onChange={(e) =>
                      updateEvent("capacity", e.target.value)
                    }
                  />
                </label>
              </div>

              <label>
                Description
                <textarea
                  rows="4"
                  maxLength="2000"
                  value={eventForm.description}
                  onChange={(e) =>
                    updateEvent("description", e.target.value)
                  }
                  placeholder="Describe the event..."
                />
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEventForm(emptyEvent)}
                >
                  Clear form
                </button>

                <button
                  className="primary-button"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Saving..." : "Save Event"}
                </button>
              </div>
            </form>
          </section>
        )}

        {page === "registrations" && (
          <section className="form-page">
            <p className="eyebrow">ADMIN DASHBOARD</p>
            <h1>Student registrations</h1>

            <p className="muted">
              Registrations saved in your database.
            </p>

            <div className="panel table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll number</th>
                    <th>Email</th>
                    <th>Event</th>
                  </tr>
                </thead>

                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id}>
                      <td>{r.student_name}</td>
                      <td>{r.roll_number}</td>
                      <td>{r.email}</td>
                      <td>{r.event_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {registrations.length === 0 && (
                <p className="empty">No registrations yet.</p>
              )}
            </div>
          </section>
        )}
      </main>

      <footer>
        <strong>CampusConnect</strong>
        <span>Bringing your campus community together.</span>
      </footer>

      {selectedEvent && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedEvent(null)}
        >
          <section
            className="modal panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setSelectedEvent(null)}
            >
              ×
            </button>

            <p className="eyebrow">EVENT REGISTRATION</p>
            <h2>{selectedEvent.name}</h2>

            <p className="muted">
              {selectedEvent.event_date} · {selectedEvent.venue}
            </p>

            <form className="event-form" onSubmit={registerStudent}>
              <label>
                Student name *
                <input
                  required
                  maxLength="100"
                  value={student.name}
                  onChange={(e) =>
                    updateStudent("name", e.target.value)
                  }
                  placeholder="Enter your full name"
                />
              </label>

              <label>
                Roll number *
                <input
                  required
                  maxLength="30"
                  value={student.rollNumber}
                  onChange={(e) =>
                    updateStudent("rollNumber", e.target.value)
                  }
                  placeholder="Enter your roll number"
                />
              </label>

              <label>
                Email *
                <input
                  required
                  type="email"
                  maxLength="150"
                  value={student.email}
                  onChange={(e) =>
                    updateStudent("email", e.target.value)
                  }
                  placeholder="student@example.com"
                />
              </label>

              <button
                className="primary-button full"
                disabled={loading}
                type="submit"
              >
                {loading ? "Submitting..." : "Confirm Registration"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;

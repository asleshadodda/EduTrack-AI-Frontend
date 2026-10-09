
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:8080/api";

function App() {
  const [page, setPage] = useState("Dashboard");
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({});
  const [showForm, setShowForm] = useState(false);

  const loadData = async () => {
    setError("");

    try {
      const results = await Promise.all([
        axios.get(`${API}/students`),
        axios.get(`${API}/companies`),
        axios.get(`${API}/jobs`),
        axios.get(`${API}/applications`),
        axios.get(`${API}/placements`)
      ]);

      setStudents(results[0].data);
      setCompanies(results[1].data);
      setJobs(results[2].data);
      setApplications(results[3].data);
      setPlacements(results[4].data);
    } catch (err) {
      setError(
        "Unable to load data. Check that the Spring Boot backend is running on port 8080."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({});
    setShowForm(false);
  };

  const updateField = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const addRecord = async (event) => {
    event.preventDefault();

    try {
      if (page === "Students") {
        await axios.post(`${API}/students`, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          department: form.department,
          graduationYear: Number(form.graduationYear),
          cgpa: Number(form.cgpa)
        });
      } else if (page === "Companies") {
        await axios.post(`${API}/companies`, {
          name: form.name,
          industry: form.industry,
          location: form.location,
          website: form.website,
          contactEmail: form.contactEmail
        });
      } else if (page === "Jobs") {
        await axios.post(
          `${API}/jobs?companyId=${encodeURIComponent(form.companyId)}`,
          {
            title: form.title,
            description: form.description,
            eligibilityCriteria: form.eligibilityCriteria,
            salary: Number(form.salary),
            deadline: form.deadline,
            status: "ACTIVE"
          }
        );
      } else if (page === "Applications") {
        await axios.post(
          `${API}/applications?studentId=${encodeURIComponent(form.studentId)}&jobId=${encodeURIComponent(form.jobId)}`
        );
      } else if (page === "Placements") {
        const params = new URLSearchParams({
          applicationId: form.applicationId,
          packageAmount: form.packageAmount
        });

        if (form.placementDate) {
          params.append("placementDate", form.placementDate);
        }

        await axios.post(`${API}/placements?${params.toString()}`);
      }

      resetForm();
      await loadData();
      alert(`${page === "Placements" ? "Placement" : page.slice(0, -1)} saved successfully.`);
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Could not save the record. Check the fields and try again."
      );
    }
  };

  const updateApplicationStatus = async (id, status) => {
    try {
      await axios.put(
        `${API}/applications/${id}/status?status=${encodeURIComponent(status)}`
      );

      await loadData();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Could not update application."
      );
    }
  };

  const updatePlacementStatus = async (id, status) => {
    try {
      await axios.put(
        `${API}/placements/${id}/status?status=${encodeURIComponent(status)}`
      );

      await loadData();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Could not update placement offer status."
      );
    }
  };

  const deleteRecord = async (resource, id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    try {
      await axios.delete(`${API}/${resource}/${id}`);
      await loadData();
    } catch (err) {
      alert(
        "Could not delete this record. It may be linked to another record."
      );
    }
  };

  const navItems = [
    { name: "Dashboard", icon: "◫" },
    { name: "Students", icon: "♙" },
    { name: "Companies", icon: "▦" },
    { name: "Jobs", icon: "▤" },
    { name: "Applications", icon: "▣" },
    { name: "Placements", icon: "✧" }
  ];

  const openForm = () => {
    setForm({});
    setShowForm(true);
  };

  const fields = {
    Students: [
      ["fullName", "Full name", "text"],
      ["email", "Email address", "email"],
      ["phone", "Phone number", "text"],
      ["department", "Department", "text"],
      ["graduationYear", "Graduation year", "number"],
      ["cgpa", "CGPA", "number"]
    ],
    Companies: [
      ["name", "Company name", "text"],
      ["industry", "Industry", "text"],
      ["location", "Location", "text"],
      ["website", "Website", "url"],
      ["contactEmail", "Contact email", "email"]
    ],
    Jobs: [
      ["title", "Job title", "text"],
      ["description", "Job description", "text"],
      ["eligibilityCriteria", "Eligibility criteria", "text"],
      ["salary", "Annual package (as defined by your backend)", "number"],
      ["deadline", "Application deadline", "date"]
    ]
  };

  const titleCase = (text) =>
    text
      ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
      : "—";

  const renderTable = (headers, rows) => (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="empty">
                No records found. Add your first record to get started.
              </td>
            </tr>
          ) : (
            rows
          )}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    if (page === "Dashboard") {
      const stats = [
        {
          label: "Registered Students",
          value: students.length,
          icon: "♙",
          color: "blue"
        },
        {
          label: "Partner Companies",
          value: companies.length,
          icon: "▦",
          color: "purple"
        },
        {
          label: "Active Job Openings",
          value: jobs.filter((job) => job.status === "ACTIVE").length,
          icon: "▤",
          color: "orange"
        },
        {
          label: "Applications",
          value: applications.length,
          icon: "▣",
          color: "green"
        },
        {
          label: "Placement Records",
          value: placements.length,
          icon: "✧",
          color: "pink"
        },
        {
          label: "Selected Applications",
          value: applications.filter(
            (application) => application.status === "SELECTED"
          ).length,
          icon: "✓",
          color: "teal"
        }
      ];

      return (
        <>
          <div className="welcome">
            <div>
              <p className="eyebrow">OVERVIEW</p>
              <h2>Welcome to EduTrack AI</h2>
              <p>
                Manage student profiles, recruitment and placement activity
                in one place.
              </p>
            </div>
            <button className="primary-btn" onClick={loadData}>
              ↻ Refresh data
            </button>
          </div>

          <div className="stats-grid">
            {stats.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <div className={`stat-icon ${stat.color}`}>
                  {stat.icon}
                </div>
                <p>{stat.label}</p>
                <h3>{loading ? "…" : stat.value}</h3>
                <span>Live database count</span>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div>
                <h3>Recent Job Openings</h3>
                <p>Latest opportunities published by companies</p>
              </div>
              <button
                className="text-btn"
                onClick={() => setPage("Jobs")}
              >
                View all →
              </button>
            </div>

            {renderTable(
              ["Position", "Company", "Deadline", "Status"],
              jobs.slice(-5).reverse().map((job) => (
                <tr key={job.id}>
                  <td><strong>{job.title}</strong></td>
                  <td>{job.company?.name || "Company"}</td>
                  <td>{job.deadline || "—"}</td>
                  <td>
                    <span className="status">{job.status || "—"}</span>
                  </td>
                </tr>
              ))
            )}
          </div>
        </>
      );
    }

    if (page === "Students") {
      return (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Student Directory</h3>
              <p>Manage student and academic profiles</p>
            </div>
            <button className="primary-btn" onClick={openForm}>
              + Add student
            </button>
          </div>

          {showForm && (
            <form className="record-form" onSubmit={addRecord}>
              {fields.Students.map(([name, label, type]) => (
                <label key={name}>
                  {label}
                  <input
                    required
                    name={name}
                    type={type}
                    onChange={updateField}
                    step={name === "cgpa" ? "0.01" : undefined}
                  />
                </label>
              ))}
              <div className="form-actions">
                <button className="primary-btn">Save student</button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {renderTable(
            ["ID", "Student", "Email", "Department", "Year", "CGPA", "Action"],
            students.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td><strong>{student.fullName}</strong></td>
                <td>{student.email}</td>
                <td>{student.department}</td>
                <td>{student.graduationYear}</td>
                <td>{student.cgpa}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => deleteRecord("students", student.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </div>
      );
    }

    if (page === "Companies") {
      return (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Company Directory</h3>
              <p>Manage recruiting partners</p>
            </div>
            <button className="primary-btn" onClick={openForm}>
              + Add company
            </button>
          </div>

          {showForm && (
            <form className="record-form" onSubmit={addRecord}>
              {fields.Companies.map(([name, label, type]) => (
                <label key={name}>
                  {label}
                  <input
                    required
                    name={name}
                    type={type}
                    onChange={updateField}
                  />
                </label>
              ))}
              <div className="form-actions">
                <button className="primary-btn">Save company</button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {renderTable(
            ["ID", "Company", "Industry", "Location", "Contact", "Action"],
            companies.map((company) => (
              <tr key={company.id}>
                <td>{company.id}</td>
                <td><strong>{company.name}</strong></td>
                <td>{company.industry}</td>
                <td>{company.location}</td>
                <td>{company.contactEmail}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => deleteRecord("companies", company.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </div>
      );
    }

    if (page === "Jobs") {
      return (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Job Opportunities</h3>
              <p>Publish and monitor company vacancies</p>
            </div>
            <button className="primary-btn" onClick={openForm}>
              + Publish job
            </button>
          </div>

          {showForm && (
            <form className="record-form" onSubmit={addRecord}>
              <label>
                Company
                <select
                  required
                  name="companyId"
                  value={form.companyId || ""}
                  onChange={updateField}
                >
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>

              {fields.Jobs.map(([name, label, type]) => (
                <label key={name}>
                  {label}
                  <input
                    required
                    name={name}
                    type={type}
                    onChange={updateField}
                  />
                </label>
              ))}

              <div className="form-actions">
                <button className="primary-btn">Publish job</button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {renderTable(
            ["ID", "Position", "Company", "Salary", "Deadline", "Status", "Action"],
            jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td><strong>{job.title}</strong></td>
                <td>{job.company?.name || "—"}</td>
                <td>{job.salary ?? "—"}</td>
                <td>{job.deadline || "—"}</td>
                <td><span className="status">{job.status}</span></td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => deleteRecord("jobs", job.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </div>
      );
    }

    if (page === "Applications") {
      return (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Job Applications</h3>
              <p>Track applications and selection progress</p>
            </div>
            <button className="primary-btn" onClick={openForm}>
              + Apply for job
            </button>
          </div>

          {showForm && (
            <form className="record-form" onSubmit={addRecord}>
              <label>
                Student
                <select
                  required
                  name="studentId"
                  value={form.studentId || ""}
                  onChange={updateField}
                >
                  <option value="">Select student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} (ID {student.id})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Job
                <select
                  required
                  name="jobId"
                  value={form.jobId || ""}
                  onChange={updateField}
                >
                  <option value="">Select job</option>
                  {jobs
                    .filter((job) => job.status === "ACTIVE")
                    .map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} (ID {job.id})
                      </option>
                    ))}
                </select>
              </label>

              <div className="form-actions">
                <button className="primary-btn">Submit application</button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {renderTable(
            ["ID", "Student", "Job", "Applied date", "Status", "Update status"],
            applications.map((application) => (
              <tr key={application.id}>
                <td>{application.id}</td>
                <td>{application.student?.fullName || "—"}</td>
                <td>{application.job?.title || "—"}</td>
                <td>{application.appliedDate || "—"}</td>
                <td><span className="status">{application.status}</span></td>
                <td>
                  <select
                    value={application.status || "APPLIED"}
                    onChange={(event) =>
                      updateApplicationStatus(
                        application.id,
                        event.target.value
                      )
                    }
                  >
                    {["APPLIED", "SHORTLISTED", "SELECTED", "REJECTED"].map(
                      (status) => (
                        <option key={status} value={status}>
                          {titleCase(status)}
                        </option>
                      )
                    )}
                  </select>
                </td>
              </tr>
            ))
          )}
        </div>
      );
    }

    if (page === "Placements") {
      const placedApplicationIds = placements
        .map((placement) => placement.application?.id)
        .filter((id) => id !== undefined && id !== null)
        .map(String);

      const eligibleApplications = applications.filter(
        (application) =>
          application.status === "SELECTED" &&
          !placedApplicationIds.includes(String(application.id))
      );

      return (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Placement Records</h3>
              <p>Manage offers and placement outcomes</p>
            </div>
            <button className="primary-btn" onClick={openForm}>
              + Create placement
            </button>
          </div>

          {showForm && (
            <form className="record-form" onSubmit={addRecord}>
              <label>
                Selected application
                <select
                  required
                  name="applicationId"
                  value={form.applicationId || ""}
                  onChange={updateField}
                >
                  <option value="">Select a selected application</option>
                  {eligibleApplications.map((application) => (
                    <option
                      key={application.id}
                      value={application.id}
                    >
                      Application #{application.id} —{" "}
                      {application.student?.fullName || "Student"} —{" "}
                      {application.job?.title || "Job"}
                    </option>
                  ))}
                </select>
              </label>

              {eligibleApplications.length === 0 && (
                <p className="notice">
                  No eligible applications are available. Go to Applications
                  and change an application's status to SELECTED first.
                </p>
              )}

              <label>
                Package amount
                <input
                  required
                  type="number"
                  name="packageAmount"
                  min="0"
                  step="0.01"
                  value={form.packageAmount || ""}
                  onChange={updateField}
                  placeholder="Enter package amount"
                />
              </label>

              <label>
                Placement date (optional)
                <input
                  type="date"
                  name="placementDate"
                  value={form.placementDate || ""}
                  onChange={updateField}
                />
              </label>

              <div className="form-actions">
                <button
                  className="primary-btn"
                  disabled={eligibleApplications.length === 0}
                >
                  Save placement
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {renderTable(
            [
              "ID",
              "Application",
              "Student",
              "Job",
              "Offer status",
              "Package",
              "Placement date",
              "Update offer"
            ],
            placements.map((placement) => {
              const application = placement.application;
              const status = placement.offerStatus || "PENDING";

              return (
                <tr key={placement.id}>
                  <td>{placement.id}</td>
                  <td>{application?.id || "—"}</td>
                  <td>{application?.student?.fullName || "—"}</td>
                  <td>{application?.job?.title || "—"}</td>
                  <td><span className="status">{status}</span></td>
                  <td>{placement.packageAmount ?? "—"}</td>
                  <td>{placement.placementDate || "—"}</td>
                  <td>
                    <select
                      value={status}
                      onChange={(event) =>
                        updatePlacementStatus(
                          placement.id,
                          event.target.value
                        )
                      }
                    >
                      {["PENDING", "ACCEPTED", "DECLINED"].map(
                        (offerStatus) => (
                          <option key={offerStatus} value={offerStatus}>
                            {titleCase(offerStatus)}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                </tr>
              );
            })
          )}
        </div>
      );
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">E</div>
          <div>
            <h1>EduTrack <span>AI</span></h1>
            <p>PLACEMENT PORTAL</p>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${page === item.name ? "active" : ""}`}
              onClick={() => {
                setPage(item.name);
                resetForm();
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
              {item.name === "Applications" && (
                <span className="nav-count">{applications.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="connection-dot"></div>
          <div>
            <strong>System status</strong>
            <p>{error ? "Connection issue" : "Placement portal"}</p>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="breadcrumb">
              Workspace / <strong>{page}</strong>
            </p>
            <h2>{page}</h2>
          </div>

          <div className="admin-chip">
            <div className="avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <span>Placement Management</span>
            </div>
          </div>
        </header>

        <section className="content">
          {error && (
            <div className="error-banner">
              {error}
              <button onClick={loadData}>Retry</button>
            </div>
          )}

          {loading && (
            <div className="loading">Loading data from your database…</div>
          )}

          {!loading && renderContent()}

          <footer>EduTrack AI · Student Placement Management System</footer>
        </section>
      </main>
    </div>
  );
}

export default App;
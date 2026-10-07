import React, { useEffect, useRef, useState } from "react";
import {
  createEvent,
  createPolicy,
  getClaims,
  getEvents,
  getMe,
  getPolicies,
  getSummary,
  getWorkers,
  login,
} from "./api";

const navigation = [
  { id: "dashboard", label: "Dashboard" },
  { id: "events", label: "Disruption Events" },
  { id: "claims", label: "Claims" },
  { id: "policies", label: "Policies" },
];

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      localStorage.setItem("insurly_token", result.access_token);
      localStorage.setItem("insurly_user", JSON.stringify(result.user));
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-aside" aria-label="Insurly introduction">
        <div className="login-brand"><span className="brand-mark" aria-hidden="true">I</span> INSURLY</div>
        <div className="login-aside-copy">
          <p className="eyebrow">PARAMETRIC INSURANCE OPERATIONS</p>
          <h1>Income protection, made responsive.</h1>
          <p>Monitor disruptions, policies, and claims from one workspace.</p>
        </div>
        <p className="login-aside-foot">Insurly operations console</p>
      </section>

      <section className="login-main">
        <form className="login-card" onSubmit={submit} aria-labelledby="login-title">
          <div className="login-heading">
            <p className="eyebrow">WELCOME BACK</p>
            <h2 id="login-title">Sign in to Insurly</h2>
            <p className="muted">Enter your account credentials to continue.</p>
          </div>

          <div className="form-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          <button className="button button-primary login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>

        </form>
      </section>
    </main>
  );
}

function StatCard({ label, value, index }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <span className={`stat-mark stat-mark-${index}`} aria-hidden="true" />
      </div>
      <strong className="stat-value">{value}</strong>
    </article>
  );
}

function StatusBadge({ children, variant = "neutral" }) {
  return <span className={`status-badge status-${variant}`}>{children}</span>;
}

function EventBadge({ value }) {
  const labels = {
    heavy_rain: "Heavy Rain",
    extreme_heat: "Extreme Heat",
    flood: "Flood",
  };
  const variants = {
    heavy_rain: "blue",
    extreme_heat: "orange",
    flood: "purple",
  };
  return <StatusBadge variant={variants[value] || "neutral"}>{labels[value] || formatLabel(value)}</StatusBadge>;
}

function Table({ title, columns, rows, emptyMessage }) {
  if (!rows.length) {
    return (
      <div className="empty-state">
        <span className="empty-state-mark" aria-hidden="true" />
        <strong>No records to display</strong>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-wrap" role="region" aria-label={`${title} table`} tabIndex="0">
      <table>
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? row.policy_number ?? index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventRecordForm({ eventForm, setEventForm, onSubmit, isSubmitting, error, success }) {
  const update = (field, value) => setEventForm((current) => ({ ...current, [field]: value }));
  return (
    <section className="panel event-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ADMIN TOOL</p>
          <h2>Record a disruption</h2>
          <p className="section-description">Submit a reading to run it through the existing policy rules and automatic claim process.</p>
        </div>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}
      <form className="event-form" onSubmit={onSubmit}>
        <div className="form-field">
          <label htmlFor="event-type">Event type</label>
          <select id="event-type" value={eventForm.event_type} onChange={(e) => update("event_type", e.target.value)} required>
            <option value="heavy_rain">Heavy Rain</option>
            <option value="extreme_heat">Extreme Heat</option>
            <option value="flood">Flood</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="event-city">City</label>
          <input id="event-city" value={eventForm.city} onChange={(e) => update("city", e.target.value)} maxLength="100" required />
        </div>
        <div className="form-field form-field-wide">
          <label htmlFor="event-zones">Affected zones</label>
          <input id="event-zones" value={eventForm.affected_zones} onChange={(e) => update("affected_zones", e.target.value)} aria-describedby="zones-hint" required />
          <span className="field-hint" id="zones-hint">Separate multiple zones with commas.</span>
        </div>
        <div className="form-field">
          <label htmlFor="event-reading">Reading</label>
          <input id="event-reading" type="number" step="any" min="0" value={eventForm.reading} onChange={(e) => update("reading", e.target.value)} required />
        </div>
        <div className="form-field">
          <label htmlFor="event-unit">Unit</label>
          <input id="event-unit" value={eventForm.unit} onChange={(e) => update("unit", e.target.value)} maxLength="30" required />
        </div>
        <div className="form-field">
          <label htmlFor="event-severity">Severity</label>
          <select id="event-severity" value={eventForm.severity} onChange={(e) => update("severity", e.target.value)} required>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="event-source">Source</label>
          <input id="event-source" value={eventForm.source} onChange={(e) => update("source", e.target.value)} maxLength="100" required />
        </div>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing event…" : "Record disruption"}
          </button>
          <p className="hint">A qualifying event may automatically create a claim and simulated payout under existing rules.</p>
        </div>
      </form>
    </section>
  );
}

function ClaimDetails({ claim, onClose }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();
    const handleDialogKeys = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDialogKeys);
    return () => {
      window.removeEventListener("keydown", handleDialogKeys);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose]);

  return (
    <div className="details-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="details-dialog" role="dialog" aria-modal="true" aria-labelledby="claim-details-title">
        <div className="details-heading">
          <div><p className="eyebrow">CLAIM DETAILS</p><h2 id="claim-details-title">Claim #{claim.id}</h2></div>
          <button ref={closeButtonRef} className="icon-button" type="button" aria-label="Close claim details" onClick={onClose}>×</button>
        </div>
        <div className="details-grid">
          <section className="detail-card">
            <h3>Claim</h3>
            <dl className="detail-list">
              <div><dt>Worker</dt><dd>{claim.worker_name} <span className="muted-inline">(ID {claim.worker_id})</span></dd></div>
              <div><dt>Policy</dt><dd>{claim.policy_number}</dd></div>
              <div><dt>Event</dt><dd><EventBadge value={claim.event_type} /></dd></div>
              <div><dt>Status</dt><dd><StatusBadge variant={statusVariant(claim.status)}>{formatLabel(claim.status)}</StatusBadge></dd></div>
              <div><dt>Created</dt><dd>{formatDateTime(claim.created_at)}</dd></div>
              <div><dt>Automatic processing</dt><dd>{claim.auto_processed ? "Yes" : "No"}</dd></div>
            </dl>
          </section>
          <section className="detail-card">
            <h3>Rule-based risk score</h3>
            <p className="detail-score">{claim.fraud_score}<span> / 100</span></p>
            <p className="detail-explanation">{claim.fraud_reason || "No reason was provided."}</p>
          </section>
          <section className="detail-card detail-card-wide">
            <h3>Simulated payout</h3>
            {claim.payout ? (
              <dl className="detail-list payout-list">
                <div><dt>Amount</dt><dd>{formatCurrency(claim.payout.amount)}</dd></div>
                <div><dt>Status</dt><dd><StatusBadge variant={statusVariant(claim.payout.status)}>{formatLabel(claim.payout.status)}</StatusBadge></dd></div>
                <div><dt>Transaction reference</dt><dd>{claim.payout.transaction_reference}</dd></div>
                <div><dt>Processed</dt><dd>{formatDateTime(claim.payout.processed_at)}</dd></div>
              </dl>
            ) : <p className="detail-explanation">No payout details were returned for this claim.</p>}
          </section>
        </div>
      </section>
    </div>
  );
}

function AnalyticsBarChart({ title, description, data, valueLabel = "records", formatter = (value) => Number(value).toLocaleString("en-IN"), loading, error, emptyMessage }) {
  const maxValue = data.reduce((largest, item) => Math.max(largest, Number(item.value) || 0), 0);
  return (
    <section className="panel analytics-panel" aria-label={title} aria-busy={loading}>
      <div className="section-heading">
        <div><p className="eyebrow">INSIGHTS</p><h2>{title}</h2><p className="section-description">{description}</p></div>
      </div>
      {loading ? <div className="loading-state" role="status">Loading analytics…</div>
        : error ? <div className="alert alert-danger" role="alert">Analytics unavailable: {error}</div>
          : data.length === 0 ? <div className="empty-state analytics-empty"><strong>Not enough data yet</strong><p>{emptyMessage}</p></div>
            : <div className="analytics-bars" role="list" aria-label={`${title} chart`}>
              {data.map((item) => {
                const value = Number(item.value) || 0;
                const text = formatter(value);
                return (
                  <div className="analytics-bar-row" role="listitem" key={item.label}>
                    {(() => {
                      const unit = valueLabel && value === 1 ? valueLabel.replace(/s$/, "") : valueLabel;
                      const label = `${text}${unit ? ` ${unit}` : ""}`;
                      return <><div className="analytics-bar-labels"><span>{item.label}</span><strong>{label}</strong></div><progress className="analytics-progress" value={Math.max(0, value)} max={Math.max(1, maxValue)} aria-label={`${item.label}: ${label}`} title={`${item.label}: ${label}`} /></>;
                    })()}
                  </div>
                );
              })}
            </div>}
    </section>
  );
}

function PayoutSummary({ payouts, loading, error }) {
  const amounts = payouts.map((payout) => Number(payout.amount)).filter(Number.isFinite);
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  const average = amounts.length ? total / amounts.length : 0;
  const largest = amounts.length ? Math.max(...amounts) : 0;
  return (
    <section className="panel analytics-panel payout-summary" aria-label="Simulated payout summary" aria-busy={loading}>
      <div className="section-heading">
        <div><p className="eyebrow">PAYOUTS</p><h2>Simulated payout summary</h2><p className="section-description">Processed payout records only; these are simulated, not bank disbursements.</p></div>
      </div>
      {loading ? <div className="loading-state" role="status">Loading payout records…</div>
        : error ? <div className="alert alert-danger" role="alert">Payout summary unavailable: {error}</div>
          : amounts.length === 0 ? <div className="empty-state analytics-empty"><strong>No processed payout records yet</strong><p>Values appear here when the claims API returns processed payout records.</p></div>
            : <div className="payout-metrics">
              <article><span>Total processed</span><strong>{formatCurrency(total)}</strong><small>{amounts.length} payout {amounts.length === 1 ? "record" : "records"}</small></article>
              <article><span>Processed payouts</span><strong>{amounts.length.toLocaleString("en-IN")}</strong><small>Linked to claims</small></article>
              <article><span>Average payout</span><strong>{formatCurrency(average)}</strong><small>Per processed record</small></article>
              <article><span>Largest payout</span><strong>{formatCurrency(largest)}</strong><small>Single processed record</small></article>
            </div>}
    </section>
  );
}

function RecentActivity({ items, loading, error }) {
  return (
    <section className="panel recent-activity-panel" aria-label="Recent activity" aria-busy={loading}>
      <div className="section-heading">
        <div><p className="eyebrow">OPERATIONS</p><h2>Recent activity</h2><p className="section-description">Recent records and their stored timestamps. This is not an actor audit log.</p></div>
      </div>
      {loading ? <div className="loading-state" role="status">Loading recent records…</div>
        : error ? <div className="alert alert-danger" role="alert">Recent activity unavailable: {error}</div>
          : items.length === 0 ? <div className="empty-state analytics-empty"><strong>No dated records yet</strong><p>Events, claims, payouts, and policy coverage dates will appear here when available.</p></div>
            : <ol className="activity-list">
              {items.map((item) => (
                <li className="activity-item" key={item.id}>
                  <span className={`activity-marker activity-marker-${item.kind}`} aria-hidden="true" />
                  <div className="activity-copy"><strong>{item.title}</strong><span>{item.description}</span></div>
                  <time dateTime={item.timestamp}>{item.kind === "policy" ? formatDate(item.timestamp) : formatDateTime(item.timestamp)}</time>
                </li>
              ))}
            </ol>}
    </section>
  );
}

function countBy(items, getKey) {
  const counts = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([key, value]) => ({ label: formatLabel(key), value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function validTimestamp(value) {
  return Boolean(value) && !Number.isNaN(new Date(value).getTime());
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("insurly_user"));
    } catch {
      return null;
    }
  });
  const [tab, setTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sidebarRef = useRef(null);
  const sidebarToggleRef = useRef(null);
  const mobileNavTriggerRef = useRef(null);
  const restoreMobileNavFocus = useRef(false);
  const [summary, setSummary] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [events, setEvents] = useState([]);
  const [claims, setClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [error, setError] = useState("");
  const [eventError, setEventError] = useState("");
  const [eventResult, setEventResult] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isSubmittingPolicy, setIsSubmittingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [policySuccess, setPolicySuccess] = useState("");
  const [policyForm, setPolicyForm] = useState({
    worker_id: "",
    event_type: "heavy_rain",
    trigger_threshold: "",
    threshold_unit: "mm/hr",
    payout_amount: "",
    status: "active",
  });
  const [claimSearch, setClaimSearch] = useState("");
  const [claimStatusFilter, setClaimStatusFilter] = useState("all");
  const [claimRiskFilter, setClaimRiskFilter] = useState("all");
  const [claimEventFilter, setClaimEventFilter] = useState("all");
  const [claimSort, setClaimSort] = useState("newest");
  const [claimPage, setClaimPage] = useState(1);
  const [eventSearch, setEventSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [eventSeverityFilter, setEventSeverityFilter] = useState("all");
  const [policySearch, setPolicySearch] = useState("");
  const [policyStatusFilter, setPolicyStatusFilter] = useState("all");
  const [eventForm, setEventForm] = useState({
    event_type: "heavy_rain",
    city: "Bhubaneswar",
    affected_zones: "Patia, Nayapalli, Saheed Nagar",
    reading: 25,
    unit: "mm/hr",
    severity: "high",
    source: "Manual Admin",
  });

  async function loadData() {
    setIsLoadingData(true);
    try {
      setError("");
      const [s, w, p, e, c] = await Promise.all([
        getSummary(),
        getWorkers(),
        getPolicies(),
        getEvents(),
        getClaims(),
      ]);
      setSummary(s);
      setWorkers(w);
      setPolicies(p);
      setEvents(e);
      setClaims(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingData(false);
    }
  }

  function logout() {
    localStorage.removeItem("insurly_token");
    localStorage.removeItem("insurly_user");
    setUser(null);
    setMobileNavOpen(false);
  }

  function closeMobileNav() {
    restoreMobileNavFocus.current = true;
    setMobileNavOpen(false);
  }

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    sidebarToggleRef.current?.focus();
    const handleDrawerKeys = (event) => {
      if (event.key === "Escape") {
        closeMobileNav();
        return;
      }
      if (event.key !== "Tab" || !sidebarRef.current) return;
      const focusable = [...sidebarRef.current.querySelectorAll('a[href], button:not(:disabled)')]
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDrawerKeys);
    return () => window.removeEventListener("keydown", handleDrawerKeys);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (mobileNavOpen || !restoreMobileNavFocus.current) return;
    restoreMobileNavFocus.current = false;
    mobileNavTriggerRef.current?.focus();
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!user) return;
    getMe().catch(() => logout());
    if (user.role === "admin") loadData();
  }, [user]);

  async function triggerEvent(e) {
    e.preventDefault();
    setEventError("");
    setEventResult(null);
    const zones = eventForm.affected_zones.split(",").map((zone) => zone.trim()).filter(Boolean);
    if (!eventForm.city.trim() || !eventForm.unit.trim() || !eventForm.source.trim() || zones.length === 0) {
      setEventError("Enter a city, at least one affected zone, a unit, and a source.");
      return;
    }
    setIsSubmittingEvent(true);
    try {
      const payload = {
        ...eventForm,
        city: eventForm.city.trim(),
        unit: eventForm.unit.trim(),
        source: eventForm.source.trim(),
        reading: Number(eventForm.reading),
        affected_zones: zones,
      };
      const createdEvent = await createEvent(payload);
      setEventResult(createdEvent);
      await loadData();
      setShowEventForm(false);
      setTab("events");
    } catch (err) {
      setEventError(err.message);
    } finally {
      setIsSubmittingEvent(false);
    }
  }

  async function submitPolicy(e) {
    e.preventDefault();
    setPolicyError("");
    setPolicySuccess("");
    setIsSubmittingPolicy(true);
    try {
      const payload = {
        ...policyForm,
        worker_id: Number(policyForm.worker_id),
        trigger_threshold: Number(policyForm.trigger_threshold),
        payout_amount: Number(policyForm.payout_amount),
      };
      const created = await createPolicy(payload);
      setPolicySuccess(`Policy ${created.policy_number} was created successfully.`);
      setPolicyForm((current) => ({ ...current, worker_id: "", trigger_threshold: "", payout_amount: "" }));
      try {
        setPolicies(await getPolicies());
      } catch (refreshError) {
        setPolicyError(`Policy created, but the list could not be refreshed: ${refreshError.message}`);
      }
    } catch (err) {
      setPolicyError(err.message);
    } finally {
      setIsSubmittingPolicy(false);
    }
  }

  if (!user) return <Login onLogin={setUser} />;

  const claimQuery = claimSearch.trim().toLowerCase();
  const filteredClaims = claims.filter((claim) => {
    const payoutRef = claim.payout?.transaction_reference || "";
    const matchesSearch = !claimQuery || [
      claim.id, claim.worker_id, claim.worker_name, claim.policy_number,
      claim.event_type, claim.status, claim.fraud_score, claim.fraud_reason,
      claim.payout_amount, payoutRef,
    ].some((value) => String(value ?? "").toLowerCase().includes(claimQuery));
    const score = Number(claim.fraud_score);
    const matchesRisk = claimRiskFilter === "all"
      || (claimRiskFilter === "low" && score < 30)
      || (claimRiskFilter === "moderate" && score >= 30 && score < 70)
      || (claimRiskFilter === "high" && score >= 70);
    return matchesSearch
      && (claimStatusFilter === "all" || claim.status === claimStatusFilter)
      && matchesRisk
      && (claimEventFilter === "all" || claim.event_type === claimEventFilter);
  }).sort((a, b) => {
    if (claimSort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
    if (claimSort === "risk-high") return Number(b.fraud_score) - Number(a.fraud_score);
    if (claimSort === "payout-high") return Number(b.payout_amount) - Number(a.payout_amount);
    return new Date(b.created_at) - new Date(a.created_at);
  });
  const claimPageSize = 8;
  const claimPageCount = Math.max(1, Math.ceil(filteredClaims.length / claimPageSize));
  const currentClaimPage = Math.min(claimPage, claimPageCount);
  const displayedClaims = filteredClaims.slice((currentClaimPage - 1) * claimPageSize, currentClaimPage * claimPageSize);
  const claimStatuses = [...new Set(claims.map((claim) => claim.status).filter(Boolean))];
  const claimEventTypes = [...new Set(claims.map((claim) => claim.event_type).filter(Boolean))];
  const filteredEvents = events.filter((event) => {
    const matchesSearch = !eventSearch.trim() || [event.event_type, event.city, event.affected_zones, event.source]
      .some((value) => String(value ?? "").toLowerCase().includes(eventSearch.trim().toLowerCase()));
    return matchesSearch
      && (eventTypeFilter === "all" || event.event_type === eventTypeFilter)
      && (eventSeverityFilter === "all" || event.severity === eventSeverityFilter);
  });
  const filteredPolicies = policies.filter((policy) => {
    const worker = workers.find((item) => item.id === policy.worker_id);
    const matchesSearch = !policySearch.trim() || [
      policy.policy_number, policy.worker_id, worker?.name, worker?.email,
      policy.event_type, policy.trigger_threshold, policy.threshold_unit,
    ].some((value) => String(value ?? "").toLowerCase().includes(policySearch.trim().toLowerCase()));
    return matchesSearch && (policyStatusFilter === "all" || policy.status === policyStatusFilter);
  });

  const pageTitle = navigation.find((item) => item.id === tab)?.label || "Dashboard";
  const stats = summary && [
    { label: "Workers", value: summary.workers },
    { label: "Active Policies", value: summary.active_policies },
    { label: "Disruption Events", value: summary.events },
    { label: "Claims", value: summary.claims },
    { label: "Total Payout", value: formatCurrency(summary.total_payout) },
  ];

  const processedPayouts = claims
    .map((claim) => claim.payout)
    .filter((payout) => payout && payout.amount !== null && payout.amount !== undefined && payout.amount !== "" && String(payout.status).toLowerCase() === "processed" && Number.isFinite(Number(payout.amount)));
  const claimsByEventType = countBy(claims, (claim) => claim.event_type);
  const eventsByType = countBy(events, (event) => event.event_type);
  const eventsBySeverity = countBy(events, (event) => event.severity);
  const scoredClaims = claims.filter((claim) => claim.fraud_score !== null && claim.fraud_score !== undefined && claim.fraud_score !== "" && Number.isFinite(Number(claim.fraud_score)));
  const claimsByRiskBucket = [
    { label: "Low risk (0–29)", value: scoredClaims.filter((claim) => Number(claim.fraud_score) < 30).length },
    { label: "Moderate risk (30–69)", value: scoredClaims.filter((claim) => Number(claim.fraud_score) >= 30 && Number(claim.fraud_score) < 70).length },
    { label: "High risk (70–100)", value: scoredClaims.filter((claim) => Number(claim.fraud_score) >= 70).length },
  ].filter((item) => item.value > 0);
  const zoneCounts = new Map();
  events.forEach((event) => {
    const zones = [...new Set(String(event.affected_zones || "").split(",").map((zone) => zone.trim()).filter(Boolean))];
    zones.forEach((zone) => zoneCounts.set(zone, (zoneCounts.get(zone) || 0) + 1));
  });
  const eventsByZone = [...zoneCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 8);
  const recentActivity = [
    ...events.filter((event) => validTimestamp(event.created_at)).map((event) => ({
      id: `event-${event.id}`, kind: "event", timestamp: event.created_at,
      title: `Disruption event #${event.id} recorded`,
      description: `${formatLabel(event.event_type)} · ${event.city} · ${event.source}`,
    })),
    ...claims.filter((claim) => validTimestamp(claim.created_at)).map((claim) => ({
      id: `claim-${claim.id}`, kind: "claim", timestamp: claim.created_at,
      title: `Claim #${claim.id} created`,
      description: `${claim.worker_name} · ${formatLabel(claim.event_type)} · ${formatLabel(claim.status)}`,
    })),
    ...processedPayouts.filter((payout) => validTimestamp(payout.processed_at)).map((payout) => ({
      id: `payout-${payout.transaction_reference || payout.processed_at}`,
      kind: "payout", timestamp: payout.processed_at,
      title: "Simulated payout processed",
      description: `${formatCurrency(payout.amount)}${payout.transaction_reference ? ` · ${payout.transaction_reference}` : ""}`,
    })),
    ...policies.filter((policy) => validTimestamp(policy.start_date)).map((policy) => ({
      id: `policy-${policy.id}`, kind: "policy", timestamp: policy.start_date,
      title: `Policy ${policy.policy_number} coverage started`,
      description: `Worker ${policy.worker_id} · ${formatLabel(policy.event_type)} coverage`,
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);

  const eventColumns = [
    { key: "id", label: "Event ID", render: (row) => <strong className="cell-primary">#{row.id}</strong> },
    { key: "event_type", label: "Event", render: (row) => <EventBadge value={row.event_type} /> },
    { key: "city", label: "City" },
    { key: "affected_zones", label: "Affected zones" },
    { key: "reading", label: "Reading", render: (row) => `${row.reading} ${row.unit}` },
    { key: "severity", label: "Severity", render: (row) => <StatusBadge variant={severityVariant(row.severity)}>{formatLabel(row.severity)}</StatusBadge> },
    { key: "source", label: "Source" },
    { key: "created_at", label: "Created", render: (row) => formatDateTime(row.created_at) },
  ];
  const claimColumns = [
    { key: "id", label: "Claim ID", render: (row) => <strong className="cell-primary">#{row.id}</strong> },
    { key: "worker_name", label: "Worker", render: (row) => <strong className="cell-primary">{row.worker_name}</strong> },
    { key: "policy_number", label: "Policy" },
    { key: "event_type", label: "Event", render: (row) => <EventBadge value={row.event_type} /> },
    { key: "status", label: "Status", render: (row) => <StatusBadge variant={statusVariant(row.status)}>{formatLabel(row.status)}</StatusBadge> },
    { key: "fraud_score", label: "Rule-based risk", render: (row) => <StatusBadge variant="blue">{row.fraud_score}/100</StatusBadge> },
    { key: "payout_amount", label: "Simulated payout", render: (row) => formatCurrency(row.payout_amount) },
    { key: "auto_processed", label: "Automated", render: (row) => <StatusBadge variant={row.auto_processed ? "success" : "neutral"}>{row.auto_processed ? "Yes" : "No"}</StatusBadge> },
    { key: "created_at", label: "Created", render: (row) => formatDateTime(row.created_at) },
    { key: "details", label: "Details", render: (row) => <button className="text-button" type="button" onClick={() => setSelectedClaim(row)} aria-label={`View details for claim ${row.id}`}>View details</button> },
  ];
  const policyColumns = [
    { key: "id", label: "ID", render: (row) => `#${row.id}` },
    { key: "policy_number", label: "Policy", render: (row) => <strong className="cell-primary">{row.policy_number}</strong> },
    { key: "worker_id", label: "Worker", render: (row) => {
      const worker = workers.find((item) => item.id === row.worker_id);
      return worker ? <span><strong className="cell-primary">{worker.name}</strong><small className="cell-secondary">ID {row.worker_id} · {worker.zone}</small></span> : `Worker ${row.worker_id}`;
    } },
    { key: "event_type", label: "Covered event", render: (row) => <EventBadge value={row.event_type} /> },
    { key: "trigger_threshold", label: "Trigger", render: (row) => `${row.trigger_threshold} ${row.threshold_unit}` },
    { key: "payout_amount", label: "Payout", render: (row) => formatCurrency(row.payout_amount) },
    { key: "status", label: "Status", render: (row) => <StatusBadge variant={statusVariant(row.status)}>{formatLabel(row.status)}</StatusBadge> },
    { key: "start_date", label: "Starts", render: (row) => formatDate(row.start_date) },
    { key: "end_date", label: "Ends", render: (row) => row.end_date ? formatDate(row.end_date) : "No end date" },
  ];
  const workerColumns = [
    { key: "name", label: "Name", render: (row) => <strong className="cell-primary">{row.name}</strong> },
    { key: "email", label: "Email" },
    { key: "zone", label: "Zone" },
  ];

  return (
    <div className={`app-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}${mobileNavOpen ? " mobile-nav-open" : ""}`}>
      <aside
        className="sidebar"
        ref={sidebarRef}
        role={mobileNavOpen ? "dialog" : undefined}
        aria-modal={mobileNavOpen ? "true" : undefined}
        aria-label={mobileNavOpen ? "Primary navigation" : undefined}
      >
        <div className="sidebar-brand-row">
          <a className="brand" href="#dashboard" onClick={(e) => { e.preventDefault(); setTab("dashboard"); if (window.matchMedia("(max-width: 760px)").matches) closeMobileNav(); }} aria-label="Insurly dashboard">
            <span className="brand-mark" aria-hidden="true">I</span>
            <span className="brand-name">INSURLY</span>
          </a>
          <button
            className="sidebar-toggle"
            ref={sidebarToggleRef}
            type="button"
            onClick={() => {
              if (window.matchMedia("(max-width: 760px)").matches) closeMobileNav();
              else setSidebarCollapsed((value) => !value);
            }}
            aria-label={mobileNavOpen ? "Close navigation" : sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={mobileNavOpen || sidebarCollapsed}
            title={mobileNavOpen ? "Close navigation" : sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span aria-hidden="true">{mobileNavOpen ? "×" : sidebarCollapsed ? "›" : "‹"}</span>
          </button>
        </div>
        <div className="side-subtitle">PARAMETRIC INSURANCE</div>

        <nav id="primary-navigation" className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item, index) => (
            <button
              key={item.id}
              className={`nav-item${tab === item.id ? " active" : ""}`}
              type="button"
              onClick={() => { setTab(item.id); if (window.matchMedia("(max-width: 760px)").matches) closeMobileNav(); }}
              aria-current={tab === item.id ? "page" : undefined}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className={`nav-glyph nav-glyph-${index + 1}`} aria-hidden="true" />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <span className="user-avatar" aria-hidden="true">{initials(user.name)}</span>
            <span className="user-details">
              <strong>{user.name}</strong>
              <span>{formatLabel(user.role)}</span>
            </span>
          </div>
          <button className="logout-button" type="button" onClick={logout} title={sidebarCollapsed ? "Log out" : undefined}>
            <span className="logout-glyph" aria-hidden="true">↗</span>
            <span className="nav-label">Log out</span>
          </button>
        </div>
      </aside>
      {mobileNavOpen && <button className="sidebar-backdrop" type="button" onClick={closeMobileNav} aria-label="Close navigation" />}

      <main className="main-content">
        <header className="page-header">
          <div className="page-header-left">
            <button ref={mobileNavTriggerRef} className="mobile-nav-toggle" type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation" aria-expanded={mobileNavOpen} aria-controls="primary-navigation">
              <span /><span /><span />
            </button>
            <div>
              <p className="eyebrow">INSURLY OPERATIONS</p>
              <h1>{pageTitle}</h1>
              <p className="page-description">Monitor your parametric insurance workflow and activity.</p>
            </div>
          </div>
          <div className="header-user">
            <span className="header-avatar" aria-hidden="true">{initials(user.name)}</span>
            <span className="header-user-copy"><strong>{user.name}</strong><span>{formatLabel(user.role)}</span></span>
          </div>
        </header>

        {error && <div className="alert alert-danger global-alert" role="alert">{error}</div>}

        {tab === "dashboard" && (
          <div className="page-content">
            {summary ? (
              <section className="stats-grid" aria-label="Dashboard summary">
                {stats.map((stat, index) => <StatCard key={stat.label} label={stat.label} value={stat.value} index={index + 1} />)}
              </section>
            ) : isLoadingData ? (
              <div className="loading-state" role="status">Loading dashboard data…</div>
            ) : null}

            <div className="dashboard-analytics" aria-label="Dashboard analytics">
              <div className="analytics-grid">
                <AnalyticsBarChart
                  title="Claims by event type"
                  description="Claims returned by the existing claims API, grouped by covered event type."
                  data={claimsByEventType}
                  loading={isLoadingData}
                  error={error}
                  emptyMessage="No claims are available to group by event type."
                />
                <PayoutSummary payouts={processedPayouts} loading={isLoadingData} error={error} />
              </div>
              <div className="analytics-grid">
                <AnalyticsBarChart
                  title="Claims by rule-based risk score"
                  description="Observed claims grouped into the same presentation bands used by the claims filters."
                  data={claimsByRiskBucket}
                  valueLabel="claims"
                  loading={isLoadingData}
                  error={error}
                  emptyMessage="No claims with a numeric risk score are available."
                />
                <AnalyticsBarChart
                  title="Events by type"
                  description="Recorded disruption events grouped by their stored event type."
                  data={eventsByType}
                  valueLabel="events"
                  loading={isLoadingData}
                  error={error}
                  emptyMessage="No disruption events are available."
                />
              </div>
              <div className="analytics-grid">
                <AnalyticsBarChart
                  title="Events by severity"
                  description="Recorded events grouped by their stored severity."
                  data={eventsBySeverity}
                  valueLabel="events"
                  loading={isLoadingData}
                  error={error}
                  emptyMessage="No disruption events with severity values are available."
                />
                <AnalyticsBarChart
                  title="Affected zone mentions"
                  description="Number of recorded events mentioning each zone; a zone is counted once per event."
                  data={eventsByZone}
                  valueLabel="event mentions"
                  loading={isLoadingData}
                  error={error}
                  emptyMessage="No affected zones are available in the event records."
                />
              </div>
              <RecentActivity items={recentActivity} loading={isLoadingData} error={error} />
            </div>

            <section className="panel workflow-panel">
              <div className="section-heading">
                <div><p className="eyebrow">CLAIM LIFECYCLE</p><h2>How automatic claims work</h2></div>
                <span className="section-kicker">5 steps</span>
              </div>
              <ol className="workflow-steps">
                {[
                  "Disruption event",
                  "Zone matching",
                  "Threshold check",
                  "Claim created",
                  "Payout processed",
                ].map((step, index) => (
                  <li key={step} className="workflow-step">
                    <span className="workflow-number">0{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <EventRecordForm eventForm={eventForm} setEventForm={setEventForm} onSubmit={triggerEvent} isSubmitting={isSubmittingEvent} error={eventError} />
          </div>
        )}

        {tab === "events" && (
          <div className="page-content">
            <section className="panel data-panel">
              <div className="section-heading">
                <div><p className="eyebrow">ACTIVITY</p><h2>Disruption events</h2><p className="section-description">Recorded weather and disruption readings.</p></div>
                <button className="button button-primary" type="button" onClick={() => { setShowEventForm((value) => !value); setEventError(""); }} aria-expanded={showEventForm}>
                  {showEventForm ? "Close form" : "Record disruption"}
                </button>
              </div>
              <div className="table-toolbar">
                <div className="form-field toolbar-search"><label htmlFor="event-search">Search events</label><input id="event-search" type="search" placeholder="Type, city, zone, or source" value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} /></div>
                <div className="form-field"><label htmlFor="event-type-filter">Event type</label><select id="event-type-filter" value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)}><option value="all">All types</option>{[...new Set(events.map((item) => item.event_type))].filter(Boolean).map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
                <div className="form-field"><label htmlFor="event-severity-filter">Severity</label><select id="event-severity-filter" value={eventSeverityFilter} onChange={(e) => setEventSeverityFilter(e.target.value)}><option value="all">All severities</option>{[...new Set(events.map((item) => item.severity))].filter(Boolean).map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
                <span className="toolbar-count">{filteredEvents.length} of {events.length} records</span>
              </div>
              {eventResult && (
                <div className="event-result" role="status">
                  <div><strong>Event #{eventResult.id} recorded</strong><span>{formatLabel(eventResult.event_type)} · {eventResult.city} · {eventResult.reading} {eventResult.unit}</span></div>
                  <p>The API response confirms the event. It does not include claim or payout outcomes; review Claims for records created by the existing processing rules.</p>
                </div>
              )}
              {isLoadingData ? <div className="loading-state" role="status">Loading events…</div> : <Table title="Disruption events" columns={eventColumns} rows={filteredEvents} emptyMessage={events.length ? "No events match the current search or filters." : "Disruption events will appear here after they are recorded."} />}
            </section>
            {showEventForm && <EventRecordForm eventForm={eventForm} setEventForm={setEventForm} onSubmit={triggerEvent} isSubmitting={isSubmittingEvent} error={eventError} />}
          </div>
        )}

        {tab === "claims" && (
          <section className="panel data-panel">
            <div className="section-heading">
              <div><p className="eyebrow">CLAIMS MANAGEMENT</p><h2>Claims and payouts</h2><p className="section-description">Claims created from qualifying disruption events.</p></div>
              <span className="section-kicker">{filteredClaims.length} of {claims.length} records</span>
            </div>
            <div className="table-toolbar claims-toolbar">
              <div className="form-field toolbar-search"><label htmlFor="claim-search">Search claims</label><input id="claim-search" type="search" placeholder="Claim, worker, policy, payout reference…" value={claimSearch} onChange={(e) => { setClaimSearch(e.target.value); setClaimPage(1); }} /></div>
              <div className="form-field"><label htmlFor="claim-status-filter">Status</label><select id="claim-status-filter" value={claimStatusFilter} onChange={(e) => { setClaimStatusFilter(e.target.value); setClaimPage(1); }}><option value="all">All statuses</option>{claimStatuses.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
              <div className="form-field"><label htmlFor="claim-risk-filter">Risk score</label><select id="claim-risk-filter" value={claimRiskFilter} onChange={(e) => { setClaimRiskFilter(e.target.value); setClaimPage(1); }}><option value="all">All scores</option><option value="low">Low · 0–29</option><option value="moderate">Moderate · 30–69</option><option value="high">High · 70–100</option></select></div>
              <div className="form-field"><label htmlFor="claim-event-filter">Event type</label><select id="claim-event-filter" value={claimEventFilter} onChange={(e) => { setClaimEventFilter(e.target.value); setClaimPage(1); }}><option value="all">All events</option>{claimEventTypes.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
              <div className="form-field"><label htmlFor="claim-sort">Sort by</label><select id="claim-sort" value={claimSort} onChange={(e) => setClaimSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="risk-high">Highest risk score</option><option value="payout-high">Highest payout</option></select></div>
            </div>
            {isLoadingData ? <div className="loading-state" role="status">Loading claims…</div> : <Table title="Claims and payouts" columns={claimColumns} rows={displayedClaims} emptyMessage={claims.length ? "No claims match the current search or filters." : "Automatically processed claims will appear here."} />}
            {!isLoadingData && filteredClaims.length > 0 && (
              <div className="pagination-bar" aria-label="Claims pagination">
                <span>Showing {(currentClaimPage - 1) * claimPageSize + 1}–{Math.min(currentClaimPage * claimPageSize, filteredClaims.length)} of {filteredClaims.length}</span>
                <div><button className="button button-secondary" type="button" onClick={() => setClaimPage((page) => Math.max(1, page - 1))} disabled={currentClaimPage <= 1}>Previous</button><span className="pagination-page">Page {currentClaimPage} of {claimPageCount}</span><button className="button button-secondary" type="button" onClick={() => setClaimPage((page) => Math.min(claimPageCount, page + 1))} disabled={currentClaimPage >= claimPageCount}>Next</button></div>
              </div>
            )}
          </section>
        )}

        {tab === "policies" && (
          <div className="page-content">
            {user.role === "admin" && (
              <section className="panel policy-form-panel">
                <div className="section-heading">
                  <div><p className="eyebrow">NEW COVERAGE</p><h2>Create a policy</h2><p className="section-description">Set the worker, covered event, trigger threshold, payout, and current status.</p></div>
                </div>
                {policyError && <div className="alert alert-danger form-feedback" role="alert">{policyError}</div>}
                {policySuccess && <div className="alert alert-success form-feedback" role="status">{policySuccess}</div>}
                <form className="policy-form" onSubmit={submitPolicy}>
                  <div className="form-field">
                    <label htmlFor="policy-worker">Worker</label>
                    <select id="policy-worker" value={policyForm.worker_id} onChange={(e) => setPolicyForm({ ...policyForm, worker_id: e.target.value })} required disabled={isLoadingData || workers.length === 0}>
                      <option value="">Select a worker</option>
                      {workers.map((worker) => <option key={worker.id} value={worker.id} disabled={!worker.is_active}>{worker.name} · {worker.zone}{worker.is_active ? "" : " · inactive"}</option>)}
                    </select>
                    <span className="field-hint">Only active workers can receive automatic claims.</span>
                  </div>
                  <div className="form-field">
                    <label htmlFor="policy-event-type">Covered event type</label>
                    <select id="policy-event-type" value={policyForm.event_type} onChange={(e) => setPolicyForm({ ...policyForm, event_type: e.target.value })} required>
                      <option value="heavy_rain">Heavy Rain</option><option value="extreme_heat">Extreme Heat</option><option value="flood">Flood</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="policy-threshold">Trigger threshold</label>
                    <input id="policy-threshold" type="number" min="0" step="any" value={policyForm.trigger_threshold} onChange={(e) => setPolicyForm({ ...policyForm, trigger_threshold: e.target.value })} required />
                  </div>
                  <div className="form-field">
                    <label htmlFor="policy-unit">Threshold unit</label>
                    <input id="policy-unit" value={policyForm.threshold_unit} onChange={(e) => setPolicyForm({ ...policyForm, threshold_unit: e.target.value })} maxLength="30" required />
                  </div>
                  <div className="form-field">
                    <label htmlFor="policy-payout">Payout amount (INR)</label>
                    <input id="policy-payout" type="number" min="0.01" step="0.01" value={policyForm.payout_amount} onChange={(e) => setPolicyForm({ ...policyForm, payout_amount: e.target.value })} required />
                  </div>
                  <div className="form-field">
                    <label htmlFor="policy-status">Status</label>
                    <select id="policy-status" value={policyForm.status} onChange={(e) => setPolicyForm({ ...policyForm, status: e.target.value })} required><option value="active">Active</option><option value="inactive">Inactive</option></select>
                    <span className="field-hint">Only active policies participate in automatic claim matching.</span>
                  </div>
                  <div className="form-actions">
                    <button className="button button-primary" type="submit" disabled={isSubmittingPolicy || isLoadingData || workers.filter((worker) => worker.is_active).length === 0}>{isSubmittingPolicy ? "Creating policy…" : "Create policy"}</button>
                    {workers.length === 0 && !isLoadingData && <p className="hint">No workers are available for policy assignment.</p>}
                  </div>
                </form>
              </section>
            )}
            <section className="panel data-panel">
              <div className="section-heading">
                <div><p className="eyebrow">COVERAGE</p><h2>Policies</h2><p className="section-description">Coverage rules currently stored in Insurly.</p></div>
                <span className="section-kicker">{filteredPolicies.length} of {policies.length} records</span>
              </div>
              <div className="table-toolbar">
                <div className="form-field toolbar-search"><label htmlFor="policy-search">Search policies</label><input id="policy-search" type="search" placeholder="Policy, worker, or event type" value={policySearch} onChange={(e) => setPolicySearch(e.target.value)} /></div>
                <div className="form-field"><label htmlFor="policy-status-filter">Status</label><select id="policy-status-filter" value={policyStatusFilter} onChange={(e) => setPolicyStatusFilter(e.target.value)}><option value="all">All statuses</option>{[...new Set(policies.map((policy) => policy.status))].filter(Boolean).map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}</select></div>
              </div>
              {isLoadingData ? <div className="loading-state" role="status">Loading policies…</div> : <Table title="Policies" columns={policyColumns} rows={filteredPolicies} emptyMessage={policies.length ? "No policies match the current search or filter." : "Policies will appear here when they are available."} />}
            </section>
            <section className="panel data-panel">
              <div className="section-heading">
                <div><p className="eyebrow">PEOPLE</p><h2>Workers</h2><p className="section-description">Workers registered in the platform.</p></div>
                <span className="section-kicker">{workers.length} records</span>
              </div>
              {isLoadingData ? <div className="loading-state" role="status">Loading workers…</div> : <Table title="Workers" columns={workerColumns} rows={workers} emptyMessage="Registered workers will appear here." />}
            </section>
          </div>
        )}

        {selectedClaim && <ClaimDetails claim={selectedClaim} onClose={() => setSelectedClaim(null)} />}

        <footer className="app-footer"><span>Insurly operations</span><span>Parametric income protection</span></footer>
      </main>
    </div>
  );
}

function formatLabel(value = "") {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCurrency(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "I";
}

function statusVariant(status = "") {
  const value = String(status).toLowerCase();
  if (["approved", "active", "processed"].includes(value)) return "success";
  if (["pending", "review"].includes(value)) return "warning";
  if (["rejected", "failed", "declined"].includes(value)) return "danger";
  return "neutral";
}

function severityVariant(severity = "") {
  const value = String(severity).toLowerCase();
  if (value === "high") return "danger";
  if (value === "medium") return "warning";
  if (value === "low") return "success";
  return "neutral";
}

export default App;

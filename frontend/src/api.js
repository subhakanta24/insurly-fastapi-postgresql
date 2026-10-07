const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function readableErrorDetail(detail) {
  if (typeof detail === "string") return detail.trim() || null;
  if (typeof detail === "number" || typeof detail === "boolean") return String(detail);
  if (Array.isArray(detail)) {
    const messages = detail.map(readableErrorDetail).filter(Boolean);
    return messages.length ? messages.join("; ") : null;
  }
  if (detail && typeof detail === "object") {
    const message = typeof detail.msg === "string"
      ? detail.msg
      : typeof detail.message === "string"
        ? detail.message
        : null;
    if (message) {
      const location = Array.isArray(detail.loc)
        ? detail.loc.filter((part) => part !== "body").join(" → ")
        : "";
      return location ? `${location}: ${message}` : message;
    }
    const entries = Object.entries(detail)
      .map(([key, value]) => {
        const readable = readableErrorDetail(value);
        return readable ? `${key}: ${readable}` : null;
      })
      .filter(Boolean);
    return entries.length ? entries.join("; ") : null;
  }
  return null;
}

async function request(path, options = {}) {
  const token = localStorage.getItem("insurly_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Could not reach the Insurly API. Check that the backend is running.");
  }
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      readableErrorDetail(data?.detail) || `Request failed (HTTP ${response.status}).`
    );
  }

  return data ?? {};
}

export async function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return request("/api/auth/me");
}

export async function getSummary() {
  return request("/api/dashboard/summary");
}

export async function getWorkers() {
  return request("/api/workers");
}

export async function getPolicies() {
  return request("/api/policies");
}

export async function createPolicy(payload) {
  return request("/api/policies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getEvents() {
  return request("/api/events");
}

export async function getClaims() {
  return request("/api/claims");
}

export async function createEvent(payload) {
  return request("/api/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

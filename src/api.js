const ENV_API_BASE_URL = (import.meta.env.VITE_API_URL || "").trim();
const _host = typeof window !== "undefined" ? window.location.hostname : "";
const IS_CODESPACES = /\.app\.github\.dev$/.test(_host);

function _resolveApiBase() {
  if (ENV_API_BASE_URL) {
    const base = ENV_API_BASE_URL.replace(/\/$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  if (IS_CODESPACES) {
    const backendHost = _host.replace(/-\d+\.app\.github\.dev$/, '-5000.app.github.dev');
    return `${window.location.protocol}//${backendHost}/api`;
  }
  return "/api";
}

const API_BASE_URL = _resolveApiBase();
const API_TIMEOUT = 10000;

async function parseJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

export async function apiCall(endpoint, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem("jwt_token");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    };
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      const message = data && typeof data === "object" && data.error ? data.error : `API error: ${response.status}`;
      throw new Error(message);
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Request timed out.");
    throw error;
  } finally { clearTimeout(timeout); }
}

export default apiCall;


import { useState, useEffect, useCallback } from "react";
import "./App.css";

export default function App() {
  const [keyName, setKeyName] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("Ready to connect");

  const [responseTime, setResponseTime] = useState(null);
  const [requestInfo, setRequestInfo] = useState(null);

  const [nodes, setNodes] = useState([]);
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  // LIVE NODE HEALTH MONITORING
  const checkNodeHealth = useCallback(async () => {
    try {
      const response = await fetch("/health", {
        signal: AbortSignal.timeout(3000),
      });

      const data = await response.json();

      if (!data.nodes) {
        throw new Error("Invalid health response");
      }

      setNodes(data.nodes);
      setLastChecked(new Date());
    } catch (error) {
      setNodes([
        { node: "Storage Node 1", port: 3001, status: "UNKNOWN" },
        { node: "Storage Node 2", port: 3002, status: "UNKNOWN" },
      ]);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkNodeHealth();

    const interval = setInterval(checkNodeHealth, 5000);

    return () => clearInterval(interval);
  }, [checkNodeHealth]);

  // API REQUEST HANDLER
  async function handleRequest(method) {
    const key = keyName.trim();

    if (!key) {
      setMessage("Please enter a key.");
      return;
    }

    if (method === "PUT" && !value.trim()) {
      setMessage("Please enter a value.");
      return;
    }

    if (
      method === "DELETE" &&
      !window.confirm(`Delete key "${key}"?`)
    ) {
      return;
    }

    const startedAt = performance.now();

    setLoading(true);
    setMessage(`${method} request in progress...`);
    setResult(null);
    setResponseTime(null);
    setRequestInfo({ method, key });

    try {
      const options = { method };

      if (method === "PUT") {
        options.headers = {
          "Content-Type": "application/json",
        };
        options.body = JSON.stringify({ value });
      }

      const response = await fetch(
        `/store/${encodeURIComponent(key)}`,
        options
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      setResponseTime(
        Math.round(performance.now() - startedAt)
      );

      setResult({
        status: response.status,
        data,
        success: response.ok,
      });

      setMessage(
        response.ok ? "Request successful" : "Request failed"
      );

      if (
        method === "GET" &&
        response.ok &&
        data.value !== undefined
      ) {
        setValue(String(data.value));
      }
    } catch (error) {
      setResponseTime(
        Math.round(performance.now() - startedAt)
      );

      setMessage("Connection failed");

      setResult({
        status: "Unavailable",
        success: false,
        data: {
          error: "Could not connect to the backend.",
          details: error.message,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  // COPY RESPONSE
  async function copyResponse() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(result.data, null, 2)
      );
      setMessage("Response copied successfully");
    } catch {
      setMessage("Unable to copy response");
    }
  }

  const activeNodes = nodes.filter(
    (node) => node.status === "ONLINE"
  ).length;

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">K</div>
          <div>
            <h2>KeySpace</h2>
            <p>Distributed Storage</p>
          </div>
        </div>

        <p className="side-label">WORKSPACE</p>

        <div className="nav active">▦ &nbsp; Dashboard</div>
        <div className="nav">▤ &nbsp; Key-Value Store</div>
        <div className="nav">◈ &nbsp; Storage Nodes</div>

        <div className="side-footer">
          <span className="live-dot" />
          <div>
            <strong>Local development</strong>
            <p>React + Node.js</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">

        {/* HEADER */}
        <header className="topbar">
          <div>
            <p className="muted">Workspace / Dashboard</p>
            <h1>Dashboard</h1>
          </div>

          <div className="router-badge">
            <span className="live-dot" />
            Router · Port 4000
          </div>
        </header>

        {/* HERO */}
        <section className="hero">
          <div>
            <span className="eyebrow">
              DISTRIBUTED SYSTEMS PROJECT
            </span>

            <h2>Your data. Distributed.</h2>

            <p>
              Manage key-value records through your central
              router and storage nodes.
            </p>
          </div>

          <div className="hero-art">
            K<span>+</span>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="stats">

          <article className="stat-card">
            <span>Configured storage nodes</span>
            <strong>02</strong>
            <small>Ports 3001 and 3002</small>
          </article>

          <article className="stat-card">
            <span>Active storage nodes</span>
            <strong>{activeNodes.toString().padStart(2, "0")}</strong>
            <small>Live node connections</small>
          </article>

          <article className="stat-card">
            <span>Supported operations</span>
            <strong>03</strong>
            <small>PUT · GET · DELETE</small>
          </article>

        </section>

        {/* API WORKSPACE */}
        <section className="content-grid">

          {/* REQUEST PANEL */}
          <article className="panel">
            <span className="eyebrow">DATA MANAGEMENT</span>

            <h2>Key-Value Operations</h2>

            <p className="muted">
              Create, read, update, or delete a record.
            </p>

            <label htmlFor="key">Key</label>

            <input
              id="key"
              value={keyName}
              onChange={(event) =>
                setKeyName(event.target.value)
              }
              placeholder="e.g. user101"
              maxLength={200}
            />

            <label htmlFor="value">Value</label>

            <textarea
              id="value"
              value={value}
              onChange={(event) =>
                setValue(event.target.value)
              }
              placeholder="Enter a value..."
              rows={4}
              maxLength={2000}
            />

            <div className="actions">
              <button
                disabled={loading}
                onClick={() => handleRequest("PUT")}
              >
                PUT / Update
              </button>

              <button
                className="secondary"
                disabled={loading}
                onClick={() => handleRequest("GET")}
              >
                GET / Read
              </button>

              <button
                className="danger"
                disabled={loading}
                onClick={() => handleRequest("DELETE")}
              >
                DELETE
              </button>
            </div>
          </article>

          {/* PROFESSIONAL API CONSOLE */}
          <article className="panel api-panel">

            <div className="api-heading">
              <div>
                <span className="eyebrow">
                  LIVE API OUTPUT
                </span>

                <h2>API Response Console</h2>

                <p className="muted">{message}</p>
              </div>

              <span
                className={`api-indicator ${
                  loading
                    ? "loading"
                    : result
                      ? result.success
                        ? "success"
                        : "error"
                      : "idle"
                }`}
              >
                <span className="status-dot" />

                {loading
                  ? "RUNNING"
                  : result
                    ? result.success
                      ? "SUCCESS"
                      : "FAILED"
                    : "READY"}
              </span>
            </div>

            {/* REQUEST DETAILS */}
            <div className="request-bar">

              <span
                className={`method-tag ${
                  (requestInfo?.method || "GET").toLowerCase()
                }`}
              >
                {requestInfo?.method || "GET"}
              </span>

              <div className="endpoint">
                <small>REQUEST ENDPOINT</small>

                <strong>
                  /store/{requestInfo?.key || ":key"}
                </strong>
              </div>

            </div>

            {/* RESPONSE METADATA */}
            <div className="response-toolbar">
              <span>RESPONSE BODY</span>

              <div className="response-meta">

                <span
                  className={`http-code ${
                    result
                      ? result.success
                        ? "success"
                        : "error"
                      : ""
                  }`}
                >
                  {loading
                    ? "Pending"
                    : result
                      ? `HTTP ${result.status}`
                      : "HTTP —"}
                </span>

                <span>
                  {responseTime !== null
                    ? `${responseTime} ms`
                    : "— ms"}
                </span>

              </div>
            </div>

            {/* JSON CONSOLE */}
            <div className="console api-console">

              <div className="console-header">

                <div className="console-dots">
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </div>

                <small>response.json</small>

                <span className="json-label">JSON</span>

              </div>

              <pre>
                {loading
                  ? "Waiting for server response..."
                  : result
                    ? JSON.stringify(result.data, null, 2)
                    : "// Send a request to view the API response"}
              </pre>

            </div>

            {/* CONSOLE FOOTER */}
            <div className="console-footer">

              <span className="muted">
                {result
                  ? "Response received from router"
                  : "Waiting for request"}
              </span>

              <button
                className="copy-button"
                disabled={!result}
                onClick={copyResponse}
              >
                Copy JSON
              </button>

            </div>

          </article>

        </section>

        {/* STORAGE NODE MONITORING */}
        <section className="panel nodes-panel">

          <div className="health-heading">

            <div>
              <span className="eyebrow">
                LIVE SYSTEM MONITORING
              </span>

              <h2>Storage Nodes Health</h2>

              <p className="muted">
                Automatically refreshed every 5 seconds.
              </p>
            </div>

            <button
              className="secondary"
              onClick={checkNodeHealth}
              disabled={healthLoading}
            >
              ↻ Refresh
            </button>

          </div>

          <div className="nodes">

            {nodes.map((node) => (

              <div className="node-card" key={node.port}>

                <div className="node-icon">▤</div>

                <div className="node-info">

                  <h3>{node.node}</h3>

                  <p>localhost:{node.port}</p>

                  <small>
                    {node.status === "ONLINE"
                      ? "Node responding"
                      : node.status === "OFFLINE"
                        ? "Node unavailable"
                        : "Checking connection"}
                  </small>

                </div>

                <span
                  className={`health-status ${
                    (node.status || "UNKNOWN").toLowerCase()
                  }`}
                >
                  <span className="status-dot" />
                  {node.status || "UNKNOWN"}
                </span>

              </div>

            ))}

          </div>

          <p className="muted note">
            {healthLoading
              ? "Checking node status..."
              : lastChecked
                ? `Last checked: ${lastChecked.toLocaleTimeString()}`
                : "Health information unavailable. Check Router connection."}
          </p>

        </section>

        {/* FOOTER */}
        <footer>
          KeySpace · Distributed Key-Value Store

          <span>React · Express · REST APIs</span>
        </footer>

      </main>
    </div>
  );
}

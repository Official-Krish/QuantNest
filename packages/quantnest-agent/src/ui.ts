import http from "node:http";
import { getStatus } from "./agent";
import { queryAudit, clearAudit } from "./audit";

const PORT = 8888;

export function startWebDashboard(): { server: http.Server; url: string } {
  const url = `http://127.0.0.1:${PORT}`;

  const server = http.createServer((req, res) => {
    const u = new URL(req.url ?? "/", url);
    const path = u.pathname;

    if (path === "/api/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(getStatus()));
      return;
    }

    if (path === "/api/audit") {
      const limit = parseInt(u.searchParams.get("limit") ?? "50", 10);
      const type = u.searchParams.get("type") ?? undefined;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(queryAudit({ tail: true, limit, type })));
      return;
    }

    if (path === "/api/audit/clear") {
      clearAudit();
      res.writeHead(204);
      res.end();
      return;
    }

    if (path === "/") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  server.listen(PORT, "127.0.0.1");
  return { server, url };
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QuantNest Agent</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{
    font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:#000;color:#e5e5e5;min-height:100vh;display:flex;flex-direction:column
  }
  .page{max-width:960px;margin:0 auto;padding:24px 20px;width:100%}
  h1{font-size:24px;font-weight:700;color:#fff}
  h2{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#a1a1aa;margin-bottom:12px}
  .header{display:flex;align-items:center;gap:12px;margin-bottom:28px;flex-wrap:wrap}
  .header-right{margin-left:auto;display:flex;align-items:center;gap:10px}
  .badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 12px;font-size:11px;font-weight:600;letter-spacing:0.02em}
  .badge-ok{background:rgba(52,211,153,0.12);color:#34d399;border:1px solid rgba(52,211,153,0.3)}
  .badge-err{background:rgba(239,68,68,0.12);color:#ef4444;border:1px solid rgba(239,68,68,0.3)}
  .badge-neutral{background:rgba(113,113,122,0.12);color:#a1a1aa;border:1px solid rgba(113,113,122,0.2)}
  .dot{width:7px;height:7px;border-radius:50%;display:inline-block}
  .dot-ok{background:#34d399;box-shadow:0 0 6px rgba(52,211,153,0.5)}
  .dot-err{background:#ef4444}
  .dot-neutral{background:#52525b}
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:28px}
  .card{
    background:#0d0f13;
    border:1px solid rgba(255,255,255,0.06);
    border-radius:14px;
    padding:14px 16px;
    transition:border-color 0.2s
  }
  .card:hover{border-color:rgba(255,255,255,0.12)}
  .card-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;margin-bottom:6px}
  .card-value{font-size:15px;font-weight:600;color:#fff}
  .card-value-sm{font-size:12px;color:#d4d4d4;font-weight:500;word-break:break-all}
  .section{margin-bottom:28px}
  .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px}
  .refresh-indicator{display:flex;align-items:center;gap:6px;font-size:11px;color:#52525b}
  .refresh-spinner{width:10px;height:10px;border-radius:50%;border:2px solid rgba(241,116,99,0.3);border-top-color:#f17463;animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{
    text-align:left;padding:8px 12px;font-size:10px;font-weight:600;text-transform:uppercase;
    letter-spacing:0.08em;color:#52525b;border-bottom:1px solid rgba(255,255,255,0.06)
  }
  td{padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.04);color:#d4d4d4;vertical-align:middle}
  tr:hover td{background:rgba(255,255,255,0.02)}
  .status-ok{color:#34d399}
  .status-err{color:#ef4444}
  .status-info{color:#a1a1aa}
  .time{color:#71717a;font-size:11px;white-space:nowrap;font-family:SFMono-Regular,Consolas,monospace}
  .type-badge{
    display:inline-block;border-radius:6px;padding:2px 8px;font-size:10px;font-weight:600;
    background:rgba(241,116,99,0.1);color:#f17463;letter-spacing:0.02em;font-family:SFMono-Regular,Consolas,monospace
  }
  .wf-id{font-family:SFMono-Regular,Consolas,monospace;font-size:10px;color:#52525b}
  .error-text{color:#ef4444;font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .empty{text-align:center;padding:40px 0;color:#52525b;font-size:13px}
  .footer{display:flex;align-items:center;justify-content:center;gap:16px;padding:20px 0 40px;flex-wrap:wrap}
  .footer a{color:#71717a;font-size:12px;text-decoration:none;transition:color 0.2s}
  .footer a:hover{color:#f17463}
  .version{color:#52525b;font-size:11px}
  @media(max-width:640px){
    .cards{grid-template-columns:repeat(2,1fr)}
    .page{padding:16px 12px}
    table{font-size:11px}
    th,td{padding:6px 8px}
    .header{flex-direction:column;align-items:flex-start}
    .header-right{margin-left:0}
  }
</style>
</head>
<body>
<div class="page" id="app">
  <div class="header">
    <h1>QuantNest Agent</h1>
    <div class="badge badge-neutral" id="versionBadge">v0.1.0</div>
    <div class="header-right">
      <span class="badge" id="statusBadge">
        <span class="dot dot-neutral"></span>
        <span id="statusText">Connecting...</span>
      </span>
    </div>
  </div>

  <div class="section">
    <h2>Status</h2>
    <div class="cards" id="cards">
      <div class="card"><div class="card-label">Connection</div><div class="card-value" id="connValue">—</div></div>
      <div class="card"><div class="card-label">OpenClaw</div><div class="card-value" id="openclawValue">—</div></div>
      <div class="card"><div class="card-label">Uptime</div><div class="card-value" id="uptimeValue">—</div></div>
      <div class="card"><div class="card-label">Agent ID</div><div class="card-value-sm" id="agentIdValue">—</div></div>
      <div class="card"><div class="card-label">Platform</div><div class="card-value" id="platformValue">—</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <h2 style="margin-bottom:0">Recent Activity</h2>
      <div class="refresh-indicator">
        <span class="refresh-spinner"></span>
        <span id="refreshLabel">3s</span>
      </div>
    </div>
    <div style="background:#0d0f13;border:1px solid rgba(255,255,255,0.06);border-radius:14px;overflow:hidden">
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>Time</th>
            <th>Type</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Workflow</th>
            <th>Error</th>
          </tr></thead>
          <tbody id="auditBody">
            <tr><td colspan="6" class="empty">No activity yet</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="footer">
    <a href="https://quantnest.krishlabs.tech" target="_blank">Open Cloud Dashboard ↗</a>
    <span class="version">quantnest-agent v0.1.0</span>
  </div>
</div>

<script>
const POLL = 3000;
const statusEls = {
  statusBadge: document.getElementById('statusBadge'),
  statusText: document.getElementById('statusText'),
  connValue: document.getElementById('connValue'),
  openclawValue: document.getElementById('openclawValue'),
  uptimeValue: document.getElementById('uptimeValue'),
  agentIdValue: document.getElementById('agentIdValue'),
  platformValue: document.getElementById('platformValue'),
  auditBody: document.getElementById('auditBody'),
  refreshLabel: document.getElementById('refreshLabel'),
};

let lastStatus = null;
let lastAudit = null;
let tick = 0;

function formatUptime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return h + 'h ' + m + 'm ' + sec + 's';
  if (m > 0) return m + 'm ' + sec + 's';
  return sec + 's';
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function ago(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 1000) return 'just now';
  if (diff < 60000) return Math.floor(diff / 1000) + 's ago';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  return Math.floor(diff / 3600000) + 'h ago';
}

function ellipsis(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

function statusIcon(st) {
  if (st === 'success') return '<span class="status-ok">✔</span>';
  if (st === 'error') return '<span class="status-err">✘</span>';
  return '<span class="status-info">–</span>';
}

async function fetchStatus() {
  try {
    const r = await fetch('/api/status');
    lastStatus = await r.json();
  } catch { /* ignore */ }
}

async function fetchAudit() {
  try {
    const r = await fetch('/api/audit?limit=50');
    lastAudit = await r.json();
  } catch { /* ignore */ }
}

function renderStatus(s) {
  if (!s) return;
  const connected = s.connected;
  const badge = statusEls.statusBadge;
  const text = statusEls.statusText;
  const dot = badge.querySelector('.dot');

  if (connected) {
    badge.className = 'badge badge-ok';
    dot.className = 'dot dot-ok';
    text.textContent = 'Connected';
  } else {
    badge.className = 'badge badge-err';
    dot.className = 'dot dot-err';
    text.textContent = 'Disconnected';
  }

  statusEls.connValue.innerHTML = connected
    ? '<span class="dot dot-ok" style="margin-right:6px"></span>Connected'
    : '<span class="dot dot-err" style="margin-right:6px"></span>Disconnected';

  statusEls.openclawValue.innerHTML = s.openclawRunning
    ? '<span class="dot dot-ok" style="margin-right:6px"></span>Running'
    : '<span class="dot dot-neutral" style="margin-right:6px"></span>Not detected';

  statusEls.uptimeValue.textContent = formatUptime(s.uptime);
  statusEls.agentIdValue.textContent = s.agentId ? s.agentId.slice(0, 8) + '...' : '—';
  statusEls.platformValue.textContent = s.os || '—';
}

function renderAudit(entries) {
  if (!entries || entries.length === 0) {
    statusEls.auditBody.innerHTML = '<tr><td colspan="6" class="empty">No activity yet</td></tr>';
    return;
  }
  statusEls.auditBody.innerHTML = entries.map(e => {
    const ts = e.timestamp ? formatTime(e.timestamp) : '';
    const agoText = e.timestamp ? ago(e.timestamp) : '';
    const dur = e.duration != null ? (e.duration / 1000).toFixed(1) + 's' : '—';
    const wf = e.workflowId ? '<span class="wf-id">' + ellipsis(e.workflowId, 10) + '</span>' : '—';
    const err = e.error ? '<span class="error-text" title="' + e.error.replace(/"/g,'&quot;') + '">' + ellipsis(e.error, 30) + '</span>' : '—';
    return '<tr>' +
      '<td class="time">' + ts + ' <span style="color:#52525b">' + agoText + '</span></td>' +
      '<td><span class="type-badge">' + e.type + '</span></td>' +
      '<td>' + statusIcon(e.status) + '</td>' +
      '<td style="color:#a1a1aa">' + dur + '</td>' +
      '<td>' + wf + '</td>' +
      '<td>' + err + '</td>' +
      '</tr>';
  }).join('');
}

async function tickAll() {
  tick++;
  statusEls.refreshLabel.textContent = (POLL / 1000) + 's';
  await Promise.all([fetchStatus(), fetchAudit()]);
  renderStatus(lastStatus);
  renderAudit(lastAudit);
}

tickAll();
setInterval(tickAll, POLL);
</script>
</body>
</html>`;

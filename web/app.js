const metricsRoot = document.getElementById("metrics");
const chartContainer = document.getElementById("latency-chart");
const tableBody = document.getElementById("email-table-body");
const riskList = document.getElementById("risk-list");
const senderFilter = document.getElementById("sender-filter");
const subjectFilter = document.getElementById("subject-filter");
const piiOnlyFilter = document.getElementById("pii-only-filter");
const refreshButton = document.getElementById("refresh-button");
const navItems = Array.from(document.querySelectorAll(".nav-item"));
const viewTitle = document.getElementById("view-title");
const heroTitle = document.getElementById("hero-title");
const heroCopy = document.getElementById("hero-copy");
const mailTableBody = document.getElementById("mail-table-body");
const activityTableBody = document.getElementById("activity-table-body");
const piiList = document.getElementById("pii-list");
const mailSummary = document.getElementById("mail-summary");
const piiSummary = document.getElementById("pii-summary");
const activitySummary = document.getElementById("activity-summary");

const sections = {
  dashboard: document.getElementById("dashboard-section"),
  mail: document.getElementById("mail-section"),
  pii: document.getElementById("pii-section"),
  activity: document.getElementById("activity-detail-section"),
};

const viewPanels = Array.from(document.querySelectorAll(".view-panel"));

const viewConfig = {
  dashboard: {
    title: "PII review board",
    heroTitle: "Track processed messages and inspect flagged results.",
    heroCopy:
      "Review the latest scan output, search by sender or subject, and watch risky findings appear as the local database updates.",
  },
  mail: {
    title: "Scanned mail",
    heroTitle: "Browse the full scanned message set.",
    heroCopy:
      "Inspect processed messages across the mailbox with status, timing, and sender metadata in one place.",
  },
  pii: {
    title: "PII findings",
    heroTitle: "Focus on emails that triggered findings.",
    heroCopy:
      "Review only flagged items, inspect extracted findings, and identify the messages that deserve follow-up.",
  },
  activity: {
    title: "Processing activity",
    heroTitle: "Watch fetch and LLM timing trends.",
    heroCopy:
      "Use timing data to see where the pipeline is spending time and how processing performance changes over time.",
  },
};

let allEmails = [];
let refreshInFlight = false;

function renderMetrics(summary) {
  const cards = [
    { label: "Scanned Emails", value: summary.totalScanned, tone: "warm" },
    { label: "PII Hits", value: summary.piiHits, tone: "alert" },
    { label: "Clean Emails", value: summary.cleanEmails, tone: "calm" },
    { label: "Total Findings", value: summary.totalFindings, tone: "warm" },
  ];

  metricsRoot.innerHTML = cards
    .map(
      ({ label, value, tone }) => `
        <article class="metric-card ${tone}">
          <div class="metric-label">${label}</div>
          <div class="metric-value">${value}</div>
        </article>
      `
    )
    .join("");
}

function formatMs(ms) {
  if (ms == null) return "—";
  return ms >= 1000 ? (ms / 1000).toFixed(1) + "s" : ms + "ms";
}

function renderLatencyChart(emails) {
  const timed = [...emails]
    .filter((e) => e.totalTimeMs != null)
    .reverse(); // chronological order (API returns newest first)

  if (!timed.length) {
    chartContainer.innerHTML = `<div class="empty-state" style="padding:32px">No timing data yet.</div>`;
    return;
  }

  const W = chartContainer.clientWidth || 800;
  const H = 220;
  const PAD = { top: 20, right: 20, bottom: 48, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const totals = timed.map((e) => e.totalTimeMs);
  const dataMax = Math.max(...totals) || 1;

  // Pad the data domain 5% above and below so dots at 0 and max
  // are never flush against the plot edge
  const yMin = -(dataMax * 0.05);
  const yMax = dataMax * 1.05;
  const yRange = yMax - yMin;

  const xStep = innerW / Math.max(timed.length - 1, 1);
  const toX   = (i) => PAD.left + i * xStep;
  const toY   = (v) => PAD.top + innerH - ((v - yMin) / yRange) * innerH;

  // Y-axis tick values (0 through dataMax)
  const ticks = 4;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) =>
    (dataMax / ticks) * i
  );

  // Build polyline points
  const points = timed.map((e, i) => `${toX(i)},${toY(e.totalTimeMs)}`).join(" ");

  // Build invisible hover targets + tooltip data
  const circles = timed
    .map((e, i) => {
      const x = toX(i).toFixed(1);
      const y = toY(e.totalTimeMs).toFixed(1);
      const tip = [
        `Total: ${formatMs(e.totalTimeMs)}`,
        `LLM:   ${formatMs(e.llmTimeMs)}`,
        `Fetch: ${formatMs(e.fetchTimeMs)}`,
      ].join("&#10;");
      return `<circle cx="${x}" cy="${y}" r="5" class="chart-dot"
                data-tip="${tip}" data-x="${x}" data-y="${y}"
                onmouseenter="showChartTip(event,this)" onmouseleave="hideChartTip()"/>`;
    })
    .join("");

  // Y-axis grid lines + labels
  const gridLines = tickValues
    .map((v) => {
      const y = toY(v).toFixed(1);
      return `
        <line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}"
              stroke="var(--border)" stroke-dasharray="4 3"/>
        <text x="${PAD.left - 6}" y="${y}" class="chart-label" text-anchor="end"
              dominant-baseline="middle">${formatMs(Math.round(v))}</text>`;
    })
    .join("");

  // X-axis label: first and last processed timestamp
  const xLabels = timed.length > 1
    ? `<text x="${PAD.left}" y="${H - 6}" class="chart-label" text-anchor="start">oldest</text>
       <text x="${W - PAD.right}" y="${H - 6}" class="chart-label" text-anchor="end">newest</text>`
    : "";

  chartContainer.innerHTML = `
    <svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"
         style="overflow:visible">
      ${gridLines}
      <polyline points="${points}" fill="none"
                stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
      ${circles}
      ${xLabels}
    </svg>
    <div id="chart-tooltip" class="chart-tooltip" style="display:none"></div>
  `;
}

function showChartTip(_event, el) {
  const tip = document.getElementById("chart-tooltip");
  tip.textContent = el.dataset.tip.replace(/&#10;/g, "\n");
  tip.style.display = "block";
  const rect = chartContainer.getBoundingClientRect();
  const cx = parseFloat(el.getAttribute("cx"));
  const cy = parseFloat(el.getAttribute("cy"));
  // position relative to the SVG's rendered width
  const svgEl = el.closest("svg");
  const svgRect = svgEl.getBoundingClientRect();
  const scaleX = svgRect.width / (svgEl.viewBox.baseVal.width || svgRect.width);
  const scaleY = svgRect.height / (svgEl.viewBox.baseVal.height || svgRect.height);
  tip.style.left = (cx * scaleX + svgRect.left - rect.left + 10) + "px";
  tip.style.top  = (cy * scaleY + svgRect.top  - rect.top  - 10) + "px";
}

function hideChartTip() {
  const tip = document.getElementById("chart-tooltip");
  if (tip) tip.style.display = "none";
}

function renderTable(emails) {
  if (!emails.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No emails match the current filters.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = emails
    .map(
      (email) => `
        <tr>
          <td>${escapeHtml(email.processedAt)}</td>
          <td>${escapeHtml(email.sender)}</td>
          <td>${escapeHtml(email.subject || "(No subject)")}</td>
          <td>
            <span class="badge ${email.hasPii ? "alert" : "safe"}">
              ${email.hasPii ? "PII" : "Clean"}
            </span>
          </td>
          <td>${email.findingCount}</td>
          <td>
            <div class="timing-cell">
              <span><span class="t-label">fetch</span> ${formatMs(email.fetchTimeMs)}</span>
              <span><span class="t-label">llm</span> ${formatMs(email.llmTimeMs)}</span>
              <span><span class="t-label">total</span> ${formatMs(email.totalTimeMs)}</span>
            </div>
          </td>
          <td>${escapeHtml(email.gmailId)}</td>
        </tr>
      `
    )
    .join("");
}

function renderMailTable(emails) {
  if (!emails.length) {
    mailTableBody.innerHTML = `
      <tr><td colspan="7" class="empty-state">No scanned emails available.</td></tr>
    `;
    return;
  }

  mailTableBody.innerHTML = emails
    .map(
      (email) => `
        <tr>
          <td>${escapeHtml(email.processedAt)}</td>
          <td>${escapeHtml(email.sender)}</td>
          <td>${escapeHtml(email.subject || "(No subject)")}</td>
          <td><span class="badge ${email.hasPii ? "alert" : "safe"}">${email.hasPii ? "PII" : "Clean"}</span></td>
          <td>${email.findingCount}</td>
          <td>
            <div class="timing-cell">
              <span><span class="t-label">fetch</span> ${formatMs(email.fetchTimeMs)}</span>
              <span><span class="t-label">llm</span> ${formatMs(email.llmTimeMs)}</span>
              <span><span class="t-label">total</span> ${formatMs(email.totalTimeMs)}</span>
            </div>
          </td>
          <td>${escapeHtml(email.gmailId)}</td>
        </tr>
      `
    )
    .join("");
}

function renderRiskList(emails) {
  const piiEmails = emails.filter((email) => email.hasPii).slice(0, 5);

  if (!piiEmails.length) {
    riskList.innerHTML = `<div class="empty-state">No flagged emails yet.</div>`;
    return;
  }

  riskList.innerHTML = piiEmails
    .map(
      (email) => `
        <article class="risk-card">
          <h3>${escapeHtml(email.subject || "(No subject)")}</h3>
          <div class="risk-meta">${escapeHtml(email.sender)} | ${escapeHtml(email.processedAt)}</div>
          ${email.findings.length ? email.findings.map(renderFinding).join("") : '<div class="empty-state">No findings stored.</div>'}
        </article>
      `
    )
    .join("");
}

function renderPiiList(emails) {
  const piiEmails = emails.filter((email) => email.hasPii);

  if (!piiEmails.length) {
    piiList.innerHTML = `<div class="empty-state">No flagged emails yet.</div>`;
    return;
  }

  piiList.innerHTML = piiEmails
    .map(
      (email) => `
        <article class="risk-card">
          <h3>${escapeHtml(email.subject || "(No subject)")}</h3>
          <div class="risk-meta">${escapeHtml(email.sender)} | ${escapeHtml(email.processedAt)} | Findings: ${email.findingCount}</div>
          ${email.findings.length ? email.findings.map(renderFinding).join("") : '<div class="empty-state">No findings stored.</div>'}
        </article>
      `
    )
    .join("");
}

function renderActivityTable(emails) {
  const timed = emails.filter((email) => email.totalTimeMs != null);

  if (!timed.length) {
    activityTableBody.innerHTML = `
      <tr><td colspan="5" class="empty-state">No timing data yet.</td></tr>
    `;
    return;
  }

  activityTableBody.innerHTML = timed
    .map(
      (email) => `
        <tr>
          <td>${escapeHtml(email.processedAt)}</td>
          <td>${escapeHtml(email.subject || "(No subject)")}</td>
          <td>${formatMs(email.fetchTimeMs)}</td>
          <td>${formatMs(email.llmTimeMs)}</td>
          <td>${formatMs(email.totalTimeMs)}</td>
        </tr>
      `
    )
    .join("");
}

function renderViewSummaries(emails) {
  const piiEmails = emails.filter((email) => email.hasPii);
  const timed = emails.filter((email) => email.totalTimeMs != null);
  const avgTotal = timed.length
    ? Math.round(timed.reduce((sum, email) => sum + email.totalTimeMs, 0) / timed.length)
    : null;

  mailSummary.textContent = `${emails.length} scanned emails available`;
  piiSummary.textContent = `${piiEmails.length} flagged emails with ${piiEmails.reduce((sum, email) => sum + email.findingCount, 0)} total findings`;
  activitySummary.textContent = timed.length
    ? `${timed.length} emails with timing data • average total ${formatMs(avgTotal)}`
    : "No timing data yet";
}

function renderFinding(finding) {
  return `
    <div class="finding-chip">
      <div class="finding-type">${escapeHtml(finding.type || "unknown")}</div>
      <div class="finding-value">${escapeHtml(finding.value || "")}</div>
      <div class="finding-context">${escapeHtml(finding.context || "")}</div>
    </div>
  `;
}

function applyFilters() {
  const senderValue = senderFilter.value.trim().toLowerCase();
  const subjectValue = subjectFilter.value.trim().toLowerCase();
  const piiOnly = piiOnlyFilter.checked;

  const filtered = allEmails.filter((email) => {
    const senderMatch = !senderValue || email.sender.toLowerCase().includes(senderValue);
    const subjectMatch = !subjectValue || email.subject.toLowerCase().includes(subjectValue);
    const piiMatch = !piiOnly || email.hasPii;
    return senderMatch && subjectMatch && piiMatch;
  });

  renderTable(filtered);
}

function setActiveNav(view) {
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });
}

function goToView(view) {
  setActiveNav(view);
  const config = viewConfig[view];
  if (config) {
    viewTitle.textContent = config.title;
    heroTitle.textContent = config.heroTitle;
    heroCopy.textContent = config.heroCopy;
  }

  viewPanels.forEach((panel) => panel.classList.add("hidden"));
  if (view === "dashboard") {
    document.getElementById("dashboard-section").classList.remove("hidden");
    document.getElementById("activity-section").classList.remove("hidden");
  } else {
    const section = sections[view];
    if (section) {
      section.classList.remove("hidden");
    }
  }
}

async function loadDashboard() {
  if (refreshInFlight) {
    return;
  }

  refreshInFlight = true;
  refreshButton.disabled = true;
  refreshButton.textContent = "Refreshing...";

  try {
    const response = await fetch("/api/emails");
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const payload = await response.json();
    allEmails = payload.emails || [];
    const summary = payload.summary || {
      totalScanned: 0,
      piiHits: 0,
      cleanEmails: 0,
      totalFindings: 0,
      avgFetchMs: null,
      avgLlmMs: null,
      avgTotalMs: null,
    };
    renderMetrics(summary);
    renderLatencyChart(allEmails);
    renderRiskList(allEmails);
    renderMailTable(allEmails);
    renderPiiList(allEmails);
    renderActivityTable(allEmails);
    renderViewSummaries(allEmails);
    applyFilters();
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Failed to load dashboard data.</td>
      </tr>
    `;
    riskList.innerHTML = `<div class="empty-state">Failed to load risk data.</div>`;
    console.error(error);
  } finally {
    refreshInFlight = false;
    refreshButton.disabled = false;
    refreshButton.textContent = "Refresh";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

senderFilter.addEventListener("input", applyFilters);
subjectFilter.addEventListener("input", applyFilters);
piiOnlyFilter.addEventListener("change", applyFilters);
refreshButton.addEventListener("click", loadDashboard);
navItems.forEach((item) => {
  item.addEventListener("click", () => goToView(item.dataset.view));
});

loadDashboard();
goToView("dashboard");
setInterval(loadDashboard, 5000);

const metricsRoot = document.getElementById("metrics");
const tableBody = document.getElementById("email-table-body");
const riskList = document.getElementById("risk-list");
const senderFilter = document.getElementById("sender-filter");
const subjectFilter = document.getElementById("subject-filter");
const piiOnlyFilter = document.getElementById("pii-only-filter");
const refreshButton = document.getElementById("refresh-button");

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
    renderMetrics(payload.summary || {
      totalScanned: 0,
      piiHits: 0,
      cleanEmails: 0,
      totalFindings: 0,
    });
    renderRiskList(allEmails);
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

loadDashboard();
setInterval(loadDashboard, 5000);

// utils/SelectionReportGenerator.js

/**
 * Utility to generate and trigger printing of the comprehensive
 * Official Beneficiary Selection & Audit Report for an Eligibility Form.
 */

// Human-friendly factor label lookup
const FACTOR_LABELS = {
  pwd: "Person with Disability (PWD)",
  senior: "Senior Citizen (60+)",
  solop: "Solo Parent",
  noWorkingAdult: "No Working Adult in Household",
  largeHousehold: "Large Household (5+ members)",
  children: "Household with Young Children",
  notHelpedRecently: "Not Helped Recently",
};

export const printSelectionReport = (reportData) => {
  const { form, summary, entries, audit_trail = [] } = reportData;

  const formName = form?.form_name || "Eligibility Form";
  const distributionUnit = form?.distribution_unit || "Individual";
  const listType = form?.list_type || "Standard";
  const today = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const priorityConfig = form?.priorityConfig || {};
  const factors = priorityConfig?.factors || {};
  const seed = priorityConfig?.seed || null;
  const lookbackDays = priorityConfig?.lookbackDays || null;

  // Selected rows
  const selectedRowsHtml = (entries?.selected || [])
    .map((e, idx) => {
      const breakdownText = (e.breakdown || [])
        .map((b) => `${b.label} (+${b.points})`)
        .join(", ");
      return `
        <tr>
          <td class="col-center">${idx + 1}</td>
          <td class="col-center font-bold">${e.rank_no != null ? `#${e.rank_no}` : "—"}</td>
          <td class="font-bold">${e.fullName || "—"}</td>
          <td class="col-center font-bold">${e.priority_score ?? "—"}</td>
          <td class="col-breakdown">${breakdownText || "No priority factors matched"}</td>
          <td class="col-center">${e.is_rewarded === 1 ? '<span class="badge badge-received">Received</span>' : '<span class="badge badge-pending">Pending</span>'}</td>
        </tr>
      `;
    })
    .join("");

  // Waitlist rows
  const waitlistRowsHtml = (entries?.waitlist || [])
    .map((e, idx) => {
      const breakdownText = (e.breakdown || [])
        .map((b) => `${b.label} (+${b.points})`)
        .join(", ");
      return `
        <tr>
          <td class="col-center">${idx + 1}</td>
          <td class="col-center font-bold">#${e.rank_no ?? (idx + 1)}</td>
          <td class="font-bold">${e.fullName || "—"}</td>
          <td class="col-center font-bold">${e.priority_score ?? "—"}</td>
          <td class="col-breakdown">${breakdownText || "No priority factors matched"}</td>
        </tr>
      `;
    })
    .join("");

  // Removed rows
  const removedRowsHtml = (entries?.removed || [])
    .map((e, idx) => {
      return `
        <tr>
          <td class="col-center">${idx + 1}</td>
          <td class="font-bold">${e.fullName || "—"}</td>
          <td class="col-center">${e.rank_no != null ? `#${e.rank_no}` : "—"}</td>
          <td class="text-danger">${e.selection_note || "No reason recorded"}</td>
          <td>${e.processed_by_name || "Admin"}</td>
          <td class="col-center">${e.processed_at || "—"}</td>
        </tr>
      `;
    })
    .join("");

  // Audit trail / Override log rows
  const auditRowsHtml = (audit_trail || [])
    .map((log, idx) => {
      const d = log.details || {};
      let actionLabel = log.action_type;
      let badgeClass = "badge-neutral";

      if (log.action_type === "removed") {
        actionLabel = "Removal";
        badgeClass = "badge-danger";
      } else if (log.action_type === "promoted_from_waitlist") {
        actionLabel = "Auto-Promoted";
        badgeClass = "badge-info";
      } else if (log.action_type === "override_removed") {
        actionLabel = "Override Replaced";
        badgeClass = "badge-warning";
      } else if (log.action_type === "override_promoted") {
        actionLabel = "Override Promoted";
        badgeClass = "badge-primary";
      }

      let detailsText = "";
      if (d.reason) detailsText += `<strong>Reason:</strong> ${d.reason}<br/>`;
      if (d.promoted_resident) detailsText += `<strong>Promoted:</strong> ${d.promoted_resident} `;
      if (d.replaced_resident) detailsText += `<strong>Replaced:</strong> ${d.replaced_resident} `;
      if (d.replaced_by_resident) detailsText += `<strong>Replaced By:</strong> ${d.replaced_by_resident} `;
      if (d.rank_no != null) detailsText += `(Rank #${d.rank_no})`;

      return `
        <tr>
          <td class="col-center">${idx + 1}</td>
          <td><span class="badge ${badgeClass}">${actionLabel}</span></td>
          <td class="font-bold">${log.entity_name || "—"}</td>
          <td>${detailsText || "—"}</td>
          <td>${log.performed_by_name || "Admin"}</td>
          <td class="col-center">${log.performed_at || "—"}</td>
        </tr>
      `;
    })
    .join("");

  // Priority factors table rows
  const factorRowsHtml = Object.entries(factors)
    .map(([key, config]) => {
      const label = FACTOR_LABELS[key] || key;
      const enabled = config?.enabled !== false;
      const weight = config?.weight ?? 1;
      return `
        <tr>
          <td>${label}</td>
          <td class="col-center font-bold">${weight} pt${weight > 1 ? "s" : ""}</td>
          <td class="col-center">${enabled ? '<span class="text-success font-bold">Enabled</span>' : '<span class="text-muted">Disabled</span>'}</td>
        </tr>
      `;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Beneficiary Selection Report — ${formName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 10pt;
      color: #1e293b;
      background: #fff;
      padding: 24px 32px;
      line-height: 1.4;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      border-bottom: 2px solid #002f59;
      padding-bottom: 14px;
    }
    .header img {
      width: 72px;
      height: 72px;
      object-fit: contain;
    }
    .header-text {
      flex: 1;
      text-align: center;
    }
    .header-text .republic {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
    }
    .header-text .barangay-name {
      font-size: 15pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #002f59;
    }
    .header-text .office {
      font-size: 9.5pt;
      font-weight: 600;
      color: #334155;
    }
    .report-title-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      text-align: center;
      padding: 8px 12px;
      margin-bottom: 16px;
    }
    .report-title-box h1 {
      font-size: 13pt;
      font-weight: 800;
      color: #002f59;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .report-title-box .subtitle {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 2px;
    }

    /* ── Overview Grids ── */
    .section-title {
      font-size: 10.5pt;
      font-weight: 800;
      color: #002f59;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 18px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .meta-table td {
      padding: 5px 8px;
      font-size: 9pt;
      border: 1px solid #e2e8f0;
    }
    .meta-table .meta-label {
      background-color: #f8fafc;
      font-weight: 700;
      color: #475569;
      width: 20%;
    }
    .meta-table .meta-value {
      width: 30%;
      color: #0f172a;
    }

    /* ── KPI Summary Cards ── */
    .kpi-container {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 10px;
      text-align: center;
      background: #f8fafc;
    }
    .kpi-num {
      font-size: 15pt;
      font-weight: 800;
      color: #002f59;
    }
    .kpi-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.02em;
    }

    /* ── Data Tables ── */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    table.data-table thead tr {
      background-color: #002f59;
      color: #fff;
    }
    table.data-table thead th {
      padding: 6px 8px;
      font-size: 8.5pt;
      font-weight: 700;
      text-align: left;
      border: 1px solid #002f59;
    }
    table.data-table tbody td {
      padding: 5px 8px;
      font-size: 8.5pt;
      border: 1px solid #cbd5e1;
      vertical-align: middle;
    }
    table.data-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* ── Column Helpers ── */
    .col-center { text-align: center; }
    .col-breakdown { font-size: 8pt; color: #475569; }
    .font-bold { font-weight: 700; }
    .text-danger { color: #dc2626; font-weight: 600; }
    .text-success { color: #16a34a; }
    .text-muted { color: #94a3b8; }

    /* ── Badges ── */
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge-received { background: #dcfce7; color: #15803d; }
    .badge-pending  { background: #fef3c7; color: #b45309; }
    .badge-danger   { background: #fee2e2; color: #b91c1c; }
    .badge-info     { background: #e0f2fe; color: #0369a1; }
    .badge-warning  { background: #ffedd5; color: #c2410c; }
    .badge-primary  { background: #ede9fe; color: #6d28d9; }
    .badge-neutral  { background: #f1f5f9; color: #475569; }

    /* ── Seed Banner ── */
    .seed-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 14px;
      font-size: 8.5pt;
    }
    .seed-code {
      font-family: "Courier New", Courier, monospace;
      font-size: 9.5pt;
      font-weight: 800;
      color: #1e40af;
      background: #dbeafe;
      padding: 2px 6px;
      border-radius: 3px;
      letter-spacing: 0.05em;
    }

    /* ── Sign-off certification ── */
    .sign-section {
      margin-top: 30px;
      padding-top: 14px;
      border-top: 1px solid #cbd5e1;
      page-break-inside: avoid;
    }
    .cert-text {
      font-size: 8.5pt;
      font-style: italic;
      color: #475569;
      margin-bottom: 24px;
      text-align: justify;
    }
    .signatures-grid {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
    .sig-col {
      width: 42%;
      text-align: center;
    }
    .sig-line {
      border-bottom: 1.5px solid #000;
      margin-bottom: 6px;
      height: 40px;
    }
    .sig-name {
      font-weight: 700;
      font-size: 9.5pt;
      text-transform: uppercase;
      color: #0f172a;
    }
    .sig-title {
      font-size: 8.5pt;
      color: #475569;
    }

    /* ── Print Styles ── */
    @media print {
      body { padding: 12px 18px; }
      .data-table thead { display: table-header-group; }
      .data-table tbody tr { page-break-inside: avoid; }
      .section-title { page-break-after: avoid; }
      .sign-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- Official Header -->
  <div class="header">
    <img src="/BLOGO.png" alt="Barangay 214 Official Logo" />
    <div class="header-text">
      <div class="republic">Republic of the Philippines</div>
      <div class="republic">City of Manila &bull; District II &bull; Zone 20</div>
      <div class="barangay-name">Barangay 214</div>
      <div class="office">Office of the Sangguniang Barangay</div>
    </div>
  </div>

  <!-- Document Title Box -->
  <div class="report-title-box">
    <h1>Beneficiary Selection & Audit Report</h1>
    <div class="subtitle">Official verification and selection record for program distributions &bull; Printed: ${today}</div>
  </div>

  <!-- Program Details Table -->
  <table class="meta-table">
    <tr>
      <td class="meta-label">Program / Form Name:</td>
      <td class="meta-value font-bold">${formName}</td>
      <td class="meta-label">List Methodology:</td>
      <td class="meta-value">${listType}</td>
    </tr>
    <tr>
      <td class="meta-label">Distribution Unit:</td>
      <td class="meta-value">${distributionUnit}</td>
      <td class="meta-label">Distribution Schedule:</td>
      <td class="meta-value">${form?.start_date || "—"} to ${form?.end_date || "—"}</td>
    </tr>
    <tr>
      <td class="meta-label">Quota / Available Goods:</td>
      <td class="meta-value font-bold">${summary?.target_quantity ?? "—"} ${distributionUnit === "Household" ? "Households" : "Beneficiaries"}</td>
      <td class="meta-label">Created By:</td>
      <td class="meta-value">${form?.created_by_name || "Admin"} on ${form?.created_at || "—"}</td>
    </tr>
  </table>

  <!-- KPI Counts Summary -->
  <div class="kpi-container">
    <div class="kpi-card">
      <div class="kpi-num">${summary?.pool_size ?? 0}</div>
      <div class="kpi-label">Eligible Pool</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num" style="color: #002f59;">${summary?.selected_count ?? 0}</div>
      <div class="kpi-label">Selected Beneficiaries</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num" style="color: #64748b;">${summary?.waitlist_count ?? 0}</div>
      <div class="kpi-label">Waitlisted</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num" style="color: #dc2626;">${summary?.removed_count ?? 0}</div>
      <div class="kpi-label">Removed / Disqualified</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num" style="color: #16a34a;">${summary?.rewarded_count ?? 0}</div>
      <div class="kpi-label">Claimed (Received)</div>
    </div>
  </div>

  ${seed ? `
  <!-- Tie-Breaker Seed & Scoring Banner -->
  <div class="seed-box">
    <div>
      <strong>Deterministic Tie-Breaker Seed:</strong>
      <span class="seed-code">${seed}</span>
    </div>
    <div style="color: #3b82f6; font-size: 8pt;">
      Cryptographic seed ensuring verifiable, tamper-proof draw results
    </div>
  </div>
  ` : ""}

  ${Object.keys(factors).length > 0 ? `
  <!-- Priority Factors & Weights -->
  <div class="section-title">Priority Criteria & Factor Weights</div>
  <table class="data-table" style="max-width: 600px; margin-bottom: 16px;">
    <thead>
      <tr>
        <th>Priority Factor</th>
        <th class="col-center">Assigned Weight</th>
        <th class="col-center">Status</th>
      </tr>
    </thead>
    <tbody>
      ${factorRowsHtml}
    </tbody>
  </table>
  ` : ""}

  <!-- Selected Beneficiaries Roster -->
  <div class="section-title">1. Selected Beneficiaries List (${entries?.selected?.length ?? 0})</div>
  <table class="data-table">
    <thead>
      <tr>
        <th class="col-center" style="width: 5%;">#</th>
        <th class="col-center" style="width: 8%;">Rank</th>
        <th style="width: 32%;">Beneficiary Full Name</th>
        <th class="col-center" style="width: 10%;">Score</th>
        <th style="width: 33%;">Matched Criteria Factors</th>
        <th class="col-center" style="width: 12%;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${selectedRowsHtml || '<tr><td colspan="6" class="col-center text-muted">No selected beneficiaries found.</td></tr>'}
    </tbody>
  </table>

  ${(entries?.waitlist?.length || 0) > 0 ? `
  <!-- Waitlist Roster -->
  <div class="section-title">2. Ranked Waitlist Roster (${entries.waitlist.length})</div>
  <table class="data-table">
    <thead>
      <tr>
        <th class="col-center" style="width: 5%;">#</th>
        <th class="col-center" style="width: 8%;">Rank</th>
        <th style="width: 35%;">Resident Full Name</th>
        <th class="col-center" style="width: 12%;">Score</th>
        <th style="width: 40%;">Matched Criteria Factors</th>
      </tr>
    </thead>
    <tbody>
      ${waitlistRowsHtml}
    </tbody>
  </table>
  ` : ""}

  ${(entries?.removed?.length || 0) > 0 ? `
  <!-- Removed Beneficiaries Log -->
  <div class="section-title">3. Removed / Disqualified Entries (${entries.removed.length})</div>
  <table class="data-table">
    <thead>
      <tr>
        <th class="col-center" style="width: 5%;">#</th>
        <th style="width: 25%;">Resident Full Name</th>
        <th class="col-center" style="width: 10%;">Original Rank</th>
        <th style="width: 35%;">Reason for Removal</th>
        <th style="width: 13%;">Processed By</th>
        <th class="col-center" style="width: 12%;">Date / Time</th>
      </tr>
    </thead>
    <tbody>
      ${removedRowsHtml}
    </tbody>
  </table>
  ` : ""}

  ${audit_trail.length > 0 ? `
  <!-- Overrides & Audit Activity Log -->
  <div class="section-title">4. Override Adjustments & Promotion Audit Trail (${audit_trail.length})</div>
  <table class="data-table">
    <thead>
      <tr>
        <th class="col-center" style="width: 5%;">#</th>
        <th style="width: 16%;">Action Type</th>
        <th style="width: 24%;">Affected Resident</th>
        <th style="width: 32%;">Details & Justification</th>
        <th style="width: 11%;">Admin</th>
        <th class="col-center" style="width: 12%;">Timestamp</th>
      </tr>
    </thead>
    <tbody>
      ${auditRowsHtml}
    </tbody>
  </table>
  ` : ""}

  <!-- Certification and Sign-Off -->
  <div class="sign-section">
    <div class="cert-text">
      I HEREBY CERTIFY that the beneficiary selection and ranking recorded above were processed in accordance with
      the enacted criteria and program guidelines of Barangay 214, Zone 20, District II, City of Manila. All tie-breaking
      determinations were established through verifiable pseudo-random seeds, and all removal or override adjustments
      contain documented justifications on file.
    </div>

    <div class="signatures-grid">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">${form?.created_by_name || "Authorized Staff"}</div>
        <div class="sig-title">Program Coordinator / System Administrator</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">Hon. Barangay Captain</div>
        <div class="sig-title">Punong Barangay &bull; Barangay 214</div>
      </div>
    </div>
  </div>

</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=1000,height=800");
  if (!printWindow) {
    alert("Please allow pop-ups for this site to generate the selection report.");
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
};

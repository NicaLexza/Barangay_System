// ResidentStatsModal.jsx
import React, { useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Divider,
  Chip,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BarChartIcon from "@mui/icons-material/BarChart";
import PrintIcon from "@mui/icons-material/Print";

// ── Color palettes (hardcoded — Chart.js cannot read CSS vars) ──────────────
const NAVY        = "#002f59";
const AGE_COLORS  = ["#1e3a5f", "#1d5096", "#2563eb", "#60a5fa", "#bfdbfe"]; // matches DashboardPage.jsx exactly
const COLORS_6    = ["#002f59", "#1d5096", "#2563eb", "#60a5fa", "#93c5fd", "#bfdbfe"];
const COLORS_PIE  = ["#1d4ed8", "#be185d", "#047857", "#92400e", "#6d28d9", "#0f766e"];
const COLORS_SECTOR = ["#7c3aed", "#0369a1", "#16a34a"];
const COLORS_CIVIL  = ["#1d4ed8", "#be185d", "#0f766e", "#92400e", "#dc2626", "#047857"];

// ── Helpers ──────────────────────────────────────────────────────────────────
const calculateAge = (birthDateStr) => {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
};

const countBy = (rows, fn) => {
  const map = {};
  rows.forEach((r) => {
    const key = fn(r);
    if (key != null && key !== "") map[key] = (map[key] || 0) + 1;
  });
  return map;
};

// ── Chart registry so we can destroy before re-creating ──────────────────────
const chartInstances = {};

const buildChart = (id, config) => {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
  const canvas = document.getElementById(id);
  if (!canvas || !window.Chart) return;
  chartInstances[id] = new window.Chart(canvas, config);
};

// ── Single chart panel ────────────────────────────────────────────────────────
const ChartPanel = ({ title, chartId, wrapperHeight = 260, legend }) => (
  <Box
    sx={{
      backgroundColor: "white",
      border: "1px solid #e2e8f0",
      borderRadius: 2,
      p: 2.5,
    }}
  >
    <Typography
      sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#4a5568", letterSpacing: "0.05em", textTransform: "uppercase", mb: 1.5 }}
    >
      {title}
    </Typography>

    {legend && (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", mb: 1.5 }}>
        {legend.map(({ label, color, value }) => (
          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#64748b" }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "2px", backgroundColor: color, flexShrink: 0 }} />
            {label}{value != null ? ` — ${value}` : ""}
          </Box>
        ))}
      </Box>
    )}

    <div style={{ position: "relative", width: "100%", height: `${wrapperHeight}px` }}>
      <canvas
        id={chartId}
        role="img"
        aria-label={`Chart: ${title}`}
      />
    </div>
  </Box>
);

// ── Stat summary pill ─────────────────────────────────────────────────────────
const StatPill = ({ label, value, color }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: "#f7f9fc",
      border: "1px solid #e2e8f0",
      borderRadius: 2,
      px: 2,
      py: 1.5,
      minWidth: 90,
      flex: 1,
    }}
  >
    <Typography sx={{ fontSize: "1.6rem", fontWeight: 700, color: color || NAVY, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
      {value}
    </Typography>
    <Typography sx={{ fontSize: "0.68rem", color: "#64748b", mt: 0.5, textAlign: "center" }}>
      {label}
    </Typography>
  </Box>
);

// ═══════════════════════════════════════════════════════════════════════════════
const ResidentStatsModal = ({ open, onClose, filteredRows = [] }) => {
  const chartLoaded = useRef(false);

  // ── Compute all statistics from filteredRows ──────────────────────────────
  const stats = useMemo(() => {
    const total = filteredRows.length;

    // 1. Age distribution — matches DashboardPage.jsx's 5-bucket taxonomy exactly
    const ageBuckets = {
      "Minor (0–17)": 0,
      "Young Adult (18–30)": 0,
      "Adult (31–45)": 0,
      "Mature (46–60)": 0,
      "Elderly (60+)": 0,
    };
    filteredRows.forEach((r) => {
      const age = calculateAge(r.birthdate);
      if (age === null) return;
      if (age <= 17) ageBuckets["Minor (0–17)"]++;
      else if (age <= 30) ageBuckets["Young Adult (18–30)"]++;
      else if (age <= 45) ageBuckets["Adult (31–45)"]++;
      else if (age <= 60) ageBuckets["Mature (46–60)"]++;
      else ageBuckets["Elderly (60+)"]++;
    });

    // 2. Sex distribution
    const sexMap = countBy(filteredRows, (r) => r.sex);

    // 3. Street distribution (extract street from address "house_no street")
    const streetMap = countBy(filteredRows, (r) => {
      const addr = (r.address || r.street || "").trim();
      const parts = addr.split(" ");
      return parts.length > 1 ? parts.slice(1).join(" ") : addr || "Unknown";
    });

    // 4. Civil status
    const civilMap = countBy(filteredRows, (r) => r.civilStatus || r.civil_status);

    // 5. Employment status
    const employed = filteredRows.filter((r) => r.occupation && r.occupation.trim()).length;
    const unemployed = total - employed;

    // 6. Citizenship
    const citizenMap = countBy(filteredRows, (r) => {
      const c = (r.citizenship || "").trim();
      return c || null;
    });

    // 7. Special sectors — parse "PD, S, SP" style strings + deduplicate
    let pwdCount = 0, seniorCount = 0, solopCount = 0;
    filteredRows.forEach((r) => {
      const sectors = (r.specialSector || "").split(",").map((s) => s.trim());
      if (sectors.includes("PD")) pwdCount++;
      if (sectors.includes("S")) seniorCount++;
      if (sectors.includes("SP")) solopCount++;
    });

    // 8. Household heads — top 10 by member count
    const headRows = filteredRows.filter((r) => r.is_household_head === 1);
    const householdHeadsCount = headRows.length;
    const topHeads = [...headRows]
      .sort((a, b) => (b.household_member_count || 0) - (a.household_member_count || 0))
      .slice(0, 10)
      .map((r) => {
        const fullName = (r.fullName || "").trim();
        const parts = fullName.split(" ").filter(Boolean);
        const surname = parts.length > 0 ? parts[parts.length - 1] : fullName;
        return {
          surname,
          fullName,
          memberCount: r.household_member_count || 1,
        };
      });

    return {
      total,
      ageBuckets,
      sexMap,
      streetMap,
      civilMap,
      employed,
      unemployed,
      citizenMap,
      pwdCount,
      seniorCount,
      solopCount,
      householdHeadsCount,
      topHeads,
    };
  }, [filteredRows]);

  // ── Build all charts after Chart.js loads ─────────────────────────────────
  const buildAllCharts = () => {
    if (!window.Chart) return;

    const { ageBuckets, sexMap, streetMap, civilMap, employed, unemployed, citizenMap,
            pwdCount, seniorCount, solopCount, total, topHeads } = stats;

    // ── 1. Age — Donut ────────────────────────────────────────────────────────
    {
      const labels = Object.keys(ageBuckets);
      const data   = Object.values(ageBuckets);
      buildChart("chart-age", {
        type: "doughnut",
        data: {
          labels,
          datasets: [{ data, backgroundColor: AGE_COLORS, borderWidth: 2, borderColor: "#fff" }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${total ? Math.round((ctx.parsed / total) * 100) : 0}%)`,
              },
            },
          },
        },
      });
    }

    // ── 2. Sex — Horizontal Bar ───────────────────────────────────────────────
    {
      const labels = Object.keys(sexMap);
      const data   = Object.values(sexMap);
      buildChart("chart-sex", {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Count",
            data,
            backgroundColor: COLORS_PIE.slice(0, labels.length),
            borderWidth: 0,
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.x} residents (${total ? Math.round((ctx.parsed.x / total) * 100) : 0}%)`,
              },
            },
          },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } },
            y: { ticks: { font: { size: 12 } }, grid: { display: false } },
          },
        },
      });
    }

    // ── 3. Street — Horizontal Bar ────────────────────────────────────────────
    {
      const sorted = Object.entries(streetMap).sort((a, b) => b[1] - a[1]).slice(0, 12);
      const labels = sorted.map(([k]) => k);
      const data   = sorted.map(([, v]) => v);
      buildChart("chart-street", {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Residents",
            data,
            backgroundColor: NAVY,
            borderWidth: 0,
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } },
            y: { ticks: { font: { size: 11 } }, grid: { display: false } },
          },
        },
      });
    }

    // ── 4. Civil Status — Pie ─────────────────────────────────────────────────
    {
      const labels = Object.keys(civilMap);
      const data   = Object.values(civilMap);
      buildChart("chart-civil", {
        type: "pie",
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: COLORS_CIVIL.slice(0, labels.length),
            borderWidth: 2,
            borderColor: "#fff",
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${total ? Math.round((ctx.parsed / total) * 100) : 0}%)`,
              },
            },
          },
        },
      });
    }

    // ── 5. Employment — Donut ─────────────────────────────────────────────────
    {
      buildChart("chart-employment", {
        type: "doughnut",
        data: {
          labels: ["Employed", "Unemployed"],
          datasets: [{
            data: [employed, unemployed],
            backgroundColor: ["#16a34a", "#94a3b8"],
            borderWidth: 2,
            borderColor: "#fff",
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${total ? Math.round((ctx.parsed / total) * 100) : 0}%)`,
              },
            },
          },
        },
      });
    }

    // ── 6. Citizenship — Horizontal Bar ───────────────────────────────────────
    {
      const sorted = Object.entries(citizenMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const labels = sorted.map(([k]) => k);
      const data   = sorted.map(([, v]) => v);
      buildChart("chart-citizenship", {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Count",
            data,
            backgroundColor: COLORS_6.slice(0, labels.length),
            borderWidth: 0,
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } },
            y: { ticks: { font: { size: 12 } }, grid: { display: false } },
          },
        },
      });
    }

    // ── 7. Special Sectors — Bar ──────────────────────────────────────────────
    {
      buildChart("chart-sectors", {
        type: "bar",
        data: {
          labels: ["Person with Disability", "Senior Citizen", "Solo Parent"],
          datasets: [{
            label: "Count",
            data: [pwdCount, seniorCount, solopCount],
            backgroundColor: COLORS_SECTOR,
            borderWidth: 0,
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } },
            y: { ticks: { font: { size: 11 } }, grid: { display: false } },
          },
        },
      });
    }

    // ── 8. Household Heads — Top 10 by Member Count — Horizontal Bar ─────────
    {
      const labels = topHeads.map((h) => h.surname);
      const data   = topHeads.map((h) => h.memberCount);
      buildChart("chart-household-heads", {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Members",
            data,
            backgroundColor: NAVY,
            borderWidth: 0,
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => {
                  const idx = items[0]?.dataIndex ?? 0;
                  return topHeads[idx]?.fullName || "";
                },
                label: (ctx) => ` ${ctx.parsed.x} member${ctx.parsed.x === 1 ? "" : "s"}`,
              },
            },
          },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: "rgba(0,0,0,0.05)" } },
            y: { ticks: { font: { size: 11 } }, grid: { display: false } },
          },
        },
      });
    }
  };

  useEffect(() => {
    if (!open) return;

    const init = () => {
      if (window.Chart) {
        buildAllCharts();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      script.onload = () => buildAllCharts();
      document.head.appendChild(script);
    };

    // Small delay so the Dialog's DOM is fully painted before Chart.js reads canvas dimensions
    const t = setTimeout(init, 150);
    return () => clearTimeout(t);
  }, [open, stats]);

  // Destroy all charts on unmount
  useEffect(() => {
    return () => {
      Object.keys(chartInstances).forEach((id) => {
        if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
      });
    };
  }, []);

  // ── Print handler ─────────────────────────────────────────────────────────
  const handlePrint = () => {
  const today = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

  const captureCanvas = (id) => {
    const canvas = document.getElementById(id);
    return canvas ? canvas.toDataURL("image/png") : "";
  };

  const buildLegendHtml = (items) =>
    items.map(({ label, color, value }) => `
      <span class="leg-item">
        <span class="leg-swatch" style="background:${color}"></span>
        ${label}${value != null ? ` — <strong>${value}</strong>` : ""}
      </span>
    `).join("");

  const buildChartBlock = (title, canvasId, legendItems) => `
    <div class="chart-block">
      <div class="chart-title">${title}</div>
      <div class="legend">${buildLegendHtml(legendItems)}</div>
      <img src="${captureCanvas(canvasId)}" alt="${title}" />
    </div>
  `;

  const streetEntriesLocal = Object.entries(stats.streetMap).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const citizenEntriesLocal = Object.entries(stats.citizenMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const streetLegendLocal = streetEntriesLocal.map(([label, value]) => ({ label, value, color: NAVY }));
  const citizenLegendLocal = citizenEntriesLocal.map(([label, value], i) => ({ label, value, color: COLORS_6[i] ?? "#888" }));

  const headsLegendLocal = stats.topHeads.slice(0, 5).map((h) => ({ label: h.surname, value: h.memberCount, color: NAVY }))
    .concat(stats.topHeads.length > 5 ? [{ label: `+${stats.topHeads.length - 5} more`, color: "#cbd5e1", value: null }] : []);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Resident Statistics Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 24px 32px; color: #000; background: #fff; }

    .report-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .report-header img { width: 60px; height: 60px; object-fit: contain; }
    .header-text { flex: 1; text-align: center; }
    .header-text h1 { font-size: 15pt; font-weight: bold; text-transform: uppercase; }
    .header-text p { font-size: 9pt; color: #555; margin-top: 2px; }

    .meta { display: flex; justify-content: space-between; font-size: 9pt; color: #555;
      border-top: 2px solid #002f59; border-bottom: 2px solid #002f59;
      padding: 6px 0; margin: 12px 0 20px; }

    .pills { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .pill { background: #f7f9fc; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 10px 16px; text-align: center; flex: 1; min-width: 80px; }
    .pill-val { font-size: 22pt; font-weight: bold; line-height: 1; }
    .pill-lbl { font-size: 8pt; color: #64748b; margin-top: 4px; }

    .row3 { display: grid; gap: 14px; margin-bottom: 14px; }
    .row3-col { grid-template-columns: 1fr 1fr 1fr; }
    .row3-col2 { grid-template-columns: 1fr 1fr; }
    .row3-col1 { grid-template-columns: 1fr; }

    .chart-block { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .chart-title { font-size: 8pt; font-weight: bold; letter-spacing: 0.05em;
      text-transform: uppercase; color: #4a5568; margin-bottom: 8px; }
    .legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 10px; }
    .leg-item { display: flex; align-items: center; gap: 5px; font-size: 9pt; color: #64748b; }
    .leg-swatch { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; display: inline-block; }
    .chart-block img { width: 100%; border-radius: 4px; display: block; }

    .print-footer { margin-top: 24px; font-size: 8pt; color: #999;
      text-align: center; border-top: 1px solid #ddd; padding-top: 8px; }

    @media print {
      body { padding: 16px 20px; }
      .row3 { break-inside: avoid; }
      .chart-block { break-inside: avoid; }
    }
  </style>
</head>
<body>

  <div class="report-header">
    <img src="/BLOGO.png" alt="Barangay Logo" />
    <div class="header-text">
      <p>Republic of the Philippines — City of Manila — District II — Zone 20</p>
      <h1>Barangay 214</h1>
      <p>Resident Profiling and Management System</p>
    </div>
    <img src="/BLOGO.png" alt="Barangay Logo" />
  </div>

  <div class="meta">
    <span>Statistical Report — Resident Records</span>
    <span>Total Records in View: <strong>${stats.total}</strong></span>
    <span>Date: ${today}</span>
  </div>

  <div class="pills">
    <div class="pill"><div class="pill-val" style="color:#002f59">${stats.total}</div><div class="pill-lbl">Total Records</div></div>
    <div class="pill"><div class="pill-val" style="color:#16a34a">${stats.employed}</div><div class="pill-lbl">Employed</div></div>
    <div class="pill"><div class="pill-val" style="color:#64748b">${stats.unemployed}</div><div class="pill-lbl">Unemployed</div></div>
    <div class="pill"><div class="pill-val" style="color:#7c3aed">${stats.pwdCount}</div><div class="pill-lbl">PWD</div></div>
    <div class="pill"><div class="pill-val" style="color:#0369a1">${stats.seniorCount}</div><div class="pill-lbl">Senior Citizen</div></div>
    <div class="pill"><div class="pill-val" style="color:#16a34a">${stats.solopCount}</div><div class="pill-lbl">Solo Parent</div></div>
    <div class="pill"><div class="pill-val" style="color:#1d4ed8">${stats.householdHeadsCount}</div><div class="pill-lbl">Household Heads</div></div>
  </div>

  <div class="row3 row3-col">
    ${buildChartBlock("Age distribution", "chart-age", ageLegend)}
    ${buildChartBlock("Sex distribution", "chart-sex", sexLegend)}
    ${buildChartBlock("Employment status", "chart-employment", [
      { label: "Employed",   color: "#16a34a", value: stats.employed },
      { label: "Unemployed", color: "#94a3b8", value: stats.unemployed },
    ])}
  </div>

  <div class="row3 row3-col2">
    ${buildChartBlock("Civil status distribution", "chart-civil", civilLegend)}
    ${buildChartBlock("Special sector distribution", "chart-sectors", sectorLegend)}
  </div>

  <div class="row3 row3-col1">
    ${buildChartBlock(
      "Residents per street (top 12)",
      "chart-street",
      streetLegendLocal.slice(0, 5).concat(streetLegendLocal.length > 5 ? [{ label: `+${streetLegendLocal.length - 5} more`, color: "#cbd5e1", value: null }] : [])
    )}
  </div>

  <div class="row3 row3-col1">
    ${buildChartBlock("Citizenship distribution", "chart-citizenship", citizenLegendLocal)}
  </div>

  <div class="row3 row3-col1">
    ${buildChartBlock("Household heads by member count (top 10)", "chart-household-heads", headsLegendLocal)}
  </div>

  <div class="print-footer">
    For Official Use Only — Barangay 214, Zone 20, District II, City of Manila
  </div>

</body>
</html>`;

  const w = window.open("", "_blank", "width=1000,height=800");
  if (!w) { alert("Please allow pop-ups to use the print feature."); return; }
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.print(); w.close(); };
};
  // ── Legend data derived from stats ────────────────────────────────────────
  const ageLegend = [
    { label: "Minor (0–17)",        color: AGE_COLORS[0], value: stats.ageBuckets["Minor (0–17)"] },
    { label: "Young Adult (18–30)", color: AGE_COLORS[1], value: stats.ageBuckets["Young Adult (18–30)"] },
    { label: "Adult (31–45)",       color: AGE_COLORS[2], value: stats.ageBuckets["Adult (31–45)"] },
    { label: "Mature (46–60)",      color: AGE_COLORS[3], value: stats.ageBuckets["Mature (46–60)"] },
    { label: "Elderly (60+)",       color: AGE_COLORS[4], value: stats.ageBuckets["Elderly (60+)"] },
  ];

  const sexLegend = Object.entries(stats.sexMap).map(([label, value], i) => ({
    label, value, color: COLORS_PIE[i] ?? "#888",
  }));

  const civilLegend = Object.entries(stats.civilMap).map(([label, value], i) => ({
    label, value, color: COLORS_CIVIL[i] ?? "#888",
  }));

  const sectorLegend = [
    { label: "PWD", color: "#7c3aed", value: stats.pwdCount },
    { label: "Senior Citizen", color: "#0369a1", value: stats.seniorCount },
    { label: "Solo Parent", color: "#16a34a", value: stats.solopCount },
  ];

  const streetEntries = Object.entries(stats.streetMap).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const streetLegend = streetEntries.map(([label, value]) => ({ label, value, color: NAVY }));

  const citizenEntries = Object.entries(stats.citizenMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const citizenLegend = citizenEntries.map(([label, value], i) => ({ label, value, color: COLORS_6[i] ?? "#888" }));

  const headsLegend = stats.topHeads.slice(0, 5).map((h) => ({ label: h.surname, value: h.memberCount, color: NAVY }))
    .concat(stats.topHeads.length > 5 ? [{ label: `+${stats.topHeads.length - 5} more`, color: "#cbd5e1", value: null }] : []);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: "92vw",
          maxWidth: "1200px",
          maxHeight: "92vh",
          borderRadius: 3,
        },
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e2e8f0",
          pb: 1.5,
          pt: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <BarChartIcon sx={{ color: NAVY, fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: NAVY, letterSpacing: "-0.01em" }}>
              Resident Statistics
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>
              Based on current filtered view
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={`${stats.total} records`}
            size="small"
            sx={{ backgroundColor: "#e8f0f8", color: NAVY, fontWeight: 600, fontSize: "0.7rem" }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{
              textTransform: "none",
              borderColor: NAVY,
              color: NAVY,
              fontSize: "0.78rem",
              "&:hover": { backgroundColor: "#e8f0f8" },
            }}
          >
            Print Report
          </Button>
          <IconButton size="small" onClick={onClose} sx={{ color: "#94a3b8" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <DialogContent sx={{ p: 3, backgroundColor: "#f7f9fc", overflowY: "auto" }}>

        <Box sx={{ display: "flex", gap: 1.5, mb: 2, pt: 2, flexWrap: "wrap" }}>
          <StatPill label="Total Records"  value={stats.total}       color={NAVY} />
          <StatPill label="Employed"       value={stats.employed}    color="#16a34a" />
          <StatPill label="Unemployed"     value={stats.unemployed}  color="#64748b" />
          <StatPill label="PWD"            value={stats.pwdCount}    color="#7c3aed" />
          <StatPill label="Senior Citizen" value={stats.seniorCount} color="#0369a1" />
          <StatPill label="Solo Parent"    value={stats.solopCount}  color="#16a34a" />
          <StatPill label="Household Heads" value={stats.householdHeadsCount} color="#1d4ed8" />
        </Box>

        {/* Row 1 */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2 }}>
          <ChartPanel title="Age distribution"  chartId="chart-age"        wrapperHeight={240} legend={ageLegend} />
          <ChartPanel title="Sex distribution"  chartId="chart-sex"        wrapperHeight={240} legend={sexLegend} />
          <ChartPanel title="Employment status" chartId="chart-employment" wrapperHeight={240} legend={[
            { label: "Employed",   color: "#16a34a", value: stats.employed },
            { label: "Unemployed", color: "#94a3b8", value: stats.unemployed },
          ]} />
        </Box>

        {/* Row 2 */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
          <ChartPanel title="Civil status distribution"   chartId="chart-civil"   wrapperHeight={260} legend={civilLegend} />
          <ChartPanel title="Special sector distribution" chartId="chart-sectors" wrapperHeight={260} legend={sectorLegend} />
        </Box>

        {/* Row 3 */}
        <Box sx={{ mb: 2 }}>
          <ChartPanel
            title="Residents per street (top 12)"
            chartId="chart-street"
            wrapperHeight={Math.max(200, Math.min(streetEntries.length, 12) * 38 + 60)}
            legend={streetLegend.slice(0, 5).concat(streetLegend.length > 5 ? [{ label: `+${streetLegend.length - 5} more`, color: "#cbd5e1" }] : [])}
          />
        </Box>

        {/* Row 4 */}
        <Box sx={{ mb: 2 }}>
          <ChartPanel
            title="Citizenship distribution"
            chartId="chart-citizenship"
            wrapperHeight={Math.max(120, Math.min(citizenEntries.length, 8) * 38 + 60)}
            legend={citizenLegend}
          />
        </Box>

        {/* Row 5 */}
        <Box>
          <ChartPanel
            title="Household heads by member count (top 10)"
            chartId="chart-household-heads"
            wrapperHeight={Math.max(200, Math.min(stats.topHeads.length, 10) * 38 + 60)}
            legend={headsLegend}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e2e8f0", backgroundColor: "white" }}>
        <Typography sx={{ flex: 1, fontSize: "0.72rem", color: "#94a3b8" }}>
          Charts auto-adjust to the active filter selection in the Residents table.
        </Typography>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "#64748b" }}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          startIcon={<PrintIcon />}
          sx={{ textTransform: "none", backgroundColor: NAVY, "&:hover": { backgroundColor: "#001c38" } }}
        >
          Print Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResidentStatsModal;
import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box, IconButton, Typography, Chip,
  Select, MenuItem, FormControl,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import axios from "axios";
import DeleteEligibilityFormEntriesModal from "../../modals/DeleteEligibilityFormEntriesModal";
import EligibilityEntriesToolbar from "./EligiblitiyEntriesToolbar";
import InfoPopper from "../../Reusables/InfoPopper.jsx";
import ReAuthModal from "../../modals/ReAuthModal.jsx";

// Safely turns the entry's `score_breakdown` TEXT column (a JSON array of
// { factor, label, units, weight, points }, or null for unranked/case-1
// entries) into an array. Never throws — a malformed value just renders
// as "no priority factors matched" instead of breaking the tab.
const parseBreakdown = (raw) => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const EligibilityEntriesTable = () => {
  const { formId } = useParams();
  const { state } = useLocation();

  const isDisabled = state?.is_disabled ?? false;

  const [rows, setRows] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({ rewardedStatus: 'All' });

  // "Selected" | "Waitlisted" — which selection_status the grid currently
  // shows. Case-1 ("All Eligible") forms have every entry as Selected, so
  // the Waitlist tab is simply empty for them rather than hidden — a form
  // that used to have a waitlist (before entries were promoted/removed)
  // should stay reachable too.
  const [activeTab, setActiveTab] = useState("Selected");

  // Reversal (Received -> Pending) re-auth flow — Pending -> Received never
  // goes through this, it's applied directly via handleStatusChange below.
  // The backend independently re-verifies these credentials too (not just
  // a UI gate) — see eligibilityFormEntriesUpdateController.js.
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [reAuthLoading, setReAuthLoading] = useState(false);
  const [reAuthError, setReAuthError] = useState("");
  const [pendingReversalEntryId, setPendingReversalEntryId] = useState(null);

  const infoOpen = Boolean(infoAnchorEl);

  const handleInfoEnter = (event, row) => {
    setSelectedRow(row);
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoLeave = () => setInfoAnchorEl(null);

  // Forward change only (Pending -> Received, or any change that isn't a
  // Received -> Pending reversal). No credentials needed here.
  const handleStatusChange = async (entryId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/eligibility-forms/entries/${entryId}/status`,
        { is_rewarded: newStatus === "received" ? 1 : 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to update entry status:", err);
    }
  };

  // Select's onChange — routes a Received -> Pending change through the
  // re-auth modal instead of applying it directly.
  const handleSelectChange = (row, newStatus) => {
    const wasReceived = row.is_rewarded === 1;
    const isReversal = wasReceived && newStatus === "pending";

    if (isReversal) {
      setPendingReversalEntryId(row.entry_id);
      setReAuthError("");
      setReAuthOpen(true);
      return;
    }

    handleStatusChange(row.entry_id, newStatus);
  };

  const handleReAuthClose = () => {
    if (reAuthLoading) return;
    setReAuthOpen(false);
    setPendingReversalEntryId(null);
    setReAuthError("");
  };

  const handleReAuthConfirm = async ({ username, password }) => {
    if (!pendingReversalEntryId) return;
    setReAuthLoading(true);
    setReAuthError("");

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/eligibility-forms/entries/${pendingReversalEntryId}/status`,
        { is_rewarded: 0, username, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReAuthOpen(false);
      setPendingReversalEntryId(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      setReAuthError(err.response?.data?.message || "Failed to revert status. Please try again.");
    } finally {
      setReAuthLoading(false);
    }
  };

  const handleApplyFilters = (newFilters) => setFilters(newFilters);

  // Split by tab first, then apply search + (Selected-tab-only) status filter.
  const tabRows = useMemo(
    () => rows.filter((row) => row.selection_status === activeTab),
    [rows, activeTab]
  );

  const filteredRows = tabRows.filter((row) => {
    if (searchValue) {
      const search = searchValue.toLowerCase();
      const matchesSearch = row.fullName?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    // The Received/Pending quick filter only means something on the
    // Selected tab — waitlisted entries are never marked received.
    if (activeTab === "Selected") {
      if (filters.rewardedStatus === 'Received' && row.is_rewarded !== 1) return false;
      if (filters.rewardedStatus === 'Pending' && row.is_rewarded !== 0) return false;
    }
    return true;
  });

  // Renumber within the current tab/filter view rather than trusting a
  // number assigned at fetch time, so "No." / "Rank" always starts at 1
  // for whatever's actually on screen.
  const displayRows = useMemo(
    () => filteredRows.map((row, idx) => ({ ...row, no: idx + 1 })),
    [filteredRows]
  );

  const selectedCount = useMemo(
    () => rows.filter((r) => r.selection_status === "Selected").length,
    [rows]
  );
  const waitlistCount = useMemo(
    () => rows.filter((r) => r.selection_status === "Waitlisted").length,
    [rows]
  );

  // ── Print handler ────────────────────────────────────────────────────────
  // Always prints the Selected roster — regardless of which tab is
  // currently on screen or the Received/Pending quick filter — since this
  // is the physical signature sheet handed out at distribution. Waitlisted
  // residents haven't received anything and must never appear on it (see
  // handoff item: "signature sheet doesn't yet filter out Waitlisted").
  // The search box still narrows it, since that's a deliberate "print just
  // this subset" action.
  const handlePrint = () => {
    const printableRows = rows
      .filter((row) => row.selection_status === "Selected")
      .filter((row) => {
        if (!searchValue) return true;
        return row.fullName?.toLowerCase().includes(searchValue.toLowerCase());
      })
      .map((row, idx) => ({ ...row, no: idx + 1 }));

    const formName = state?.form_name || 'Eligibility Form';
    const today = new Date().toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const rowsHtml = printableRows
      .map(
        (row) => `
          <tr>
            <td class="col-no">${row.no}</td>
            <td class="col-name">${row.fullName || ''}</td>
            <td class="col-status">
              <div class="checkbox-cell">
                <span class="checkbox-box"></span>
                <span class="checkbox-label">Received</span>
              </div>
            </td>
            <td class="col-sig"></td>
          </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${formName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      color: #000;
      background: #fff;
      padding: 24px 32px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .header img {
      width: 70px;
      height: 70px;
      object-fit: contain;
    }
    .header-text {
      flex: 1;
      text-align: center;
    }
    .header-text .republic {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .header-text .barangay-name {
      font-size: 15pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .header-text .address {
      font-size: 9pt;
      color: #444;
    }

    /* ── Form title ── */
    .form-title-section {
      text-align: center;
      margin: 12px 0 6px;
      border-top: 2px solid #002f59;
      border-bottom: 2px solid #002f59;
      padding: 6px 0;
    }
    .form-title-section .label {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #555;
    }
    .form-title-section .form-name {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #002f59;
    }

    /* ── Meta row ── */
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: #555;
      margin: 8px 0 14px;
    }

    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead tr {
      background-color: #002f59;
      color: #fff;
    }
    thead th {
      padding: 8px 10px;
      text-align: left;
      font-size: 10pt;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    tbody tr {
      border-bottom: 1px solid #d0d7e3;
    }
    tbody tr:nth-child(even) {
      background-color: #f4f7fb;
    }
    tbody td {
      padding: 9px 10px;
      font-size: 10pt;
      vertical-align: middle;
    }

    .col-no   { width: 6%; text-align: center; }
    .col-name { width: 40%; }
    .col-status { width: 18%; }
    .col-sig  { width: 36%; }

    /* ── Signature line — only on data rows, not the header ── */
    tbody td.col-sig { border-bottom: 1px solid #555; }

    /* ── Checkbox styling ── */
    .checkbox-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .checkbox-box {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 1.5px solid #333;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .checkbox-label {
      font-size: 9.5pt;
      color: #444;
    }

    /* ── Footer ── */
    .print-footer {
      margin-top: 32px;
      font-size: 8.5pt;
      color: #777;
      text-align: center;
      border-top: 1px solid #ccc;
      padding-top: 8px;
    }

    @media print {
      body { padding: 16px 24px; }
      thead { display: table-header-group; }
      tbody tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <img src="/BLOGO.png" alt="Barangay Logo" />
    <div class="header-text">
      <div class="republic">Republic of the Philippines</div>
      <div class="republic">City of Manila &bull; District II &bull; Zone 20</div>
      <div class="barangay-name">Barangay 214</div>
      <div class="address">Office of the Barangay Council</div>
    </div>
    <img src="/BLOGO.png" alt="Barangay Logo" />
  </div>

  <!-- Form title -->
  <div class="form-title-section">
    <div class="label">Eligibility Form</div>
    <div class="form-name">${formName}</div>
  </div>

  <!-- Meta -->
  <div class="meta-row">
    <span>Date Printed: ${today}</span>
    <span>Total Recipients: ${printableRows.length}</span>
  </div>

  <!-- Table -->
  <table>
    <thead>
      <tr>
        <th class="col-no">No.</th>
        <th class="col-name">Name</th>
        <th class="col-status">Status</th>
        <th class="col-sig">Signature</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="print-footer">
    Resident Profiling and Management System &bull; Barangay 214, Zone 20, District II, City of Manila &bull; For Official Use Only
  </div>

</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow pop-ups for this site to use the print feature.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Give images a moment to load before triggering print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  // ── Columns — Selected tab (unchanged behavior: status toggle, delete, signature) ──
  const selectedColumns = useMemo(
    () => [
      { field: "no", headerName: "No.", width: 90, sortable: false },
      { field: "fullName", headerName: "Full Name", width: 380 },
      {
        field: "is_rewarded",
        headerName: "Status",
        width: 250,
        renderCell: (params) => (
          <FormControl size="small" sx={{ minWidth: 120, mt: .75 }}>
            <Select
              variant="outlined"
              value={params.row.is_rewarded === 1 ? "received" : "pending"}
              onChange={(e) => handleSelectChange(params.row, e.target.value)}
              disabled={isDisabled}
              onClick={(e) => e.stopPropagation()}
              sx={{
                fontSize: "0.875rem",
                color: params.row.is_rewarded === 1 ? "#2e7d32" : "#999",
                fontWeight: 500,
              }}
            >
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>
        ),
      },
      {
        field: "signature",
        headerName: "Signature",
        width: 300,
        sortable: false,
        renderCell: () => (
          <Box
            sx={{
              width: "80%",
              borderBottom: "1px solid #333",
              height: "100%",
              display: "flex",
              alignItems: "flex-end",
              pb: 0.5,
            }}
          />
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        disableColumnMenu: true,
        renderCell: (params) => {
          const row = params.row;
          return (
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <IconButton
                size="small"
                color="error"
                disabled={isDisabled}
                onClick={() => { setSelectedRow(row); setDeleteOpen(true); }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onMouseEnter={(e) => handleInfoEnter(e, row)}
                onMouseLeave={handleInfoLeave}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        },
      },
    ],
    [isDisabled]
  );

  // ── Columns — Waitlist tab (read-only: rank, score, why-not breakdown) ──
  const waitlistColumns = useMemo(
    () => [
      {
        field: "no",
        headerName: "Rank",
        width: 90,
        sortable: false,
        renderCell: (params) => (
          <Chip
            size="small"
            label={`#${params.row.rank_no ?? params.row.no}`}
            sx={{ fontWeight: 700, backgroundColor: "#f1f5f9", color: "#475569" }}
          />
        ),
      },
      { field: "fullName", headerName: "Full Name", width: 300 },
      {
        field: "priority_score",
        headerName: "Score",
        width: 100,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {params.row.priority_score ?? "—"}
          </Typography>
        ),
      },
      {
        field: "breakdown",
        headerName: "Why waitlisted",
        flex: 1,
        minWidth: 260,
        sortable: false,
        renderCell: (params) => {
          const items = params.row.breakdown || [];
          if (items.length === 0) {
            return (
              <Typography sx={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                No priority factors matched
              </Typography>
            );
          }
          const text = items.map((b) => `${b.label} +${b.points}`).join(", ");
          return (
            <Typography sx={{ fontSize: "0.8rem", color: "#4a5568" }} noWrap title={text}>
              {text}
            </Typography>
          );
        },
      },
      {
        field: "actions",
        headerName: "",
        width: 60,
        disableColumnMenu: true,
        sortable: false,
        renderCell: (params) => (
          <IconButton
            size="small"
            onMouseEnter={(e) => handleInfoEnter(e, params.row)}
            onMouseLeave={handleInfoLeave}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    []
  );

  const columns = activeTab === "Selected" ? selectedColumns : waitlistColumns;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/eligibility-forms/${formId}/entries`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const fetchedRows = res.data.map((entry) => ({
          id: entry.entry_id,
          entry_id: entry.entry_id,
          fullName: [entry.f_name, entry.m_name, entry.l_name, entry.suffix]
            .filter(Boolean)
            .join(" "),
          is_rewarded: entry.is_rewarded,
          processed_by_name: entry.processed_by_name,
          processed_at: entry.processed_at,
          // Older entries created before migration 02 have no
          // selection_status at all — treat those as Selected, matching
          // what they always meant before ranked forms existed.
          selection_status: entry.selection_status || "Selected",
          priority_score: entry.priority_score,
          rank_no: entry.rank_no,
          breakdown: parseBreakdown(entry.score_breakdown),
          selection_note: entry.selection_note,
        }));

        setRows(fetchedRows);
      } catch (err) {
        console.error("Failed to fetch entries:", err);
      }
    };

    fetchEntries();
  }, [formId, refreshKey]);

  // If a form has no waitlist at all and the tab was left on "Waitlisted"
  // from a previous form (route params changed without unmounting), snap
  // back to "Selected" rather than showing a permanently empty grid.
  useEffect(() => {
    if (activeTab === "Waitlisted" && waitlistCount === 0 && rows.length > 0) {
      setActiveTab("Selected");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DataGrid
        rows={displayRows}
        columns={columns}
        getRowId={(row) => row.id}
        hideFooter
        showToolbar
        sx={{ flex: 1, minHeight: 0 }}
        slots={{ toolbar: EligibilityEntriesToolbar }}
        slotProps={{
          toolbar: {
            onApplyFilters: handleApplyFilters,
            onSearchChange: (value) => setSearchValue(value),
            onPrint: handlePrint,
            formName: state?.form_name,
            entryCount: displayRows.length,
            isArchived: state?.is_archived ?? false,
            activeTab,
            onTabChange: setActiveTab,
            selectedCount,
            waitlistCount,
          },
        }}
      />

      {/* Info Popper */}
      <InfoPopper
        open={infoOpen}
        anchorEl={infoAnchorEl}
        fields={
          activeTab === "Selected"
            ? [
                { label: "Processed by", value: selectedRow?.processed_by_name },
                { label: "Processed at", value: selectedRow?.processed_at },
              ]
            : [
                { label: "Rank", value: selectedRow?.rank_no },
                { label: "Score", value: selectedRow?.priority_score },
              ]
        }
      />

      {/* Delete Modal — Selected tab only */}
      <DeleteEligibilityFormEntriesModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedRow(null); }}
        onConfirm={() => setRefreshKey((prev) => prev + 1)}
        target={selectedRow}
      />

      {/* Reversal re-auth — only triggered by a Received -> Pending change.
          Backend independently re-verifies these credentials as well. */}
      <ReAuthModal
        open={reAuthOpen}
        onClose={handleReAuthClose}
        onConfirm={handleReAuthConfirm}
        loading={reAuthLoading}
        error={reAuthError}
        title="Confirm Status Reversal"
        description="Reverting a Received status back to Pending requires admin confirmation. Enter your admin credentials to proceed."
        confirmLabel="Revert to Pending"
        confirmColor="error"
      />
    </Box>
  );
};

export default EligibilityEntriesTable;
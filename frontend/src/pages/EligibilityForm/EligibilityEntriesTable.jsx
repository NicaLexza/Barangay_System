import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box, IconButton, Popper, Paper, Typography,
  Select, MenuItem, FormControl,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import axios from "axios";
import DeleteEligibilityFormEntriesModal from "../../modals/DeleteEligibilityFormEntriesModal";
import EligibilityEntriesToolbar from "./EligiblitiyEntriesToolbar";

const EligibilityEntriesTable = () => {
  const { formId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const isDisabled = state?.is_disabled ?? false;

  const [rows, setRows] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({ rewardedStatus: 'All' });

  const infoOpen = Boolean(infoAnchorEl);

  const handleInfoEnter = (event, row) => {
    setSelectedRow(row);
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoLeave = () => setInfoAnchorEl(null);

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

  const handleApplyFilters = (newFilters) => setFilters(newFilters);

  const filteredRows = rows.filter((row) => {
    if (searchValue) {
      const search = searchValue.toLowerCase();
      const matchesSearch = row.fullName?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    if (filters.rewardedStatus === 'Received' && row.is_rewarded !== 1) return false;
    if (filters.rewardedStatus === 'Pending'  && row.is_rewarded !== 0) return false;
    return true;
  });

  // ── Print handler ────────────────────────────────────────────────────────
  const handlePrint = () => {
    const formName = state?.form_name || 'Eligibility Form';
    const today = new Date().toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const rowsHtml = filteredRows
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
    <span>Total Entries: ${filteredRows.length}</span>
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

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns = [
    { field: "no",       headerName: "No.",       width: 100, sortable: false },
    { field: "fullName", headerName: "Full Name",  width: 380 },
    {
      field: "is_rewarded",
      headerName: "Status",
      width: 250,
      renderCell: (params) => (
        <FormControl size="small" sx={{ minWidth: 120, mt: .75 }}>
          <Select
            variant="outlined"
            value={params.row.is_rewarded === 1 ? "received" : "pending"}
            onChange={(e) => handleStatusChange(params.row.entry_id, e.target.value)}
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
  ];

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/eligibility-forms/${formId}/entries`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const fetchedRows = res.data.map((entry, index) => ({
          id: entry.entry_id,
          entry_id: entry.entry_id,
          no: index + 1,
          fullName: [entry.f_name, entry.m_name, entry.l_name, entry.suffix]
            .filter(Boolean)
            .join(" "),
          is_rewarded: entry.is_rewarded,
          processed_by_name: entry.processed_by_name,
          processed_at: entry.processed_at,
        }));

        setRows(fetchedRows);
      } catch (err) {
        console.error("Failed to fetch entries:", err);
      }
    };

    fetchEntries();
  }, [formId, refreshKey]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DataGrid
        rows={filteredRows}
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
            entryCount: filteredRows.length,
            isArchived: state?.is_archived ?? false,
          },
        }}
      />

      {/* Info Popper */}
      <Popper open={infoOpen} anchorEl={infoAnchorEl} placement="left-start" disablePortal>
        <Paper elevation={3} sx={{ p: 1, maxWidth: 220 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>INFO</Typography>
          <Typography variant="body2">Processed by: {selectedRow?.processed_by_name || "N/A"}</Typography>
          <Typography variant="body2">Processed at: {selectedRow?.processed_at || "N/A"}</Typography>
        </Paper>
      </Popper>

      {/* Delete Modal */}
      <DeleteEligibilityFormEntriesModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedRow(null); }}
        onConfirm={() => setRefreshKey((prev) => prev + 1)}
        target={selectedRow}
      />
    </Box>
  );
};

export default EligibilityEntriesTable;
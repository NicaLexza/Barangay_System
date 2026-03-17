import { useState, useEffect } from "react";
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
    // Search
    if (searchValue) {
      const search = searchValue.toLowerCase();
      const matchesSearch = row.fullName?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.rewardedStatus === 'Received' && row.is_rewarded !== 1) return false;
    if (filters.rewardedStatus === 'Pending'  && row.is_rewarded !== 0) return false;

    return true;
  });

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

  return (
    <Box sx={{ height: 550, width: 1600 }}>
      <DataGrid
        rows={filteredRows}
        columns={columns}
        getRowId={(row) => row.id}
        hideFooter
        showToolbar
        slots={{ toolbar: EligibilityEntriesToolbar }}
        slotProps={{
          toolbar: {
            onApplyFilters: handleApplyFilters,
            onSearchChange: (value) => setSearchValue(value),
            formName: state?.form_name,
            entryCount: filteredRows.length,
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
// ImportResidentModal.jsx
import React, { useState, useRef, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Stack, Divider, Chip,
  CircularProgress, IconButton, Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import UpdateIcon from "@mui/icons-material/Update";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";

const STATUS_COLORS = {
  green:  "#4caf50",
  yellow: "#f9a825",
  red:    "#f44336",
  error:  "#9c27b0",
};

const StatusDot = ({ row }) => {
  const color = !row.enabled ? "#bdbdbd" : (STATUS_COLORS[row.status] || "#bdbdbd");
  return (
    <Tooltip title={row.statusReason || row.status} placement="right">
      <Box sx={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
    </Tooltip>
  );
};

const ImportResidentModal = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewSummary, setPreviewSummary] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setUploadError(""); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setUploadError(""); }
  };

  const handleUpload = async () => {
    if (!file) { setUploadError("Please select a file first."); return; }
    setPreviewLoading(true);
    setUploadError("");
    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post(
        "http://localhost:5000/api/residents/import-preview",
        form,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      setPreviewRows(res.data.rows);
      setPreviewSummary(res.data.summary);
      setStep(1);
    } catch (err) {
      setUploadError(err.response?.data?.message || "Failed to parse file. Please try again.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleRow = useCallback((id) => {
    setPreviewRows((prev) =>
      prev.map((r) => (r._id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  const deleteRow = useCallback((id) => {
    setPreviewRows((prev) => prev.filter((r) => r._id !== id));
  }, []);

  const processRowUpdate = useCallback((newRow) => {
    setPreviewRows((prev) => prev.map((r) => (r._id === newRow._id ? newRow : r)));
    return newRow;
  }, []);

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/residents/import-confirm",
        { rows: previewRows },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImportResult(res.data);
      setStep(2);
      onSuccess?.();
    } catch (err) {
      setImportResult({ error: err.response?.data?.message || "Import failed." });
      setStep(2);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setFile(null);
    setPreviewRows([]);
    setPreviewSummary(null);
    setImportResult(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const liveCounts = previewRows.reduce(
    (acc, r) => {
      if (!r.enabled) return acc;
      if (r.status === "green") acc.green++;
      else if (r.status === "yellow") acc.yellow++;
      return acc;
    },
    { green: 0, yellow: 0 }
  );
  const totalSelected = liveCounts.green + liveCounts.yellow;

  const columns = [
    {
      field: "_status", headerName: "", width: 36, sortable: false, disableColumnMenu: true,
      renderCell: (params) => <StatusDot row={params.row} />,
    },
    { field: "_rowNumber", headerName: "Row",         width: 60,  sortable: false },
    { field: "f_name",     headerName: "First Name",  width: 130, editable: true },
    { field: "m_name",     headerName: "Middle Name", width: 130, editable: true },
    { field: "l_name",     headerName: "Last Name",   width: 130, editable: true },
    { field: "suffix",     headerName: "Suffix",      width: 80,  editable: true },
    { field: "sex",        headerName: "Sex",         width: 80 },
    { field: "birthdate",  headerName: "Birthdate",   width: 110 },
    { field: "birthplace", headerName: "Birthplace",  width: 130, editable: true },
    { field: "house_no",   headerName: "House No.",   width: 110, editable: true },
    { field: "street",     headerName: "Street",      width: 130, editable: true },
    { field: "civil_status", headerName: "Civil Status", width: 120 },
    { field: "occupation", headerName: "Occupation",  width: 140, editable: true },
    { field: "citizenship",headerName: "Citizenship", width: 120, editable: true },
    {
      field: "is_pwd", headerName: "PWD", width: 70,
      valueGetter: (value) => (value ? "Yes" : "No"),
    },
    {
      field: "is_senior", headerName: "Senior", width: 80,
      valueGetter: (value) => (value ? "Yes" : "No"),
    },
    {
      field: "is_solop", headerName: "Solo Parent", width: 95,
      valueGetter: (value) => (value ? "Yes" : "No"),
    },
    {
      field: "_actions", headerName: "Actions", width: 90, sortable: false, disableColumnMenu: true,
      renderCell: (params) => {
        const row = params.row;
        const isFixed = row.status === "red" || row.status === "error";
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title={row.enabled ? "Exclude from import" : "Include in import"}>
              <span>
                <IconButton
                  size="small"
                  disabled={isFixed}
                  onClick={() => toggleRow(row._id)}
                  sx={{ color: row.enabled ? "#1976d2" : "#bdbdbd" }}
                >
                  {row.enabled ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Remove from this import">
              <IconButton size="small" color="error" onClick={() => deleteRow(row._id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const dialogProps =
    step === 1
      ? { maxWidth: false, fullWidth: true, sx: { "& .MuiDialog-paper": { width: "96vw", height: "92vh" } } }
      : { maxWidth: "sm", fullWidth: true };

  return (
    <Dialog open={open} onClose={handleClose} {...dialogProps}>

      {/* STEP 0: Upload */}
      {step === 0 && (
        <>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1 }}>
            Import Residents — Upload File
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 3 }}>
            <Stack spacing={2.5}>
              <Box sx={{ backgroundColor: "#e3f2fd", borderRadius: 2, p: 2 }}>
                <Typography variant="body2" color="#0d47a1" fontWeight={600} mb={0.5}>Instructions</Typography>
                <Typography variant="body2" color="#1565c0">
                  Export your Google Form responses as <strong>.xlsx</strong> or <strong>.csv</strong> and upload it here.
                  You will be able to review and edit entries before confirming the import.
                </Typography>
              </Box>

              <Box
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: "2px dashed #90a4ae", borderRadius: 2, p: 4,
                  textAlign: "center", cursor: "pointer",
                  backgroundColor: file ? "#f1f8e9" : "#fafafa",
                  "&:hover": { backgroundColor: "#e3f2fd" },
                  transition: "background 0.2s",
                }}
              >
                <UploadFileIcon sx={{ fontSize: 48, color: file ? "#388e3c" : "#90a4ae", mb: 1 }} />
                {file ? (
                  <>
                    <Typography variant="body1" fontWeight={600} color="#388e3c">{file.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(file.size / 1024).toFixed(1)} KB — click to change
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body1" color="text.secondary">
                      Drag & drop your file here, or <strong>click to browse</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Supports .xlsx, .xls, .csv</Typography>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
                  style={{ display: "none" }} onChange={handleFileChange} />
              </Box>

              {uploadError && <Typography color="error" variant="body2">{uploadError}</Typography>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} disabled={previewLoading}>Cancel</Button>
            <Button
              variant="contained" onClick={handleUpload}
              disabled={previewLoading || !file}
              startIcon={previewLoading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
              sx={{ backgroundColor: "#002f59", "&:hover": { backgroundColor: "#001c38" } }}
            >
              {previewLoading ? "Analyzing..." : "Preview"}
            </Button>
          </DialogActions>
        </>
      )}

      {/* STEP 1: Preview */}
      {step === 1 && (
        <>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton size="small" onClick={() => setStep(0)} sx={{ color: "#002f59" }}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography variant="h6" fontWeight="bold">
                  Preview — {previewRows.length} row{previewRows.length !== 1 ? "s" : ""}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip size="small" icon={<CheckCircleOutlineIcon />}
                  label={`${previewSummary?.green ?? 0} New`}
                  sx={{ backgroundColor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }} />
                <Chip size="small" icon={<UpdateIcon />}
                  label={`${previewSummary?.yellow ?? 0} To Update`}
                  sx={{ backgroundColor: "#fffde7", color: "#f57f17", fontWeight: 600 }} />
                <Chip size="small" icon={<RemoveCircleOutlineIcon />}
                  label={`${previewSummary?.red ?? 0} Exact Duplicates`}
                  sx={{ backgroundColor: "#ffebee", color: "#c62828", fontWeight: 600 }} />
                {previewSummary?.error > 0 && (
                  <Chip size="small" icon={<ErrorOutlineIcon />}
                    label={`${previewSummary.error} Errors`}
                    sx={{ backgroundColor: "#f3e5f5", color: "#6a1b9a", fontWeight: 600 }} />
                )}
              </Stack>
            </Box>
            <Stack direction="row" spacing={2} mt={1} ml={0.5} flexWrap="wrap">
              {[
                { color: STATUS_COLORS.green,  label: "New — will insert" },
                { color: STATUS_COLORS.yellow, label: "Changed — will update" },
                { color: STATUS_COLORS.red,    label: "Exact duplicate — skipped" },
                { color: STATUS_COLORS.error,  label: "Error — missing fields" },
                { color: "#bdbdbd",            label: "Excluded" },
              ].map(({ color, label }) => (
                <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color }} />
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Box>
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", ml: 0.5 }}>
              💡 Double-click a highlighted cell to edit. Use the eye icon to exclude/include rows.
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            <DataGrid
              rows={previewRows}
              columns={columns}
              getRowId={(row) => row._id}
              hideFooter
              processRowUpdate={processRowUpdate}
              onProcessRowUpdateError={(err) => console.error("Row update error:", err)}
              isCellEditable={(params) =>
                params.row.enabled &&
                params.row.status !== "red" &&
                params.row.status !== "error"
              }
              getRowClassName={(params) => {
                if (!params.row.enabled) return "row-disabled";
                return `row-${params.row.status}`;
              }}
              sx={{
                flex: 1, border: "none",
                "& .row-green":    { backgroundColor: "#e8f5e9" },
                "& .row-yellow":   { backgroundColor: "#fffde7" },
                "& .row-red":      { backgroundColor: "#ffebee", opacity: 0.75 },
                "& .row-error":    { backgroundColor: "#f3e5f5", opacity: 0.75 },
                "& .row-disabled": { backgroundColor: "#f5f5f5", opacity: 0.5 },
                "& .MuiDataGrid-cell--editable:hover": {
                  outline: "2px solid #1976d2",
                  outlineOffset: "-2px",
                  cursor: "text",
                },
              }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: "#e0e0e0", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{totalSelected}</strong> row{totalSelected !== 1 ? "s" : ""} selected
              {" "}({liveCounts.green} insert{liveCounts.green !== 1 ? "s" : ""},
              {" "}{liveCounts.yellow} update{liveCounts.yellow !== 1 ? "s" : ""})
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={handleClose} disabled={confirmLoading}>Cancel</Button>
              <Button
                variant="contained" onClick={handleConfirm}
                disabled={confirmLoading || totalSelected === 0}
                startIcon={confirmLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
                sx={{ backgroundColor: "#002f59", "&:hover": { backgroundColor: "#001c38" } }}
              >
                {confirmLoading ? "Importing..." : `Confirm Import (${totalSelected})`}
              </Button>
            </Box>
          </DialogActions>
        </>
      )}

      {/* STEP 2: Results */}
      {step === 2 && (
        <>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1 }}>
            Import Complete
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 3 }}>
            {importResult?.error ? (
              <Typography color="error">{importResult.error}</Typography>
            ) : (
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Chip icon={<CheckCircleOutlineIcon />}
                    label={`${importResult?.imported ?? 0} Inserted`}
                    color="success" variant="outlined" />
                  <Chip icon={<UpdateIcon />}
                    label={`${importResult?.updated ?? 0} Updated`}
                    sx={{ borderColor: "#f9a825", color: "#f57f17" }} variant="outlined" />
                  <Chip icon={<ErrorOutlineIcon />}
                    label={`${importResult?.errors?.length ?? 0} Failed`}
                    color={importResult?.errors?.length > 0 ? "error" : "default"}
                    variant="outlined" />
                </Stack>
                {importResult?.errors?.length > 0 && (
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="error.main" mb={0.5}>
                      Failed rows:
                    </Typography>
                    <Box sx={{ maxHeight: 160, overflowY: "auto", border: "1px solid #ef9a9a", borderRadius: 1, p: 1.5 }}>
                      {importResult.errors.map((e, i) => (
                        <Typography key={i} variant="caption" display="block" color="error">
                          {e.name} — {e.reason}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="contained" onClick={handleClose}
              sx={{ backgroundColor: "#002f59", "&:hover": { backgroundColor: "#001c38" } }}>
              Done
            </Button>
          </DialogActions>
        </>
      )}

    </Dialog>
  );
};

export default ImportResidentModal;
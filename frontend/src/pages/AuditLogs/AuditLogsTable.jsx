import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import axios from "axios";
import BackupRestoreResultModal from "../../modals/BackupRestoreResultModal.jsx";
import AuditLogDetailsModal from "../../modals/AuditLogDetailsModal.jsx";
import {
  getActionMeta,
  getLogDetail,
  formatLogTime,
} from "../../utils/AuditLogFormat.js";

// Same palette as ResidentsToolbar.jsx
const NAVY = "#002f59";
const TOOLBAR_BG = "#E0F2FF";
const TOOLBAR_BORDER = "rgba(0, 47, 89, 0.2)";
const INK = "#0f1c2e";
const INK_2 = "#4a5568";
const INK_3 = "#94a3b8";

// Fixed row height — possible because extra detail lives in a popup
// instead of expanding inside the table.
const ROW_HEIGHT = 60;

// Logs loaded per request. 50 rows x 60px = 3000px, tall enough that the
// first batch always overflows the grid and can be scrolled (infinite
// scroll only triggers from scrolling, so a short first batch on a tall
// screen would otherwise get stuck).
const PAGE_SIZE = 50;

// How long typing must pause before the search is sent to the API.
const SEARCH_DEBOUNCE_MS = 350;

// How close (in px) to the bottom of the list before the next batch is requested.
const LOAD_MORE_THRESHOLD = ROW_HEIGHT * 5;

// Shared look for every control in the filter row — white field on the
// light-blue toolbar with a 1-unit (4px) radius, exactly like the
// "Quick search..." field in ResidentsToolbar.
const fieldSx = {
  backgroundColor: "white",
  "& .MuiOutlinedInput-root": { borderRadius: 1 },
};

/** Filter dropdown — "All" maps to "" so the existing API params logic is unchanged. */
const FilterSelect = ({ label, value, onChange, width = 160, children }) => (
  <TextField
    select
    size="small"
    label={label}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    sx={{ ...fieldSx, flex: `0 1 ${width}px`, minWidth: 140 }}
  >
    <MenuItem value="">
      <em>All</em>
    </MenuItem>
    {children}
  </TextField>
);

const datePickerSlotProps = {
  textField: {
    size: "small",
    sx: { ...fieldSx, flex: "0 1 150px", minWidth: 140 },
  },
};

// ── Cell renderers ─────────────────────────────────────────────────────
const EntityCell = ({ row }) => (
  <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0, width: "100%" }}>
    <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 600, color: INK, lineHeight: 1.35 }}>
      {row.entity_name || "—"}
    </Typography>
    {row.entity_id != null && (
      <Typography noWrap sx={{ fontSize: "0.7rem", color: INK_3, lineHeight: 1.3 }}>
        ID {row.entity_id}
      </Typography>
    )}
  </Box>
);

const ActionCell = ({ row }) => {
  const meta = getActionMeta(row.action_type);
  return (
    <Chip
      size="small"
      label={meta.label}
      sx={{ backgroundColor: meta.bg, color: meta.color, fontWeight: 600, fontSize: "0.72rem" }}
    />
  );
};

const DetailsCell = ({ row, onOpen }) => {
  const detail = row._detail;

  if (detail.type === "none") {
    return <Typography sx={{ color: INK_3 }}>—</Typography>;
  }

  // Button only — no summary text — so it always sits at the left edge of
  // the column, at the same spot on every row.
  return (
    <Button
      size="small"
      variant="outlined"
      onClick={() => onOpen(row)}
      sx={{
        flexShrink: 0,
        borderColor: NAVY,
        color: NAVY,
        fontSize: "0.75rem",
        py: 0.25,
        "&:hover": { borderColor: "#001c38", backgroundColor: "#f5f9fc" },
      }}
    >
      {detail.type === "report" ? "View report" : "View details"}
    </Button>
  );
};

export default function AuditLogsTable() {
  // `logs` accumulates across pages — page 1 replaces it, later pages append.
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  // Flips true once the very first load finishes. Only that first load gets
  // DataGrid's loading overlay; later refetches (typing, filters) update quietly.
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Filter Options
  const [filterOptions, setFilterOptions] = useState({
    entityTypes: [],
    actionTypes: [],
    performedByUsers: [],
  });

  // Filter State
  const [searchInput, setSearchInput] = useState(""); // what the box shows — updates every keystroke
  const [search, setSearch] = useState("");           // what the API uses — follows after a pause
  const [entityType, setEntityType] = useState("");
  const [actionType, setActionType] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  // Modal State
  const [activityReportView, setActivityReportView] = useState(null); // backup/restore report
  const [detailsView, setDetailsView] = useState(null);               // everything else

  const apiRef = useGridApiRef();

  // requestIdRef: only the newest request may write results, so a slow
  // response from an old filter can never be appended onto a newer list.
  // loadingRef: synchronous guard so a burst of scroll-end events can't
  // bump `page` twice before the first fetch has even started (which would
  // silently skip a page of logs).
  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);
  const gridWrapRef = useRef(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get("http://localhost:5000/api/audit-logs/filters", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFilterOptions(data);
      } catch (err) {
        console.error("Failed to fetch audit log filters:", err);
      }
    };
    fetchFilters();
  }, []);

  // Runs whenever a filter changes (page is reset to 1 in the same batch,
  // so this fires once and REPLACES the list) or when scrolling bumps
  // `page` (fires once and APPENDS).
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    loadingRef.current = true;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = { page, pageSize: PAGE_SIZE };

        if (search) params.search = search;
        if (entityType) params.entityType = entityType;
        if (actionType) params.actionType = actionType;
        if (performedBy) params.performedBy = performedBy;
        if (dateFrom && dateTo) {
          params.startDate = dateFrom.format("YYYY-MM-DD");
          params.endDate = dateTo.format("YYYY-MM-DD");
        }

        const { data } = await axios.get("http://localhost:5000/api/audit-logs", {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        if (requestId !== requestIdRef.current) return; // superseded by a newer request

        setLogs((prev) => {
          if (page === 1) return data.rows;
          // New logs can arrive while someone scrolls, shifting rows between
          // pages — skip any log_id already loaded so DataGrid never sees
          // duplicate row ids.
          const seen = new Set(prev.map((l) => l.log_id));
          return [...prev, ...data.rows.filter((l) => !seen.has(l.log_id))];
        });
        // A short batch means that was the last one.
        setHasMore(data.rows.length === PAGE_SIZE);
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
        // Stop auto-loading after a failure — otherwise the next scroll would
        // request page N+1 and skip the page that failed. Changing a filter
        // starts fresh.
        if (requestId === requestIdRef.current) setHasMore(false);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setInitialLoadDone(true);
          loadingRef.current = false;
        }
      }
    };

    fetchLogs();
  }, [search, entityType, actionType, performedBy, dateFrom, dateTo, page]);

  // Debounced search: the box updates instantly, but the API only hears about
  // it once typing pauses — one request per word instead of one per letter.
  // (Stale responses from earlier requests are already discarded by requestIdRef.)
  useEffect(() => {
    if (searchInput === search) return;
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
      apiRef.current?.scroll?.({ top: 0 });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search, apiRef]);

  // Any filter change goes back to the first batch and to the top of the list.
  const resetToFirstPage = () => {
    setPage(1);
    apiRef.current?.scroll?.({ top: 0 });
  };

  const handleFilterChange = (setter) => (val) => {
    setter(val);
    resetToFirstPage();
  };

  const handleClear = () => {
    setSearchInput("");
    setSearch("");
    setEntityType("");
    setActionType("");
    setPerformedBy("");
    setDateFrom(null);
    setDateTo(null);
    resetToFirstPage();
  };

  // Requests the next batch. Safe to call as often as you like — the ref
  // guard means only one batch is ever in flight, and it does nothing once
  // the last batch has been loaded.
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setPage((p) => p + 1);
  }, [hasMore]);

  // Watches the grid's own scroll element directly instead of relying only
  // on DataGrid's onRowsScrollEnd (which fires once per trip into the bottom
  // zone and is opaque to debug). This checks the distance from the bottom on
  // EVERY scroll event, so it can't miss. Scroll events don't bubble, but a
  // capture-phase listener on an ancestor still receives them — which also
  // means it doesn't matter when DataGrid mounts its scroller element.
  useEffect(() => {
    const wrap = gridWrapRef.current;
    if (!wrap) return;

    const handleScroll = (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || !el.classList.contains("MuiDataGrid-virtualScroller")) return;

      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom <= LOAD_MORE_THRESHOLD) loadMore();
    };

    wrap.addEventListener("scroll", handleScroll, true);
    return () => wrap.removeEventListener("scroll", handleScroll, true);
  }, [loadMore]);

  // Attach the row number and parsed detail once per change to `logs`, not
  // once per cell render. "No." is positional (1..N across everything
  // loaded so far), same idea as the Residents table's "No." column.
  const rows = useMemo(
    () => logs.map((log, index) => ({ ...log, no: index + 1, _detail: getLogDetail(log) })),
    [logs]
  );

  // Backup/restore rows keep opening the existing report modal exactly as
  // before; every other row with detail opens the details popup.
  const handleOpenDetail = useCallback((row) => {
    if (row._detail.type === "report") {
      setActivityReportView({
        report: row._detail.data,
        operation: row.action_type === "backup_created" ? "backup" : "restore",
        filename: row.entity_name,
      });
    } else {
      setDetailsView(row);
    }
  }, []);

  const columns = useMemo(() => {
    // The API only orders by performed_at DESC, so column sorting/filtering
    // would just reorder the rows loaded so far — disabled rather than misleading.
    const base = { sortable: false, filterable: false, disableColumnMenu: true };

    return [
      { ...base, field: "no", headerName: "No.", width: 70 },
      {
        ...base,
        field: "action_time",
        headerName: "Date & Time",
        width: 180,
        renderCell: ({ row }) => (
          <Typography noWrap sx={{ fontSize: "0.8rem", color: INK_2 }}>
            {formatLogTime(row.action_time)}
          </Typography>
        ),
      },
      {
        ...base,
        field: "performed_by",
        headerName: "Performed By",
        width: 170,
        renderCell: ({ row }) =>
          row.performed_by ? (
            <Typography noWrap sx={{ fontSize: "0.85rem", color: INK }}>
              {row.performed_by}
            </Typography>
          ) : (
            // Null performed_by = system action (e.g. auto-locked forms)
            <Typography sx={{ fontSize: "0.85rem", color: INK_3, fontStyle: "italic" }}>
              System
            </Typography>
          ),
      },
      {
        ...base,
        field: "entity_type",
        headerName: "Entity Type",
        width: 140,
      },
      {
        ...base,
        field: "entity_name",
        headerName: "Entity",
        flex: 1,
        minWidth: 200,
        renderCell: ({ row }) => <EntityCell row={row} />,
      },
      {
        ...base,
        field: "action_type",
        headerName: "Action",
        width: 190,
        renderCell: ({ row }) => <ActionCell row={row} />,
      },
      {
        ...base,
        field: "details",
        headerName: "Details",
        width: 160,
        renderCell: ({ row }) => <DetailsCell row={row} onOpen={handleOpenDetail} />,
      },
    ];
  }, [handleOpenDetail]);

  // True while a new first batch is loading over rows that are already on screen.
  const isRefreshing = loading && page === 1 && initialLoadDone;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#fff",
      }}
    >
      {/* ── Toolbar (same structure as ResidentsToolbar) ───────────────── */}
      <Box
        sx={{
          flexShrink: 0,
          backgroundColor: TOOLBAR_BG,
          borderBottom: `1px solid ${TOOLBAR_BORDER}`,
        }}
      >
        {/* Top row — Page Title */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography variant="h6" fontWeight="bold" color={NAVY}>
            Audit Logs
          </Typography>
        </Box>

        {/* Filter row — all controls stay visible, wrap when narrow */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            padding: "8px 16px",
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          <TextField
            variant="outlined"
            size="small"
            placeholder="Quick search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            // Fixed width like the Residents "Quick search..." field (it used
            // to stretch to fill the row). Shrinks only if the window gets tiny.
            sx={{ ...fieldSx, flex: "0 1 220px", minWidth: 180 }}
          />

          <FilterSelect
            label="Entity Type"
            value={entityType}
            onChange={handleFilterChange(setEntityType)}
          >
            {filterOptions.entityTypes.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </FilterSelect>

          {/* Values stay the raw action_type (what the API filters on);
              only the visible label is humanized. */}
          <FilterSelect
            label="Action Type"
            value={actionType}
            onChange={handleFilterChange(setActionType)}
            width={190}
          >
            {filterOptions.actionTypes.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {getActionMeta(opt).label}
              </MenuItem>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Performed By"
            value={performedBy}
            onChange={handleFilterChange(setPerformedBy)}
            width={180}
          >
            {filterOptions.performedByUsers.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name}
              </MenuItem>
            ))}
          </FilterSelect>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="From"
              value={dateFrom}
              onChange={handleFilterChange(setDateFrom)}
              format="MM/DD/YYYY"
              maxDate={dateTo || undefined}
              slotProps={datePickerSlotProps}
            />
            <DatePicker
              label="To"
              value={dateTo}
              onChange={handleFilterChange(setDateTo)}
              format="MM/DD/YYYY"
              minDate={dateFrom || undefined}
              slotProps={datePickerSlotProps}
            />
          </LocalizationProvider>

          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon fontSize="small" />}
            onClick={handleClear}
            sx={{
              textTransform: "none",
              borderColor: NAVY,
              color: NAVY,
              fontWeight: 500,
              backgroundColor: "#fff",
              "&:hover": { borderColor: "#001c38", backgroundColor: "#f5f9fd" },
            }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {/* ── Grid — infinite scroll: no pagination footer ───────────────── */}
      <Box
        ref={gridWrapRef}
        sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}
      >
        <DataGrid
          apiRef={apiRef}
          rows={rows}
          columns={columns}
          getRowId={(row) => row.log_id}
          // Overlay ONLY for the very first load. Refetches from typing/filters
          // would otherwise flash the loading bar on every change; appending
          // more rows shows the floating "Loading more…" pill instead.
          loading={!initialLoadDone}
          rowHeight={ROW_HEIGHT}
          hideFooter
          // Secondary trigger — the scroll listener above is the primary one.
          // Both call the same guarded loadMore, so double-firing is harmless.
          onRowsScrollEnd={loadMore}
          scrollEndThreshold={LOAD_MORE_THRESHOLD}
          disableRowSelectionOnClick
          localeText={{ noRowsLabel: "No audit logs found." }}
          sx={{
            flex: 1,
            minHeight: 0,
            border: 0,
            borderRadius: 0,
            // Refetch feedback without flicker: the rows only dim if a refetch
            // takes longer than 0.4s (the delay applies going TO the dimmed
            // state), and un-dim immediately when it finishes.
            opacity: isRefreshing ? 0.55 : 1,
            transition: isRefreshing ? "opacity 0.2s ease 0.4s" : "opacity 0.1s ease",
          }}
        />

        {/* Floats over the bottom of the list while the next batch loads, so
            nothing in the layout moves. Shown only for appends — a fresh
            first-batch load uses DataGrid's own overlay. */}
        {loading && page > 1 && (
          <Box
            sx={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: 4,
              backgroundColor: "#fff",
              border: `1px solid ${TOOLBAR_BORDER}`,
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            <CircularProgress size={14} />
            <Typography variant="body2" color="text.secondary">
              Loading more…
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <BackupRestoreResultModal
        open={!!activityReportView}
        onClose={() => setActivityReportView(null)}
        report={activityReportView?.report}
        operation={activityReportView?.operation}
        filename={activityReportView?.filename}
      />

      <AuditLogDetailsModal
        open={!!detailsView}
        onClose={() => setDetailsView(null)}
        log={detailsView}
      />
    </Box>
  );
}
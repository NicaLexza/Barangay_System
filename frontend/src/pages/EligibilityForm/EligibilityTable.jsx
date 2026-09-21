// EligibilityTable.jsx 
import React, { useState, useEffect } from "react";
import {
  Typography, Box, Card, CardContent, CardActionArea,
  IconButton, Menu, MenuItem, Chip, Divider, CircularProgress,
  Button, Tooltip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DeleteEligibilityFormModal from "../../modals/DeleteEligibilityFormModal";
import CreateEligibilityFormModal from "../../modals/CreateEligibilityFormModal";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ArchiveIcon from "@mui/icons-material/Archive";
import AddIcon from "@mui/icons-material/Add";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EligibilityTable = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/eligibility-forms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForms(res.data);
      } catch (err) {
        console.error("Failed to fetch eligibility forms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [refreshKey]);

  const handleKebabOpen = (e, form) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setSelectedForm(form);
  };

  const handleKebabClose = () => {
    setMenuAnchor(null);
    setSelectedForm(null);
  };

  const handleToggleStatus = async (status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/eligibility-forms/${selectedForm.form_id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      handleKebabClose();
    }
  };

  const handleCardClick = (form) => {
    navigate(`/Eligibility/${form.form_id}`, { 
      state: { 
        form_name: form.form_name,
        is_disabled: form.status === "Disabled",
        is_archived: false,
      } 
    });
  };

  const formatDate = (datetime) => {
    if (!datetime) return "N/A";
    return new Date(datetime).toLocaleDateString("en-PH", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  // Days remaining until end_date — used to surface an "Ending soon" nudge
  // on active forms so staff notice before the auto-lock kicks in, rather
  // than being surprised when it silently flips to Disabled.
  const daysUntilEnd = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const diffMs = end - new Date();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  return (
    <Box sx={{ px: 4, py: 3, height: "100%", overflowY: "auto" }}>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="#002f59">
            Eligibility Forms
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and view all eligibility forms
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{
              backgroundColor: "#002f59",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#001c38" },
            }}
          >
            New Form
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<ArchiveIcon />}
            onClick={() => navigate("/Eligibility/Archived")}
            sx={{
              textTransform: "none",
              borderColor: "#78716c",
              color: "#57534e",
              fontWeight: 500,
              backgroundColor: "#fff",
              "&:hover": {
                borderColor: "#57534e",
                backgroundColor: "#f5f5f4",
              },
            }}
          >
            View Archived
          </Button>
        </Box>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : forms.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 8 }}>
          <Typography color="text.secondary">No eligibility forms found.</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ mt: 2 }}
          >
            Create the first form
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {forms.map((form) => {
            const total = form.total_entries ?? 0;
            const rewarded = form.rewarded_count ?? 0;
            const notRewarded = total - rewarded;
            const isEnabled = form.status === "Enabled";
            const remainingDays = isEnabled ? daysUntilEnd(form.end_date) : null;
            const endingSoon = remainingDays !== null && remainingDays <= 3 && remainingDays >= 0;
            const isHousehold = form.distribution_unit === "Household";
            const entryNoun = isHousehold
              ? (total === 1 ? "household" : "households")
              : (total === 1 ? "record" : "records");

            return (
              <Box
                key={form.form_id}
                sx={{ width: { xs: "100%", sm: "calc(50% - 12px)", md: "calc(33.333% - 16px)" } }}
              >
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: isEnabled ? "#e0e0e0" : "#f5c6c6",
                    opacity: isEnabled ? 1 : 0.75,
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: 6 },
                    position: "relative",
                  }}
                >
                  {/* Kebab menu */}
                  <IconButton
                    size="small"
                    onClick={(e) => handleKebabOpen(e, form)}
                    sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>

                  <CardActionArea onClick={() => handleCardClick(form)} sx={{ p: 0 }}>
                    <CardContent sx={{ pt: 2.5, pb: 2, px: 2.5 }}>

                      {/* Status chip(s) + Form name */}
                      <Box sx={{ mb: 1, pr: 3 }}>
                        <Box sx={{ display: "flex", gap: 0.75, mb: 0.75, flexWrap: "wrap" }}>
                          <Chip
                            label={form.status}
                            size="small"
                            sx={{
                              backgroundColor: isEnabled ? "#e8f5e9" : "#fdecea",
                              color: isEnabled ? "#2e7d32" : "#c62828",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                          {form.distribution_unit && (
                            <Chip
                              label={isHousehold ? "Per household" : "Per resident"}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: "#cbd5e1",
                                color: "#475569",
                                fontWeight: 500,
                                fontSize: "0.7rem",
                              }}
                            />
                          )}
                          {endingSoon && (
                            <Chip
                              label={remainingDays === 0 ? "Ends today" : `Ends in ${remainingDays}d`}
                              size="small"
                              sx={{
                                backgroundColor: "#fff7ed",
                                color: "#c2410c",
                                fontWeight: 600,
                                fontSize: "0.7rem",
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="#002f59"
                          sx={{ lineHeight: 1.3, wordBreak: "break-word" }}
                        >
                          {form.form_name}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      {/* Additional details — source, distribution, quantity */}
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6, mb: 1.5 }}>
                        <Tooltip title={form.source_details || "N/A"} placement="top">
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <SourceOutlinedIcon fontSize="small" sx={{ color: "#777", mt: "1px" }} />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {form.source_details || "N/A"}
                            </Typography>
                          </Box>
                        </Tooltip>
                        <Tooltip title={form.distribution_details || "N/A"} placement="top">
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Inventory2OutlinedIcon fontSize="small" sx={{ color: "#777", mt: "1px" }} />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {form.distribution_details || "N/A"}
                              {form.target_quantity ? ` — target ${form.target_quantity}` : ""}
                            </Typography>
                          </Box>
                        </Tooltip>
                        {(form.start_date || form.end_date) && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <EventOutlinedIcon fontSize="small" sx={{ color: "#777" }} />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(form.start_date)} – {formatDate(form.end_date)}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Divider sx={{ mb: 1.5 }} />

                      {/* Entry counts */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                        <PeopleAltOutlinedIcon fontSize="small" sx={{ color: "#555" }} />
                        <Typography variant="body2" color="text.secondary">
                          {total} {entryNoun}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1.5, mb: 1.5, pl: 0.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <CheckCircleOutlineIcon fontSize="small" sx={{ color: "#2e7d32" }} />
                          <Typography variant="body2" color="#2e7d32">
                            {rewarded} rewarded
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <CheckCircleOutlineIcon fontSize="small" sx={{ color: "#bbb" }} />
                          <Typography variant="body2" color="text.secondary">
                            {notRewarded} pending
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ mb: 1.5 }} />

                      {/* Created by / at */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <PersonOutlineIcon fontSize="small" sx={{ color: "#777" }} />
                        <Typography variant="caption" color="text.secondary">
                          {form.created_by_name || "N/A"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarTodayOutlinedIcon fontSize="small" sx={{ color: "#777" }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(form.created_at)}
                        </Typography>
                      </Box>

                    </CardContent>
                  </CardActionArea>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Kebab Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleKebabClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => handleToggleStatus("Enabled")}
          disabled={selectedForm?.status === "Enabled"}
        >
          Enable
        </MenuItem>
        <MenuItem
          onClick={() => handleToggleStatus("Disabled")}
          disabled={selectedForm?.status === "Disabled"}
        >
          Disable
        </MenuItem>

        <Divider />

        {/* "Archive" replaces the old "Delete" — soft-delete via the existing delete endpoint */}
        <MenuItem
          onClick={() => { setArchiveOpen(true); setMenuAnchor(null); }}
          sx={{ color: "#78716c" }}
        >
          Archive
        </MenuItem>
      </Menu>

      {/* Archive (soft-delete) confirmation modal — reuses DeleteEligibilityFormModal
          with updated wording supplied by its new props */}
      <DeleteEligibilityFormModal
        open={archiveOpen}
        onClose={() => { setArchiveOpen(false); setSelectedForm(null); }}
        onConfirm={() => setRefreshKey((prev) => prev + 1)}
        target={selectedForm}
      />

      {/* New form wizard — the server builds the pool, so nothing here
          passes resident ids. Refreshes the list as soon as a form is saved. */}
      <CreateEligibilityFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />

    </Box>
  );
};

export default EligibilityTable;
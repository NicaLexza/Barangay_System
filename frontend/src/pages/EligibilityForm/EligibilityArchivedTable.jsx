// EligibilityArchivedTable.jsx
import React, { useState, useEffect } from "react";
import {
  Typography, Box, Card, CardContent, CardActionArea,
  IconButton, Menu, MenuItem, Chip, Divider, CircularProgress,
  Button,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ArchiveIcon from "@mui/icons-material/Archive";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReAuthModal from "../../modals/ReAuthModal.jsx";

const EligibilityArchivedTable = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Re-auth modal state
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [reAuthAction, setReAuthAction] = useState(null); // "restore" | "delete"
  const [reAuthLoading, setReAuthLoading] = useState(false);
  const [reAuthError, setReAuthError] = useState("");

  const navigate = useNavigate();

  // Decode role from token (client-side only, for UI gating)
  const getRoleFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      return JSON.parse(atob(token.split(".")[1])).role ?? null;
    } catch {
      return null;
    }
  };
  const isAdmin = getRoleFromToken() === "Admin";

  useEffect(() => {
    const fetchArchived = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/eligibility-forms/archived",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setForms(res.data);
      } catch (err) {
        console.error("Failed to fetch archived forms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArchived();
  }, [refreshKey]);

  const handleKebabOpen = (e, form) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setSelectedForm(form);
  };

  const handleKebabClose = () => {
    setMenuAnchor(null);
  };

  // Open re-auth modal for the chosen action
  const openReAuth = (action) => {
    setReAuthAction(action);
    setReAuthError("");
    setReAuthOpen(true);
    handleKebabClose();
  };

  // Called when user submits credentials in the re-auth modal
  const handleReAuthConfirm = async ({ username, password }) => {
    setReAuthLoading(true);
    setReAuthError("");

    try {
      const token = localStorage.getItem("token");
      const formId = selectedForm?.form_id;

      if (reAuthAction === "restore") {
        await axios.post(
          `http://localhost:5000/api/eligibility-forms/archived/${formId}/restore`,
          { username, password },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (reAuthAction === "delete") {
        await axios.delete(
          `http://localhost:5000/api/eligibility-forms/archived/${formId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: { username, password },
          }
        );
      }

      setReAuthOpen(false);
      setSelectedForm(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      const msg = err.response?.data?.message || "An error occurred. Please try again.";
      setReAuthError(msg);
    } finally {
      setReAuthLoading(false);
    }
  };

  const handleReAuthClose = () => {
    if (reAuthLoading) return;
    setReAuthOpen(false);
    setReAuthError("");
    setSelectedForm(null);
  };

  const handleCardClick = (form) => {
    navigate(`/Eligibility/${form.form_id}`, {
      state: {
        form_name: form.form_name,
        is_disabled: true, // archived = read-only like disabled
        is_archived: true,
      },
    });
  };

  const formatDate = (datetime) => {
    if (!datetime) return "N/A";
    return new Date(datetime).toLocaleDateString("en-PH", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  return (
    <Box sx={{ px: 4, py: 3, height: "100%", overflowY: "auto" }}>

      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            size="small"
            onClick={() => navigate("/Eligibility")}
            sx={{ color: "#002f59", mt: 0.25 }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ArchiveIcon sx={{ color: "#78716c", fontSize: 22 }} />
              <Typography variant="h5" fontWeight="bold" color="#002f59">
                Archived Forms
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Forms moved to archive are read-only. Admins can restore or permanently delete them.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : forms.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 10 }}>
          <ArchiveIcon sx={{ fontSize: 56, color: "#cbd5e1", mb: 2 }} />
          <Typography color="text.secondary" fontWeight={500}>
            No archived forms yet.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            When a form is archived, it will appear here.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {forms.map((form) => {
            const total = form.total_entries ?? 0;
            const rewarded = form.rewarded_count ?? 0;
            const notRewarded = total - rewarded;

            return (
              <Box
                key={form.form_id}
                sx={{ width: { xs: "100%", sm: "calc(50% - 12px)", md: "calc(33.333% - 16px)" } }}
              >
                <Card
                  elevation={1}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #d6d3d1",
                    opacity: 0.85,
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: 4, opacity: 1 },
                    position: "relative",
                    backgroundColor: "#fafaf9",
                  }}
                >
                  {/* Kebab menu — only admins see restore/delete */}
                  {isAdmin && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleKebabOpen(e, form)}
                      sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}

                  <CardActionArea onClick={() => handleCardClick(form)} sx={{ p: 0 }}>
                    <CardContent sx={{ pt: 2.5, pb: 2, px: 2.5 }}>

                      {/* Status chip + Form name */}
                      <Box sx={{ mb: 1, pr: isAdmin ? 3 : 0 }}>
                        <Chip
                          label="Archived"
                          size="small"
                          icon={<ArchiveIcon sx={{ fontSize: "13px !important" }} />}
                          sx={{
                            mb: 0.75,
                            backgroundColor: "#e7e5e4",
                            color: "#57534e",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="#44403c"
                          sx={{ lineHeight: 1.3, wordBreak: "break-word" }}
                        >
                          {form.form_name}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      {/* Entry counts */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                        <PeopleAltOutlinedIcon fontSize="small" sx={{ color: "#888" }} />
                        <Typography variant="body2" color="text.secondary">
                          {total} {total === 1 ? "record" : "records"}
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
                        <PersonOutlineIcon fontSize="small" sx={{ color: "#999" }} />
                        <Typography variant="caption" color="text.secondary">
                          {form.created_by_name || "N/A"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarTodayOutlinedIcon fontSize="small" sx={{ color: "#999" }} />
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

      {/* Admin Kebab Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleKebabClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => openReAuth("restore")}>
          Restore
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => openReAuth("delete")}
          sx={{ color: "error.main" }}
        >
          Delete Permanently
        </MenuItem>
      </Menu>

      {/* Re-auth modal */}
      <ReAuthModal
        open={reAuthOpen}
        onClose={handleReAuthClose}
        onConfirm={handleReAuthConfirm}
        loading={reAuthLoading}
        error={reAuthError}
        title={
          reAuthAction === "restore"
            ? "Confirm Restore"
            : "Confirm Permanent Deletion"
        }
        description={
          reAuthAction === "restore"
            ? `Enter your admin credentials to restore "${selectedForm?.form_name}" back to the eligibility forms list.`
            : `Enter your admin credentials to permanently delete "${selectedForm?.form_name}". This cannot be undone.`
        }
        confirmLabel={reAuthAction === "restore" ? "Restore" : "Delete Permanently"}
        confirmColor={reAuthAction === "restore" ? "primary" : "error"}
      />
    </Box>
  );
};

export default EligibilityArchivedTable;
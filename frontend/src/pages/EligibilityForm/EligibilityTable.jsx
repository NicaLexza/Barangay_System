// EligibilityTable.jsx 
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
import DeleteEligibilityFormModal from "../../modals/DeleteEligibilityFormModal";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ArchiveIcon from "@mui/icons-material/Archive";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EligibilityTable = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
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
            flexShrink: 0,
            "&:hover": {
              borderColor: "#57534e",
              backgroundColor: "#f5f5f4",
            },
          }}
        >
          View Archived
        </Button>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : forms.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 8 }}>
          <Typography color="text.secondary">No eligibility forms found.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {forms.map((form) => {
            const total = form.total_entries ?? 0;
            const rewarded = form.rewarded_count ?? 0;
            const notRewarded = total - rewarded;
            const isEnabled = form.status === "Enabled";

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

                      {/* Status chip + Form name */}
                      <Box sx={{ mb: 1, pr: 3 }}>
                        <Chip
                          label={form.status}
                          size="small"
                          sx={{
                            mb: 0.75,
                            backgroundColor: isEnabled ? "#e8f5e9" : "#fdecea",
                            color: isEnabled ? "#2e7d32" : "#c62828",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
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

                      {/* Entry counts */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                        <PeopleAltOutlinedIcon fontSize="small" sx={{ color: "#555" }} />
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

    </Box>
  );
};

export default EligibilityTable;
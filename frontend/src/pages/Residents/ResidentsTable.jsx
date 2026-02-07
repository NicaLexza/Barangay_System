import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, IconButton, Popper, Paper, Typography } from '@mui/material';
import ResidentsToolbar from './ResidentsToolbar';
import axios from 'axios';
import EditResidentModal from '../../modals/EditResidentModal';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const ResidentsTable = () => {
  const [allRows, setAllRows] = useState([]);  // original data
  const [rows, setRows] = useState([]);        // filtered data
  const [refreshKey, setRefreshKey] = useState(0);

  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const columns = [
    { field: "no", headerName: "No.", width: 70, sortable: false },
    { field: "fullName", headerName: "Full Name", width: 220 },
    { field: "address", headerName: "Address", width: 150 },
    { field: "place_of_birth", headerName: "Place of Birth", width: 150 },
    { field: "birthdate", headerName: "Date of Birth", width: 130 },
    {
      field: "age",
      headerName: "Age",
      width: 90,
      type: "number",
      align: "left",
      headerAlign: "left",
    },
    { field: "sex", headerName: "Sex", width: 90 },
    { field: "civilStatus", headerName: "Civil Status", width: 130 },
    { field: "occupation", headerName: "Occupation", width: 160 },
    { field: "specialSector", headerName: "Special Sector", width: 180 },
    { field: "citizenship", headerName: "Citizenship", width: 140 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      disableColumnMenu: true,
      renderCell: (params) => {
        const row = params.row;
        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <IconButton size="small" onClick={() => handleEditClick(row)}>
              <EditIcon fontSize="small" />
            </IconButton>

            <IconButton size="small" color="error" onClick={() => handleDeleteClick(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>

            <div
              onMouseEnter={(e) => handleInfoEnter(e, row)}
              onMouseLeave={() => handleInfoLeave()}
            >
              <IconButton size="small">
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
        );
      },
    },
  ];

  // --- Manual stacked filter function ---
  const applyManualFilters = (filters) => {
    const { ageMin, ageMax, gender, civilStatuses, employment, sectors } = filters;

    const filtered = allRows.filter((row) => {
      const age = calculateAge(row.birthdate);
      const sectorArray = row.specialSector?.split(',').map(s => s.trim()) || [];

      // Age range
      if (ageMin !== '' && (age === null || age < Number(ageMin))) return false;
      if (ageMax !== '' && (age === null || age > Number(ageMax))) return false;

      // Gender
      if (gender !== 'All' && row.sex !== gender) return false;

      // Civil Status (multi-select OR)
      if (civilStatuses.length > 0 && !civilStatuses.includes(row.civilStatus)) return false;

      // Employment
      if (employment === 'Employed' && !row.occupation) return false;
      if (employment === 'Unemployed' && row.occupation) return false;

      // Special Sector (AND)
      if (sectors.pwd && !sectorArray.includes('PD')) return false;
      if (sectors.senior && !sectorArray.includes('S')) return false;
      if (sectors.solop && !sectorArray.includes('SP')) return false;

      return true; // passed all filters
    });

    setRows(filtered);
  };

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found — please log in');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/residents', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedRows = response.data.map((resident, index) => ({
          id: resident.resident_id || index + 1,
          no: index + 1,
          fullName: resident.fullName,
          sex: resident.sex,
          birthdate: resident.birthdate,
          age: resident.age,
          address: resident.address,
          house_no: resident.house_no || "",
          street: resident.street || "",
          place_of_birth: resident.place_of_birth,
          civilStatus: resident.civilStatus,
          occupation: resident.occupation || '',
          citizenship: resident.citizenship,
          specialSector: resident.specialSector,
          // optional metadata used by the info popup
          created_by: resident.created_by,
          created_at: resident.created_at,
          updated_by: resident.updated_by,
          updated_at: resident.updated_at,
        }));

        setAllRows(fetchedRows);
        setRows(fetchedRows);
      } catch (error) {
        console.error('Error fetching residents:', error);
      }
    };

    fetchResidents();
  }, [refreshKey]);

  // UI state for edit/delete/info
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);

  const handleEditClick = (row) => {
    setSelectedRow(row);
    setEditOpen(true);
  };

  const handleDeleteClick = (row) => {
    setSelectedRow(row);
    setDeleteOpen(true);
  };

  const handleInfoEnter = (event, row) => {
    setSelectedRow(row);
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoLeave = () => {
    setInfoAnchorEl(null);
  };

  const infoOpen = Boolean(infoAnchorEl);

  return (
    <Box sx={{ height: 550, width: 1600 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        hideFooter
        showToolbar
        slots={{ toolbar: ResidentsToolbar }}
        slotProps={{
          toolbar: {
            onAddSuccess: () => setRefreshKey((prev) => prev + 1),
            onApplyFilters: applyManualFilters, // pass manual filter to toolbar
          },
        }}
      />
      {/* Info popper shown on hover */}
      <Popper open={infoOpen} anchorEl={infoAnchorEl} placement="right-start" disablePortal>
        <Paper elevation={3} sx={{ p: 1, maxWidth: 220 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>INFO</Typography>
          <Typography variant="body2">Created by : {selectedRow?.created_by || 'N/A'}</Typography>
          <Typography variant="body2">Created at : {selectedRow?.created_at || 'N/A'}</Typography>
          <Typography variant="body2">Updated by : {selectedRow?.updated_by || 'N/A'}</Typography>
          <Typography variant="body2">Updated at : {selectedRow?.updated_at || 'N/A'}</Typography>
        </Paper>
      </Popper>

      <EditResidentModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => setRefreshKey((p) => p + 1)}
        initialData={selectedRow}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => setRefreshKey((p) => p + 1)}
        target={selectedRow}
      />
    </Box>
  );
};

export default ResidentsTable;

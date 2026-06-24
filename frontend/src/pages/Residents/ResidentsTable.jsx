// ResidentsTable.jsx
import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, IconButton, Popper, Paper, Typography, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ResidentsToolbar from './ResidentsToolbar';
import EditResidentModal from '../../modals/EditResidentModal';
import DeleteConfirmModal from '../../modals/DeleteResidentModal';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import axios from 'axios';
import dayjs from 'dayjs';

const ResidentsTable = () => {
  const [rows, setRows] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  
  // Filter state
  const [filters, setFilters] = useState({
    ageMin: '',
    ageMax: '',
    gender: 'All',
    civilStatuses: [],
    employment: 'All',
    sectors: { pwd: false, senior: false, solop: false },
    household: 'All',
    dateFrom: null,
    dateTo: null,
  });

  // Info Anchor
  const handleInfoEnter = (event, row) => {
    setSelectedRow(row);
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoLeave = () => {
    setInfoAnchorEl(null);
  };

  const infoOpen = Boolean(infoAnchorEl);

  // Age calculation
  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return "—";
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : "—";
  };

  const columns = [
    { field: "no", headerName: "No.", width: 70, sortable: false },
    {
      field: "fullName",
      headerName: "Full Name",
      width: 240,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
            <Typography variant="body2" noWrap>{row.fullName}</Typography>
            {row.is_household_head === 1 && (
              <Chip
                icon={<PeopleAltIcon sx={{ fontSize: '12px !important' }} />}
                label={row.household_member_count ?? 1}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  '& .MuiChip-icon': { color: '#1565c0' },
                  flexShrink: 0,
                }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: "age",
      headerName: "Age",
      width: 90,
      valueGetter: (value, row) => calculateAge(row.birthdate),
      type: "number",
      align: "left",
      headerAlign: "left",
    },
    { field: "sex", headerName: "Sex", width: 90 },
    { field: "birthdate", headerName: "Birthdate", width: 130 },
    { field: "birthplace", headerName: "Birthplace", width: 120 },
    { field: "address", headerName: "Address", width: 150 },
    { field: "civilStatus", headerName: "Civil Status", width: 130 },
    { field: "occupation", headerName: "Occupation", width: 160 },
    { field: "citizenship", headerName: "Citizenship", width: 140 },
    { field: "specialSector", headerName: "Special Sector", width: 130 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      disableColumnMenu: true,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setSelectedRow(row);
                setEditOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setSelectedRow(row);
                setDeleteOpen(true);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onMouseEnter={(e) => handleInfoEnter(e, row)}
              onMouseLeave={() => handleInfoLeave()}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
  ];

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
          fullName: resident.fullName || '',
          sex: resident.sex || '',
          birthdate: resident.birthdate || '',
          birthplace: resident.birthplace || '',
          address: resident.address || '',
          civilStatus: resident.civilStatus || resident.civil_status || '',
          occupation: resident.occupation || '',
          citizenship: resident.citizenship || '',
          specialSector: resident.specialSector || 'None',
          is_household_head: resident.is_household_head ?? 0,
          household_member_count: resident.household_member_count ?? null,
          created_by: resident.created_by,
          created_at: resident.created_at,
          created_by_name: resident.created_by_name,
          updated_by: resident.updated_by,
          updated_at: resident.updated_at,
          updated_by_name: resident.updated_by_name,
        }));

        setRows(fetchedRows);
      } catch (error) {
        console.error('Fetch error details:', error);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Request error:', error.message);
        }
      }
    };

    fetchResidents();
  }, [refreshKey]);

  // Handle filter updates
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Filter rows based on active filters
  const filteredRows = rows.filter((row) => {
    // Search filter
    if (searchValue) {
      const search = searchValue.toLowerCase();
      const matchesSearch =
        row.fullName?.toLowerCase().includes(search) ||
        row.sex?.toLowerCase().includes(search) ||
        row.birthplace?.toLowerCase().includes(search) ||
        row.address?.toLowerCase().includes(search) ||
        row.civilStatus?.toLowerCase().includes(search) ||
        row.occupation?.toLowerCase().includes(search) ||
        row.citizenship?.toLowerCase().includes(search) ||
        row.specialSector?.toLowerCase().includes(search);

      if (!matchesSearch) return false;
    }

    // Split specialSector string for exact matching
    const sectorArray = row.specialSector?.split(',').map(s => s.trim()) || [];
    
    // Special sector filters - exact match
    if (filters.sectors.pwd && !sectorArray.includes('PD')) return false;
    if (filters.sectors.senior && !sectorArray.includes('S')) return false;
    if (filters.sectors.solop && !sectorArray.includes('SP')) return false;
    
    // Age filters
    const age = calculateAge(row.birthdate);
    if (filters.ageMin && age !== "—" && age < Number(filters.ageMin)) return false;
    if (filters.ageMax && age !== "—" && age > Number(filters.ageMax)) return false;
    
    // Gender filter
    if (filters.gender !== 'All' && row.sex !== filters.gender) return false;
    
    // Civil status filter
    if (filters.civilStatuses.length > 0 && !filters.civilStatuses.includes(row.civilStatus)) return false;
    
    // Employment filter
    if (filters.employment !== 'All') {
      if (filters.employment === 'Employed' && !row.occupation) return false;
      if (filters.employment === 'Unemployed' && row.occupation) return false;
    }

    // Household filter
    if (filters.household === 'Heads' && row.is_household_head !== 1) return false;
    if (filters.household === 'Regular' && row.is_household_head === 1) return false;

    // Date Registered filter (based on created_at)
    if (filters.dateFrom) {
      if (!row.created_at || dayjs(row.created_at).isBefore(dayjs(filters.dateFrom).startOf('day'))) return false;
    }
    if (filters.dateTo) {
      if (!row.created_at || dayjs(row.created_at).isAfter(dayjs(filters.dateTo).endOf('day'))) return false;
    }
    
    return true;
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DataGrid
        rows={filteredRows}
        columns={columns}
        getRowId={(row) => row.id}
        hideFooter
        showToolbar
        sx={{ flex: 1, minHeight: 0 }}
        slots={{
          toolbar: ResidentsToolbar,
        }}
        slotProps={{
          toolbar: {
            onAddSuccess: () => setRefreshKey((prev) => prev + 1),
            onApplyFilters: handleApplyFilters,
            filteredRows,
            onSearchChange: (value) => setSearchValue(value),
          },
        }}
      />

      {/* Info popper shown on hover */}
      <Popper open={infoOpen} anchorEl={infoAnchorEl} placement="left-start" sx={{ zIndex: 9999 }}>
        <Paper elevation={3} sx={{ p: 1, maxWidth: 220 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>INFO</Typography>
          <Typography variant="body2">Created by : {selectedRow?.created_by_name || 'N/A'}</Typography>
          <Typography variant="body2">Created at : {selectedRow?.created_at || 'N/A'}</Typography>
          <Typography variant="body2">Updated by : {selectedRow?.updated_by_name || 'N/A'}</Typography>
          <Typography variant="body2">Updated at : {selectedRow?.updated_at || 'N/A'}</Typography>
        </Paper>
      </Popper>

      {/* Edit Modal */}
      <EditResidentModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedRow(null);
        }}
        residentId={selectedRow?.id || selectedRow?.resident_id}
        resident={selectedRow}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
          setEditOpen(false);
        }}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedRow(null);
        }}
        onConfirm={() => setRefreshKey(prev => prev + 1)}
        target={selectedRow}
      />
    </Box>
  );
};

export default ResidentsTable;
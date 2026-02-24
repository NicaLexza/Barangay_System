// components/households/HouseholdsTable.jsx
import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, IconButton, Popper, Paper, Typography, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HouseholdsToolbar from './HouseholdsToolbar';
import EditHouseholdModal from '../../modals/EditHouseholdModal'; 
import DeleteConfirmModal from '../../modals/DeleteHouseholdModal';
import axios from 'axios';

const HouseholdsTable = () => {
  const [rows, setRows] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInfoEnter = (event, row) => {
    setSelectedRow(row);
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoLeave = () => {
    setInfoAnchorEl(null);
  };

  const infoOpen = Boolean(infoAnchorEl);

  const columns = [
    { field: "no", 
      headerName: "No.", 
      width: 70, 
      sortable: false },
    { field: "headFullName", 
      headerName: "Head", 
      width: 250, 
      sortable: true },
    { field: "address", 
      headerName: "Address", 
      width: 300, 
      sortable: true },
    {
      field: "headCount",
      headerName: "Head Count",
      width: 130,
      type: "number",
      align: "left",
      headerAlign: "left",
      sortable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      disableColumnMenu: true,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box sx={{ display: 'flex', gap: 1, mt : 1 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                console.log("Opening Edit for Household ID:", row.id);
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
                console.log("Opening Delete for Household ID:", row.id);
                setSelectedRow(row);
                setDeleteOpen(true);
              }}
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
    const fetchHouseholds = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found — please log in');
          return;
        }

        console.log('Fetching households with token:', token.substring(0, 10) + '...');

        const response = await axios.get('http://localhost:5000/api/households', {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Raw response:', response.data);

        const fetchedRows = response.data.map((household, index) => {
          console.log('Household row:', household);
          return {
            id: household.household_id || index + 1,
            no: index + 1,
            headFullName: household.headFullName || '',
            address: household.address || '',
            headCount: household.headCount || 1,
            // Optional extra fields (if your backend returns them)
            created_by: household.created_by,
            created_at: household.created_at,
            created_by_name: household.created_by_name,
            updated_by: household.updated_by,
            updated_at: household.updated_at,
            updated_by_name: household.updated_by_name,
          };
        });

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
        setRows([]); // clear on error
      } finally {
        setLoading(false);
      }
    };

    fetchHouseholds();
  }, [refreshKey]);

  return (
    <Box sx={{ height: 550, width: 1600 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          hideFooter
          showToolbar
          slots={{
            toolbar: HouseholdsToolbar,
          }}
          slotProps={{
            toolbar: {
              onAddSuccess: () => setRefreshKey((prev) => prev + 1),
              // onApplyFilters: your filter handler if needed
            },
          }}
        />

      {/* Info Popper */}
      <Popper open={infoOpen} anchorEl={infoAnchorEl} placement="left-start" disablePortal>
        <Paper elevation={3} sx={{ p: 1, maxWidth: 220 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>INFO</Typography>
          <Typography variant="body2">Created by: {selectedRow?.created_by_name || 'N/A'}</Typography>
          <Typography variant="body2">Created at: {selectedRow?.created_at || 'N/A'}</Typography>
          <Typography variant="body2">Updated by: {selectedRow?.updated_by_name || 'N/A'}</Typography>
          <Typography variant="body2">Updated at: {selectedRow?.updated_at || 'N/A'}</Typography>
        </Paper>
      </Popper>

      {/* Edit & Delete Modals (uncomment when ready) */}
      <EditHouseholdModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedRow(null);
        }}
        householdId={selectedRow?.id || selectedRow?.household_id}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
          setEditOpen(false);
        }}
      />

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

export default HouseholdsTable;
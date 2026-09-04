// AccountsTable.jsx
import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditAccountModal from '../../modals/EditAccountModal';
import ResetPasswordModal from '../../modals/ResetPasswordModal';
import AccountsToolbar from './AccountsToolbar';
import DeleteConfirmModal from '../../modals/DeleteAccountModal';
import InfoPopper from '../../Reusables/InfoPopper.jsx';
import axios from 'axios';

const UsersTable = () => {
  const [rows, setRows] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    role: 'All',
    status: 'All',
  });

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
      sortable: false 
    },
    { field: "username",
      headerName: "Username",
      width: 250,
      sortable: true 
    },
    { field: "fullName",
      headerName: "Full Name",
      width: 300,
      sortable: true 
    },
    {
      field: "role",
      headerName: "Role",
      width: 130,
      type: "string",
      align: "left",
      headerAlign: "left",
      sortable: true,
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      type: "string",
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
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <IconButton size="small" color="primary" onClick={() => { setSelectedRow(row); setEditOpen(true); }}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="warning" onClick={() => { setSelectedRow(row); setResetPasswordOpen(true); }} title="Reset Password">
              <KeyIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => { setSelectedRow(row); setDeleteOpen(true); }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onMouseEnter={(e) => handleInfoEnter(e, row)} onMouseLeave={handleInfoLeave}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found — please log in');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedRows = response.data.map((user, index) => ({
          id: user.user_id || index + 1,
          no: index + 1,
          username: user.username || '',
          fullName: user.fullname || '',
          role: user.role || '',
          status: user.status || '',
          created_by: user.created_by,
          created_at: user.created_at,
          created_by_name: user.created_by_name,
          updated_by: user.updated_by,
          updated_at: user.updated_at,
          updated_by_name: user.updated_by_name,
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
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [refreshKey]);

  // Handle filter updates from toolbar
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Derived filtered rows
  const filteredRows = rows.filter((row) => {
    if (searchValue) {
      const search = searchValue.toLowerCase();
      const matchesSearch =
        row.username?.toLowerCase().includes(search) ||
        row.fullName?.toLowerCase().includes(search) ||
        row.role?.toLowerCase().includes(search) ||
        row.status?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    if (filters.role !== 'All' && row.role !== filters.role) return false;
    if (filters.status !== 'All' && row.status !== filters.status) return false;
    return true;
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DataGrid
        rows={filteredRows}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        hideFooter
        showToolbar
        sx={{ flex: 1, minHeight: 0 }}  // ✅
        slots={{ toolbar: AccountsToolbar }}
        slotProps={{
          toolbar: {
            onAddSuccess: () => setRefreshKey((prev) => prev + 1),
            onApplyFilters: handleApplyFilters,
            onSearchChange: (value) => setSearchValue(value),  // ✅
          },
        }}
      />

      {/* Info Popper */}
      <InfoPopper
        open={infoOpen}
        anchorEl={infoAnchorEl}
        fields={[
          { label: "Created by", value: selectedRow?.created_by_name },
          { label: "Created at", value: selectedRow?.created_at },
          { label: "Updated by", value: selectedRow?.updated_by_name },
          { label: "Updated at", value: selectedRow?.updated_at },
        ]}
      />

      {/* Edit & Delete Modals (uncomment when ready) */}
      <EditAccountModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedRow(null); }}
        userId={selectedRow?.id || selectedRow?.user_id}
        onSuccess={() => { setRefreshKey(prev => prev + 1); setEditOpen(false); }}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelectedRow(null); }}
        onConfirm={() => setRefreshKey(prev => prev + 1)}
        target={selectedRow}
      />

      <ResetPasswordModal
        open={resetPasswordOpen}
        onClose={() => { setResetPasswordOpen(false); setSelectedRow(null); }}
        userId={selectedRow?.id || selectedRow?.user_id}
        onSuccess={() => { setRefreshKey(prev => prev + 1); }}
      />
    </Box>
  );
};

export default UsersTable;
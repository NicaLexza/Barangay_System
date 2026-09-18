// ResidentsArchivedTable.jsx
import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ResidentsArchivedToolbar from './ResidentsArchivedToolbar';
import InfoPopper from '../../Reusables/InfoPopper.jsx';
import ReAuthModal from '../../modals/ReAuthModal';
import axios from 'axios';

/** Decode role from token (client-side only, for UI gating — real
 * enforcement is server-side in residentArchiveController.js). */
const getRoleFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1])).role ?? null;
  } catch {
    return null;
  }
};

const ResidentsArchivedTable = () => {
  const [rows, setRows] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [reAuthOpen, setReAuthOpen] = useState(false);

  const isAdmin = getRoleFromToken() === 'Admin';

  const handleInfoEnter = (event, row) => {
    setSelectedRow(row);
    setInfoAnchorEl(event.currentTarget);
  };
  const handleInfoLeave = () => setInfoAnchorEl(null);
  const infoOpen = Boolean(infoAnchorEl);

  useEffect(() => {
    const fetchArchived = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/residents/archived', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedRows = res.data.map((r, index) => ({
          id: r.resident_id,
          no: index + 1,
          fullName: r.fullName || '',
          birthdate: r.birthdate || '',
          sex: r.sex || '',
          civilStatus: r.civilStatus || '',
          address: r.address || '',
          archived_at: r.archived_at,
          archived_by_name: r.archived_by_name,
        }));

        setRows(fetchedRows);
      } catch (err) {
        console.error('Failed to fetch archived residents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArchived();
  }, [refreshKey]);

  const handleRestoreClick = (row) => {
    setSelectedRow(row);
    setReAuthOpen(true);
  };

  const executeRestore = async () => {
    if (!selectedRow) return;
    setRestoringId(selectedRow.id);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/residents/archived/${selectedRow.id}/restore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to restore resident:', err);
      alert(err.response?.data?.message || 'Failed to restore resident');
    } finally {
      setRestoringId(null);
      setReAuthOpen(false);
      setSelectedRow(null);
    }
  };

  const filteredRows = rows.filter((row) => {
    if (!searchValue) return true;
    const search = searchValue.toLowerCase();
    return (
      row.fullName?.toLowerCase().includes(search) ||
      row.sex?.toLowerCase().includes(search) ||
      row.civilStatus?.toLowerCase().includes(search) ||
      row.address?.toLowerCase().includes(search)
    );
  });

  const columns = [
    { field: 'no', headerName: 'No.', width: 70, sortable: false },
    { field: 'fullName', headerName: 'Full Name', width: 220 },
    { field: 'birthdate', headerName: 'Birthdate', width: 120 },
    { field: 'sex', headerName: 'Sex', width: 90 },
    { field: 'civilStatus', headerName: 'Civil Status', width: 130 },
    { field: 'address', headerName: 'Address', width: 180 },
    { field: 'archived_at', headerName: 'Archived At', width: 160 },
    { field: 'archived_by_name', headerName: 'Archived By', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      disableColumnMenu: true,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {isAdmin ? (
              <Tooltip title="Restore">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={restoringId === row.id}
                    onClick={() => handleRestoreClick(row)}
                  >
                    <RestoreIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title="Admin access only">
                <span>
                  <IconButton size="small" disabled>
                    <RestoreIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <DataGrid
        rows={filteredRows}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        hideFooter
        showToolbar
        sx={{ flex: 1, minHeight: 0 }}
        slots={{ toolbar: ResidentsArchivedToolbar }}
        slotProps={{
          toolbar: {
            onSearchChange: (value) => setSearchValue(value),
            archivedCount: rows.length,
          },
        }}
        localeText={{ noRowsLabel: 'No archived residents.' }}
      />

      <InfoPopper
        open={infoOpen}
        anchorEl={infoAnchorEl}
        fields={[
          { label: 'Archived by', value: selectedRow?.archived_by_name },
          { label: 'Archived at', value: selectedRow?.archived_at },
        ]}
      />

      <ReAuthModal
        open={reAuthOpen}
        onClose={() => {
          setReAuthOpen(false);
          setSelectedRow(null);
        }}
        onConfirm={executeRestore}
      />
    </Box>
  );
};

export default ResidentsArchivedTable;
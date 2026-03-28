// AccountsToolbar.jsx
import { useState } from 'react';
import {
  Box, Button, TextField, IconButton, Popover,
  Stack, Typography, FormControl, FormLabel,
  RadioGroup, FormControlLabel, Radio, Divider,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddAccountModal from '../../modals/AddAccountModal';

export default function AccountsToolbar({ onAddSuccess, onApplyFilters, onSearchChange }) {
  const [quickFilterValue, setQuickFilterValue] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openFilter = Boolean(anchorEl);
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');

  const handleQuickFilterChange = (e) => {
    const value = e.target.value;
    setQuickFilterValue(value);
    onSearchChange(value);
  };

  const handleFilterClick = (event) => setAnchorEl(event.currentTarget);
  const handleFilterClose = () => setAnchorEl(null);

  const applyFilters = () => {
    onApplyFilters({ role, status });
    handleFilterClose();
  };

  const clearFilters = () => {
    setRole('All');
    setStatus('All');
    onApplyFilters({ role: 'All', status: 'All' });
    handleFilterClose();
  };

  return (
    <>
      <Box
        sx={{
          backgroundColor: '#002f5944',
          borderBottom: '1px solid rgba(0, 47, 89, 0.2)',
        }}
      >
        {/* Top row — Title */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1, borderBottom: '1px solid rgba(0, 47, 89, 0.1)' }}>
          <Typography variant="h6" fontWeight="bold" color="#002f59">
            Accounts
          </Typography>
        </Box>

        {/* Bottom row — Search, Filter, Button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            padding: '8px 16px',
          }}
        >
          <TextField
            variant="outlined"
            size="small"
            placeholder="Quick search..."
            value={quickFilterValue}
            onChange={handleQuickFilterChange}
            sx={{
              minWidth: 220,
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': { borderRadius: 1 },
            }}
          />

          <IconButton onClick={handleFilterClick} sx={{ color: 'white' }}>
            <FilterListIcon />
          </IconButton>

          <Button
            variant="contained"
            size="small"
            sx={{ backgroundColor: '#002f59', '&:hover': { backgroundColor: '#001c38' } }}
            onClick={() => setOpenModal(true)}
          >
            + New Account
          </Button>
        </Box>
      </Box>

      {/* Filter Popover */}
      <Popover
        open={openFilter}
        anchorEl={anchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { width: 260, p: 2, boxShadow: 3 } }}
      >
        <Typography variant="h6" gutterBottom>Quick Filters</Typography>

        <Stack spacing={2.5}>
          <FormControl>
            <FormLabel>Role</FormLabel>
            <RadioGroup value={role} onChange={(e) => setRole(e.target.value)}>
              <FormControlLabel value="All"   control={<Radio />} label="All" />
              <FormControlLabel value="Admin" control={<Radio />} label="Admin" />
              <FormControlLabel value="Staff" control={<Radio />} label="Staff" />
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>Status</FormLabel>
            <RadioGroup value={status} onChange={(e) => setStatus(e.target.value)}>
              <FormControlLabel value="All"      control={<Radio />} label="All" />
              <FormControlLabel value="Active"   control={<Radio />} label="Active" />
              <FormControlLabel value="Inactive" control={<Radio />} label="Inactive" />
            </RadioGroup>
          </FormControl>

          <Divider />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={clearFilters}>Clear</Button>
            <Button variant="contained" onClick={applyFilters}>Apply</Button>
          </Stack>
        </Stack>
      </Popover>

      <AddAccountModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onAddSuccess}
      />
    </>
  );
}
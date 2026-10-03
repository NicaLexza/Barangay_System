// AccountsToolbar.jsx
import { useState } from 'react';
import {
  Box, Button, TextField, IconButton, Popover,
  Stack, Typography, Divider,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddAccountModal from '../../modals/AddAccountModal';
import {
  FilterSection,
  FilterToggle,
  filterPopoverPaperSx,
} from '../../Reusables/FilterControls.jsx';

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
          backgroundColor: '#E0F2FF',
          borderBottom: '1px solid rgba(0, 47, 89, 0.2)',
        }}
      >
        {/* Top row — Title */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1,}}>
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

      {/* Filter Popover — compact controls shared with Residents / Entries */}
      <Popover
        open={openFilter}
        anchorEl={anchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: filterPopoverPaperSx }}
      >
        <Typography variant="subtitle1" fontWeight={700} color="#002f59" gutterBottom>
          Quick Filters
        </Typography>

        <Stack spacing={2}>
          <FilterSection label="Role">
            <FilterToggle
              value={role}
              onChange={setRole}
              options={['All', 'Admin', 'Staff'].map((v) => ({ value: v, label: v }))}
            />
          </FilterSection>

          <FilterSection label="Status">
            <FilterToggle
              value={status}
              onChange={setStatus}
              options={['All', 'Active', 'Inactive'].map((v) => ({ value: v, label: v }))}
            />
          </FilterSection>

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
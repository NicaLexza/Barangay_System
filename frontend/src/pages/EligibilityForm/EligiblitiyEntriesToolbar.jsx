import { useState } from 'react';
import {
  Box, Button, TextField, IconButton, Popover, Stack,
  Typography, FormControl, FormLabel, RadioGroup,
  FormControlLabel, Radio, Divider,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate } from 'react-router-dom';

export default function EligibilityEntriesToolbar({
  onApplyFilters,
  onSearchChange,
  onPrint,
  formName,
  entryCount,
}) {
  const [quickFilterValue, setQuickFilterValue] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [rewardedStatus, setRewardedStatus] = useState('All');
  const openFilter = Boolean(anchorEl);

  const navigate = useNavigate();

  const handleQuickFilterChange = (e) => {
    const value = e.target.value;
    setQuickFilterValue(value);
    onSearchChange(value);
  };

  const handleFilterClick = (event) => setAnchorEl(event.currentTarget);
  const handleFilterClose = () => setAnchorEl(null);

  const applyFilters = () => {
    onApplyFilters({ rewardedStatus });
    handleFilterClose();
  };

  const clearFilters = () => {
    setRewardedStatus('All');
    onApplyFilters({ rewardedStatus: 'All' });
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
        {/* Top row — back navigation + form name */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            pt: 1.5,
            pb: 1,
            borderBottom: '1px solid rgba(0, 47, 89, 0.1)',
          }}
        >
          <IconButton
            size="small"
            onClick={() => navigate('/Eligibility')}
            sx={{ color: '#002f59' }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight="bold" color="#002f59" lineHeight={1.2}>
              {formName || 'Eligibility Form'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </Typography>
          </Box>
        </Box>

        {/* Bottom row — search + filter + print */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1,
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
            startIcon={<PrintIcon />}
            onClick={onPrint}
            sx={{
              backgroundColor: '#002f59',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#001c38' },
            }}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Filter Panel */}
      <Popover
        open={openFilter}
        anchorEl={anchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { width: 280, p: 2, boxShadow: 3 } }}
      >
        <Typography variant="h6" gutterBottom>
          Quick Filters
        </Typography>

        <Stack spacing={2.5}>
          <FormControl>
            <FormLabel>Status</FormLabel>
            <RadioGroup
              value={rewardedStatus}
              onChange={(e) => setRewardedStatus(e.target.value)}
            >
              <FormControlLabel value="All"      control={<Radio />} label="All" />
              <FormControlLabel value="Received" control={<Radio />} label="Received" />
              <FormControlLabel value="Pending"  control={<Radio />} label="Pending" />
            </RadioGroup>
          </FormControl>

          <Divider />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={clearFilters}>Clear</Button>
            <Button variant="contained" onClick={applyFilters}>Apply</Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}
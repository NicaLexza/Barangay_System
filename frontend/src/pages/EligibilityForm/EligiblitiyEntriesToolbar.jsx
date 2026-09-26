import { useState } from 'react';
import {
  Box, Button, TextField, IconButton, Popover, Stack,
  Typography, FormControl, FormLabel, RadioGroup,
  FormControlLabel, Radio, Divider, Tabs, Tab, Badge,
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
  isArchived,
  activeTab = "Selected",
  onTabChange,
  selectedCount = 0,
  waitlistCount = 0,
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
          backgroundColor: '#E0F2FF',
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
          }}
        >
          <IconButton
            size="small"
            onClick={() => navigate(isArchived ? '/Eligibility/Archived' : '/Eligibility')}
            sx={{ color: '#002f59' }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight="bold" color="#002f59" lineHeight={1.2}>
              {formName || 'Eligibility Form'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {entryCount} {entryCount === 1 ? (activeTab === 'Selected' ? 'recipient' : 'entry') : (activeTab === 'Selected' ? 'recipients' : 'entries')}
            </Typography>
          </Box>
        </Box>

        {/* Selected / Waitlist tabs — Waitlist only exists for ranked
            (case 2) forms, but stays visible even at 0 so a form that
            once had a waitlist (before promotions/removals) is still
            reachable. */}
        <Tabs
          value={activeTab}
          onChange={(e, val) => onTabChange?.(val)}
          sx={{
            px: 2,
            minHeight: 40,
            '& .MuiTabs-indicator': { backgroundColor: '#002f59' },
          }}
        >
          <Tab
            value="Selected"
            sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }}
            label={
              <Badge
                badgeContent={selectedCount}
                color="primary"
                sx={{ '& .MuiBadge-badge': { right: -14, backgroundColor: '#002f59' } }}
              >
                <Box sx={{ pr: 1 }}>Selected</Box>
              </Badge>
            }
          />
          <Tab
            value="Waitlisted"
            sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }}
            label={
              <Badge
                badgeContent={waitlistCount}
                color="default"
                sx={{ '& .MuiBadge-badge': { right: -14, backgroundColor: '#78716c', color: '#fff' } }}
              >
                <Box sx={{ pr: 1 }}>Waitlist</Box>
              </Badge>
            }
          />
        </Tabs>

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
          {/* Received/Pending quick filter only applies to the Selected
              tab — waitlisted entries are never marked received. */}
          {activeTab === 'Selected' && (
            <IconButton onClick={handleFilterClick} sx={{ color: 'white' }}>
              <FilterListIcon />
            </IconButton>
          )}
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
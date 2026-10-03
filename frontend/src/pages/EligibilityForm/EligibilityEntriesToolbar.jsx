import { useState } from 'react';
import {
  Box, Button, TextField, IconButton, Popover, Stack,
  Typography, Divider, Tabs, Tab, Badge, Alert,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useNavigate } from 'react-router-dom';
import {
  FilterSection,
  FilterToggle,
  filterPopoverPaperSx,
} from '../../Reusables/FilterControls.jsx';

export default function EligibilityEntriesToolbar({
  onApplyFilters,
  onSearchChange,
  onPrint,
  onGenerateReport,
  formName,
  entryCount,
  isArchived,
  activeTab = "Selected",
  onTabChange,
  selectedCount = 0,
  waitlistCount = 0,
  removedCount = 0,
  archivedNeedsReplacementCount = 0,
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
            sx={{ minHeight: 40, minWidth: 130, px: 2.5, textTransform: 'none', fontWeight: 600 }}
            label={
              <Badge
                badgeContent={selectedCount}
                color="primary"
                sx={{ '& .MuiBadge-badge': { right: 0, backgroundColor: '#002f59' } }}
              >
                <Box sx={{ pr: 3 }}>Selected</Box>
              </Badge>
            }
          />
          <Tab
            value="Waitlisted"
            sx={{ minHeight: 40, minWidth: 130, px: 2.5, textTransform: 'none', fontWeight: 600 }}
            label={
              <Badge
                badgeContent={waitlistCount}
                color="default"
                sx={{ '& .MuiBadge-badge': { right: 0, backgroundColor: '#78716c', color: '#fff' } }}
              >
                <Box sx={{ pr: 3 }}>Waitlist</Box>
              </Badge>
            }
          />
          <Tab
            value="Removed"
            sx={{ minHeight: 40, minWidth: 130, px: 2.5, textTransform: 'none', fontWeight: 600 }}
            label={
              <Badge
                badgeContent={removedCount}
                color="error"
                sx={{ '& .MuiBadge-badge': { right: 0, backgroundColor: '#dc2626', color: '#fff' } }}
              >
                <Box sx={{ pr: 3 }}>Removed</Box>
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
          {activeTab === 'Selected' && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DescriptionOutlinedIcon />}
              onClick={onGenerateReport}
              sx={{
                color: '#002f59',
                borderColor: '#002f59',
                backgroundColor: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#001c38' },
              }}
            >
              Selection Report
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<PrintIcon />}
            onClick={onPrint}
            title={`Print ${activeTab} roster`}
            sx={{
              backgroundColor: '#002f59',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#001c38' },
            }}
          >
            {activeTab === 'Selected'
              ? 'Print (Selected)'
              : activeTab === 'Waitlisted'
              ? 'Print (Waitlist)'
              : 'Print (Removed)'}
          </Button>
        </Box>

        {activeTab === 'Selected' && archivedNeedsReplacementCount > 0 && (
          <Box sx={{ px: 2, pb: 1.25 }}>
            <Alert
              severity="warning"
              sx={{
                py: 0.25,
                px: 1.5,
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: '#fffbeb',
                color: '#92400e',
                border: '1px solid #fde68a',
                '& .MuiAlert-icon': { color: '#b45309', py: 0.25 },
              }}
            >
              {archivedNeedsReplacementCount} selected {archivedNeedsReplacementCount === 1 ? 'recipient has' : 'recipients have'} been archived in barangay records and {archivedNeedsReplacementCount === 1 ? 'needs' : 'need'} replacement.
            </Alert>
          </Box>
        )}
      </Box>

      {/* Filter Panel — compact controls shared with Residents / Accounts */}
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
          <FilterSection label="Status">
            <FilterToggle
              value={rewardedStatus}
              onChange={setRewardedStatus}
              options={['All', 'Received', 'Pending'].map((v) => ({ value: v, label: v }))}
            />
          </FilterSection>

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
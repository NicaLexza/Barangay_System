import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Popover,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArchiveIcon from '@mui/icons-material/Archive';
import AddResidentModal from '../../modals/AddResidentModal';
import ImportResidentModal from '../../modals/ImportResidentModal';
import BarChartIcon from '@mui/icons-material/BarChart';
import ResidentStatsModal from '../../modals/ResidentStatsModal';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import {
  FilterSection,
  FilterToggle,
  FilterChips,
  filterPopoverPaperSx,
} from '../../Reusables/FilterControls.jsx';

// NOTE: eligibility forms are no longer created from this page. They are
// created from the Eligibility page's "New Form" wizard, where the server
// builds the pool from criteria. `filteredRows` is still passed in because
// the Statistics modal reports on the current filtered view.
export default function ResidentsToolbar({ onAddSuccess, onApplyFilters, filteredRows, onSearchChange }) {
  const [quickFilterValue, setQuickFilterValue] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openFilter = Boolean(anchorEl);
  const [openStatsModal, setOpenStatsModal] = useState(false);
  const navigate = useNavigate();

  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [gender, setGender] = useState('All');
  const [civilStatuses, setCivilStatuses] = useState([]);
  const [employment, setEmployment] = useState('All');
  const [sectors, setSectors] = useState({ pwd: false, senior: false, solop: false });
  const [household, setHousehold] = useState('All');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const handleQuickFilterChange = (e) => {
    const value = e.target.value;
    setQuickFilterValue(value);
    onSearchChange(value);
  };

  const handleFilterClick = (event) => setAnchorEl(event.currentTarget);
  const handleFilterClose = () => setAnchorEl(null);

  const applyFilters = () => {
    onApplyFilters({ ageMin, ageMax, gender, civilStatuses, employment, sectors, household, dateFrom, dateTo });
    handleFilterClose();
  };

  const clearFilters = () => {
    setAgeMin('');
    setAgeMax('');
    setGender('All');
    setCivilStatuses([]);
    setEmployment('All');
    setSectors({ pwd: false, senior: false, solop: false });
    setHousehold('All');
    setDateFrom(null);
    setDateTo(null);
    onApplyFilters({
      ageMin: '', ageMax: '', gender: 'All',
      civilStatuses: [], employment: 'All',
      sectors: { pwd: false, senior: false, solop: false },
      household: 'All',
      dateFrom: null, dateTo: null,
    });
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
        {/* Top row — Page Title */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pt: 1.5,
            pb: 1,
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="#002f59">
            Residents
          </Typography>

        </Box>

        {/* Bottom row — Search, Filter, Buttons */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            padding: '8px 16px',
            flexWrap: 'wrap',
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
            + New Resident
          </Button>

          <Button
            variant="contained"
            size="small"
            sx={{ backgroundColor: '#5c6bc0', '&:hover': { backgroundColor: '#3949ab' } }}
            onClick={() => setOpenImportModal(true)}
          >
            Import
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<BarChartIcon />}
            sx={{ backgroundColor: '#0369a1', '&:hover': { backgroundColor: '#0c5a8a' } }}
            onClick={() => setOpenStatsModal(true)}
          >
            Statistics
          </Button>

          {/* Archived/Active toggle — pinned to the right end of this row.
              The archived page puts its "View Active" button in the same spot. */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArchiveIcon fontSize="small" />}
            onClick={() => navigate('/Residents/Archived')}
            sx={{
              ml: 'auto',
              textTransform: 'none',
              borderColor: '#78716c',
              color: '#57534e',
              fontWeight: 500,
              backgroundColor: '#fff',
              '&:hover': {
                borderColor: '#57534e',
                backgroundColor: '#f5f5f4',
              },
            }}
          >
            View Archived
          </Button>
        </Box>
      </Box>

      {/* Filter Panel — compact controls shared with Accounts / Entries */}
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
          <FilterSection label="Age Range">
            <Stack direction="row" spacing={1}>
              <TextField label="Min" type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} size="small" sx={{ flex: 1 }} />
              <TextField label="Max" type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} size="small" sx={{ flex: 1 }} />
            </Stack>
          </FilterSection>

          <FilterSection label="Gender">
            <FilterToggle
              value={gender}
              onChange={setGender}
              options={['All', 'Male', 'Female', 'Other'].map((v) => ({ value: v, label: v }))}
            />
          </FilterSection>

          <FilterSection label="Civil Status">
            <FilterChips
              selected={civilStatuses}
              onToggle={(status) =>
                setCivilStatuses((prev) =>
                  prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
                )
              }
              options={['Single', 'Married', 'Widowed', 'Divorced', 'Separated', 'Annulled'].map((v) => ({ value: v, label: v }))}
            />
          </FilterSection>

          <FilterSection label="Employment Status">
            <FilterToggle
              value={employment}
              onChange={setEmployment}
              options={['All', 'Employed', 'Unemployed'].map((v) => ({ value: v, label: v }))}
            />
          </FilterSection>

          <FilterSection label="Special Sector">
            <FilterChips
              selected={Object.keys(sectors).filter((k) => sectors[k])}
              onToggle={(key) => setSectors((prev) => ({ ...prev, [key]: !prev[key] }))}
              options={[
                { value: 'pwd', label: 'PWD' },
                { value: 'senior', label: 'Senior' },
                { value: 'solop', label: 'Solo Parent' },
              ]}
            />
          </FilterSection>

          <FilterSection label="Household">
            <FilterToggle
              value={household}
              onChange={setHousehold}
              options={[
                { value: 'All', label: 'All' },
                { value: 'Heads', label: 'Heads Only' },
                { value: 'Members', label: 'Members Only' },
              ]}
            />
          </FilterSection>

          <FilterSection label="Date Registered">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack direction="row" spacing={1}>
                <DatePicker
                  label="From"
                  value={dateFrom}
                  onChange={(newValue) => setDateFrom(newValue)}
                  slotProps={{ textField: { size: 'small', sx: { flex: 1, minWidth: 0 } } }}
                  format="MM/DD/YYYY"
                />
                <DatePicker
                  label="To"
                  value={dateTo}
                  onChange={(newValue) => setDateTo(newValue)}
                  slotProps={{ textField: { size: 'small', sx: { flex: 1, minWidth: 0 } } }}
                  format="MM/DD/YYYY"
                  minDate={dateFrom || undefined}
                />
              </Stack>
            </LocalizationProvider>
          </FilterSection>

          <Divider />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={clearFilters}>Clear</Button>
            <Button variant="contained" onClick={applyFilters}>Apply</Button>
          </Stack>
        </Stack>
      </Popover>

      <AddResidentModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onAddSuccess}
      />

      <ImportResidentModal
        open={openImportModal}
        onClose={() => setOpenImportModal(false)}
        onSuccess={onAddSuccess}
      />

      <ResidentStatsModal
        open={openStatsModal}
        onClose={() => setOpenStatsModal(false)}
        filteredRows={filteredRows}
      />
    </>
  );
}
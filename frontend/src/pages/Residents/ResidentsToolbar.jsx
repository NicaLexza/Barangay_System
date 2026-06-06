import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Popover,
  Stack,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Divider,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useGridApiContext } from '@mui/x-data-grid';
import AddResidentModal from '../../modals/AddResidentModal';
import AddEligibilityFormModal from '../../modals/AddEligibilityFormModal';
import ImportResidentModal from '../../modals/ImportResidentModal';
import { useNavigate, useLocation } from 'react-router-dom';
import BarChartIcon from '@mui/icons-material/BarChart';
import ResidentStatsModal from '../../modals/ResidentStatsModal';

export default function ResidentsToolbar({ onAddSuccess, onApplyFilters, filteredRows, onSearchChange }) {
  const [quickFilterValue, setQuickFilterValue] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openAddEligibilityModal, setOpenAddEligibilityModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openFilter = Boolean(anchorEl);
  const [openStatsModal, setOpenStatsModal] = useState(false);

  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [gender, setGender] = useState('All');
  const [civilStatuses, setCivilStatuses] = useState([]);
  const [employment, setEmployment] = useState('All');
  const [sectors, setSectors] = useState({ pwd: false, senior: false, solop: false });

  const navigate = useNavigate();
  const location = useLocation();
  const isResidentsView = location.pathname === '/Residents' || location.pathname === '/';

  const toggleNavigation = () => {
    if (isResidentsView) {
      navigate('/Households');
    } else {
      navigate('/Residents');
    }
  };

  const handleQuickFilterChange = (e) => {
    const value = e.target.value;
    setQuickFilterValue(value);
    onSearchChange(value);
  };

  const handleFilterClick = (event) => setAnchorEl(event.currentTarget);
  const handleFilterClose = () => setAnchorEl(null);

  const applyFilters = () => {
    onApplyFilters({ ageMin, ageMax, gender, civilStatuses, employment, sectors });
    handleFilterClose();
  };

  const clearFilters = () => {
    setAgeMin('');
    setAgeMax('');
    setGender('All');
    setCivilStatuses([]);
    setEmployment('All');
    setSectors({ pwd: false, senior: false, solop: false });
    onApplyFilters({
      ageMin: '', ageMax: '', gender: 'All',
      civilStatuses: [], employment: 'All',
      sectors: { pwd: false, senior: false, solop: false },
    });
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
        {/* ✅ Top row — Page Title */}
        <Box
          sx={{
            px: 2,
            pt: 1.5,
            pb: 1,
            borderBottom: '1px solid rgba(0, 47, 89, 0.1)',
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="#002f59">
            Residents
          </Typography>
        </Box>

        {/* ✅ Bottom row — Search, Filter, Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
            padding: '8px 16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left side: search + filter + action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
              sx={{ backgroundColor: '#002f59', '&:hover': { backgroundColor: '#001c38' } }}
              onClick={() => setOpenAddEligibilityModal(true)}
            >
              + Eligibility Form
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
          </Box>

          {/* Right side: navigation toggle */}
          <Button
            onClick={toggleNavigation}
            sx={{
              color: 'white',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { color: '#fff176' },
            }}
          >
            {isResidentsView ? 'Households' : 'Residents'}
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
        PaperProps={{ sx: { width: 320, p: 2, boxShadow: 3 } }}
      >
        <Typography variant="h6" gutterBottom>
          Quick Filters
        </Typography>

        <Stack spacing={2.5}>
          <FormControl>
            <FormLabel>Age Range</FormLabel>
            <Stack direction="row" spacing={1}>
              <TextField label="Min" type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} size="small" sx={{ width: 120 }} />
              <TextField label="Max" type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} size="small" sx={{ width: 120 }} />
            </Stack>
          </FormControl>

          <FormControl>
            <FormLabel>Gender</FormLabel>
            <RadioGroup row value={gender} onChange={(e) => setGender(e.target.value)}>
              <FormControlLabel value="All"    control={<Radio />} label="All" />
              <FormControlLabel value="Male"   control={<Radio />} label="Male" />
              <FormControlLabel value="Female" control={<Radio />} label="Female" />
              <FormControlLabel value="Other"  control={<Radio />} label="Other" />
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>Civil Status</FormLabel>
            <FormGroup row>
              {['Single', 'Married', 'Widowed', 'Divorced', 'Separated', 'Annulled'].map(status => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={civilStatuses.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCivilStatuses([...civilStatuses, status]);
                        } else {
                          setCivilStatuses(civilStatuses.filter(s => s !== status));
                        }
                      }}
                    />
                  }
                  label={status}
                />
              ))}
            </FormGroup>
          </FormControl>

          <FormControl>
            <FormLabel>Employment Status</FormLabel>
            <RadioGroup row value={employment} onChange={(e) => setEmployment(e.target.value)}>
              <FormControlLabel value="All"        control={<Radio />} label="All" />
              <FormControlLabel value="Employed"   control={<Radio />} label="Employed" />
              <FormControlLabel value="Unemployed" control={<Radio />} label="Unemployed" />
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>Special Sector</FormLabel>
            <FormGroup row>
              <FormControlLabel
                control={<Checkbox checked={sectors.pwd}    onChange={e => setSectors({ ...sectors, pwd: e.target.checked })} />}
                label="PWD"
              />
              <FormControlLabel
                control={<Checkbox checked={sectors.senior} onChange={e => setSectors({ ...sectors, senior: e.target.checked })} />}
                label="Senior"
              />
              <FormControlLabel
                control={<Checkbox checked={sectors.solop}  onChange={e => setSectors({ ...sectors, solop: e.target.checked })} />}
                label="Solo Parent"
              />
            </FormGroup>
          </FormControl>

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

      <AddEligibilityFormModal
        open={openAddEligibilityModal}
        onClose={() => setOpenAddEligibilityModal(false)}
        onSuccess={onAddSuccess}
        filteredRows={filteredRows}
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
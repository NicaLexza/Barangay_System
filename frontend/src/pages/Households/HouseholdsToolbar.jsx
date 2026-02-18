// HouseholdsToolbar.jsx
import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
} from '@mui/material';
import { useGridApiContext } from '@mui/x-data-grid';
import AddHouseholdModal from '../../modals/AddHouseholdModal';
import { useNavigate, useLocation } from 'react-router-dom';

export default function HouseholdsToolbar({ onAddSuccess }) {
  const apiRef = useGridApiContext();
  const [quickFilterValue, setQuickFilterValue] = useState('');
  const [openModal, setOpenModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const isHouseholdsView = location.pathname === '/Households';

  const toggleNavigation = () => {
    if (isHouseholdsView) {
      navigate('/Residents');
    } else {
      navigate('/Households');
    }
  };

  const handleQuickFilterChange = (e) => {
    const value = e.target.value;
    setQuickFilterValue(value);
    apiRef.current.setQuickFilterValues(value ? [value] : []);
  };

  return (
    <>
      <Box
        sx={{
          backgroundColor: '#002f5944',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          padding: '8px 16px',
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(0, 47, 89, 0.2)',
        }}
      >
        {/* Left side: search + add button */}
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

          <Button
            variant="contained"
            size="small"
            sx={{
              backgroundColor: '#002f59',
              '&:hover': { backgroundColor: '#001c38' },
            }}
            onClick={() => setOpenModal(true)}
          >
            + New Household
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
          {isHouseholdsView ? 'Residents' : 'Households'}
        </Button>
      </Box>

      <AddHouseholdModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onAddSuccess}
      />
    </>
  );
}
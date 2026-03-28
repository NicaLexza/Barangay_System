import { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import AddHouseholdModal from '../../modals/AddHouseholdModal';
import { useNavigate, useLocation } from 'react-router-dom';

export default function HouseholdsToolbar({ onAddSuccess, onSearchChange }) {
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
    onSearchChange(value); // ✅ lifts search up to HouseholdsTable
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
            Households
          </Typography>
        </Box>

        {/* ✅ Bottom row — Search + Buttons */}
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
              sx={{ backgroundColor: '#002f59', '&:hover': { backgroundColor: '#001c38' } }}
              onClick={() => setOpenModal(true)}
            >
              + New Household
            </Button>
          </Box>

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
      </Box>

      <AddHouseholdModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onAddSuccess}
      />
    </>
  );
}
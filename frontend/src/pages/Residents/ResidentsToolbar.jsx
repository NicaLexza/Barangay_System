// ResidentsToolbar.jsx
import { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import AddResidentModal from '../../modals/AddResidentModal.jsx';

export default function ResidentsToolbar({ onAddSuccess }) {
  const [quickFilterValue, setQuickFilterValue] = useState('');
  const [openModal, setOpenModal] = useState(false);

  const handleQuickFilterChange = (e) => {
    const value = e.target.value;
    setQuickFilterValue(value);
    console.log('Quick filter:', value);
    // Later: connect to grid API if needed
  };

  return (
    <>
      <Box
        sx={{
          backgroundColor: '#002f5944',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 1.5,
          padding: '8px 16px',
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(0, 47, 89, 0.2)',
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

        <Button
          variant="contained"
          size="small"
          sx={{
            backgroundColor: '#002f59',
            '&:hover': { backgroundColor: '#001c38' },
          }}
          onClick={() => setOpenModal(true)}
        >
          + New Resident
        </Button>

        {/* Add your other buttons here if needed */}
      </Box>

      <AddResidentModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onAddSuccess}
      />
    </>
  );
}
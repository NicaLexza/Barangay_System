import { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { useNavigate } from 'react-router-dom';

export default function ResidentsArchivedToolbar({ onSearchChange, archivedCount }) {
  const [quickFilterValue, setQuickFilterValue] = useState('');
  const navigate = useNavigate();

  const handleQuickFilterChange = (e) => {
    const value = e.target.value;
    setQuickFilterValue(value);
    onSearchChange(value);
  };

  return (
    <Box
      sx={{
        backgroundColor: '#E0F2FF',
        borderBottom: '1px solid rgba(0, 47, 89, 0.2)',
      }}
    >
      {/* Top row — title only (navigation lives in the row below) */}
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
        <ArchiveIcon sx={{ color: '#78716c', fontSize: 22 }} />
        <Box>
          <Typography variant="h6" fontWeight="bold" color="#002f59" lineHeight={1.2}>
            Archived Residents
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {archivedCount} {archivedCount === 1 ? 'record' : 'records'}
          </Typography>
        </Box>
      </Box>

      {/* Bottom row — search + View Active toggle (same right-end slot as
          "View Archived" on the active Residents page) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1 }}>
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
          variant="outlined"
          size="small"
          startIcon={<PeopleAltOutlinedIcon fontSize="small" />}
          onClick={() => navigate('/Residents')}
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
          View Active
        </Button>
      </Box>
    </Box>
  );
}
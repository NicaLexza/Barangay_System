import { useState } from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArchiveIcon from '@mui/icons-material/Archive';
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
      {/* Top row — back navigation + title */}
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
          onClick={() => navigate('/Residents')}
          sx={{ color: '#002f59' }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
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

      {/* Bottom row — search */}
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
      </Box>
    </Box>
  );
}
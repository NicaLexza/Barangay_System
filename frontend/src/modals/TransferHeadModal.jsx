import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import axios from 'axios';
import StarsIcon from '@mui/icons-material/Stars';

const TransferHeadModal = ({ open, onClose, onSuccess, member }) => {
  const [loading, setLoading] = useState(false);

  if (!member) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/residents/household/${member.head_resident_id}/transfer/${member.resident_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Transfer headship failed:', error);
      alert(error.response?.data?.message || 'Failed to transfer headship.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#f0f9ff', color: '#002f59', display: 'flex', alignItems: 'center', gap: 1 }}>
        <StarsIcon color="info" /> Make Household Head
      </DialogTitle>
      <DialogContent sx={{ pt: '20px !important' }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          You are about to make <strong>{member.fullName}</strong> the new head of their household.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The current household head will be demoted to a member under {member.fullName}, and all other household members will automatically be updated to reflect the new head.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Their address will automatically be copied from the current household head.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color="info"
          disableElevation
        >
          {loading ? 'Processing...' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferHeadModal;

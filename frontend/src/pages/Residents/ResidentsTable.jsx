import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import ResidentsToolbar from './ResidentsToolbar';
import axios from 'axios';

const ResidentsTable = () => {
  const [allRows, setAllRows] = useState([]);  // original data
  const [rows, setRows] = useState([]);        // filtered data
  const [refreshKey, setRefreshKey] = useState(0);

  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const columns = [
    { field: "no", headerName: "No.", width: 70, sortable: false },
    { field: "fullName", headerName: "Full Name", width: 220 },
    {
      field: "age",
      headerName: "Age",
      width: 90,
      valueGetter: (value, row) => calculateAge(row.birthdate),
      type: "number",
      align: "left",
      headerAlign: "left",
    },
    { field: "sex", headerName: "Sex", width: 90 },
    { field: "birthdate", headerName: "Birthdate", width: 130 },
    { field: "address", headerName: "Address", width: 150 },
    { field: "civilStatus", headerName: "Civil Status", width: 130 },
    { field: "occupation", headerName: "Occupation", width: 160 },
    { field: "citizenship", headerName: "Citizenship", width: 140 },
    { field: "specialSector", headerName: "Special Sector", width: 180 },
    { field: "actions", headerName: "Actions", width: 150, disableColumnMenu: true },
  ];

  // --- Manual stacked filter function ---
  const applyManualFilters = (filters) => {
    const { ageMin, ageMax, gender, civilStatuses, employment, sectors } = filters;

    const filtered = allRows.filter((row) => {
      const age = calculateAge(row.birthdate);
      const sectorArray = row.specialSector?.split(',').map(s => s.trim()) || [];
       

      // Age range
      if (ageMin !== '' && (age === null || age < Number(ageMin))) return false;
      if (ageMax !== '' && (age === null || age > Number(ageMax))) return false;

      // Gender
      if (gender !== 'All' && row.sex !== gender) return false;

      // Civil Status (multi-select OR)
      if (civilStatuses.length > 0 && !civilStatuses.includes(row.civilStatus)) return false;

      // Employment
      if (employment === 'Employed' && !row.occupation) return false;
      if (employment === 'Unemployed' && row.occupation) return false;

      // Special Sector (AND)
      if (sectors.pwd && !sectorArray.includes('PD')) return false;
      if (sectors.senior && !sectorArray.includes('S')) return false;
      if (sectors.solop && !sectorArray.includes('SP')) return false;

      return true; // passed all filters
    });

    setRows(filtered);
  };

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found — please log in');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/residents', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedRows = response.data.map((resident, index) => ({
          id: resident.resident_id || index + 1,
          no: index + 1,
          fullName: resident.fullName,
          sex: resident.sex,
          birthdate: resident.birthdate,
          address: resident.address,
          civilStatus: resident.civilStatus,
          occupation: resident.occupation,
          citizenship: resident.citizenship,
          specialSector: resident.specialSector,
        }));

        setAllRows(fetchedRows);
        setRows(fetchedRows);
      } catch (error) {
        console.error('Error fetching residents:', error);
      }
    };

    fetchResidents();
  }, [refreshKey]);

  return (
    <Box sx={{ height: 550, width: 1600 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        hideFooter
        showToolbar
        slots={{ toolbar: ResidentsToolbar }}
        slotProps={{
          toolbar: {
            onAddSuccess: () => setRefreshKey((prev) => prev + 1),
            onApplyFilters: applyManualFilters, // pass manual filter to toolbar
          },
        }}
      />
    </Box>
  );
};

export default ResidentsTable;

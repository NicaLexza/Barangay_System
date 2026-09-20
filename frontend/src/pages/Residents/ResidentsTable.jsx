import { useState, useEffect, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, IconButton, Typography, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import ResidentsToolbar from './ResidentsToolbar';
import EditResidentModal from '../../modals/EditResidentModal';
import ArchiveResidentModal from '../../modals/ArchiveResidentModal';
import TransferHeadModal from '../../modals/TransferHeadModal';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import StarsIcon from '@mui/icons-material/Stars';
import InfoPopper from '../../Reusables/InfoPopper.jsx';
import axios from 'axios';
import dayjs from 'dayjs';

const ResidentsTable = () => {
  const [rows, setRows] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [transferHeadOpen, setTransferHeadOpen] = useState(false);
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [expandedHeads, setExpandedHeads] = useState(new Set());

  const toggleExpand = (headId) => {
    const newExpanded = new Set(expandedHeads);
    if (newExpanded.has(headId)) {
      newExpanded.delete(headId);
    } else {
      newExpanded.add(headId);
    }
    setExpandedHeads(newExpanded);
  };
  
  // Filter state
  const [filters, setFilters] = useState({
    ageMin: '',
    ageMax: '',
    gender: 'All',
    civilStatuses: [],
    employment: 'All',
    sectors: { pwd: false, senior: false, solop: false },
    household: 'All',
    dateFrom: null,
    dateTo: null,
  });

  // Info Anchor
  const handleInfoEnter = (event, row) => {
    setSelectedRow(row);
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoLeave = () => {
    setInfoAnchorEl(null);
  };

  const infoOpen = Boolean(infoAnchorEl);

  // Age calculation
  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return "—";
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : "—";
  };

  const columns = [
    { 
      field: "no", 
      headerName: "No.", 
      width: 70, 
      sortable: false,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: params.row.isSubRow ? 2 : 0 }}>
            {params.row.hierarchicalNo}
          </Box>
        );
      }
    },
    {
      field: "fullName",
      headerName: "Full Name",
      width: 240,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%', ml: row.isSubRow ? 3 : 0 }}>
            {row.isExpandable && (
              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); toggleExpand(row.id); }} 
                sx={{ p: 0, mr: -0.5 }}
              >
                {row.isExpanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
              </IconButton>
            )}
            {!row.isExpandable && !row.isSubRow && <Box sx={{ width: 24, height: 24, mr: -0.5 }} />}
            
            <Typography variant="body2" noWrap>{row.fullName}</Typography>
            
            {row.is_household_head === 1 && (
              <Chip
                icon={<PeopleAltIcon sx={{ fontSize: '12px !important' }} />}
                label={row.member_count ?? 1}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: '#e3f2fd',
                  color: '#1565c0',
                  '& .MuiChip-icon': { color: '#1565c0' },
                  flexShrink: 0,
                }}
              />
            )}
          </Box>
        );
      },
    },
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
    { field: "birthplace", headerName: "Birthplace", width: 120 },
    { field: "address", headerName: "Address", width: 150 },
    { field: "civilStatus", headerName: "Civil Status", width: 130 },
    { field: "occupation", headerName: "Occupation", width: 160 },
    { field: "citizenship", headerName: "Citizenship", width: 140 },
    { field: "specialSector", headerName: "Special Sector", width: 130 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      disableColumnMenu: true,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setSelectedRow(row);
                setEditOpen(true);
              }}
              title="Edit"
            >
              <EditIcon fontSize="small" />
            </IconButton>

            {row.isSubRow && (
              <IconButton
                size="small"
                color="info"
                onClick={() => {
                  setSelectedRow(row);
                  setTransferHeadOpen(true);
                }}
                title="Make Household Head"
              >
                <StarsIcon fontSize="small" />
              </IconButton>
            )}

            <IconButton
              size="small"
              onClick={() => {
                setSelectedRow(row);
                setArchiveOpen(true);
              }}
              sx={{ color: '#78716c' }}
              title="Archive"
            >
              <ArchiveIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onMouseEnter={(e) => handleInfoEnter(e, row)}
              onMouseLeave={() => handleInfoLeave()}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found — please log in');
          return;
        }

        // Backend already excludes archived residents (is_archived = 0) —
        // see residentController.js. Archived residents live only on the
        // separate /Residents/Archived page.
        const response = await axios.get('http://localhost:5000/api/residents', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedRows = response.data.map((resident, index) => ({
          id: resident.resident_id || index + 1,
          no: index + 1,
          fullName: resident.fullName || '',
          sex: resident.sex || '',
          birthdate: resident.birthdate || '',
          birthplace: resident.birthplace || '',
          address: resident.address || '',
          civilStatus: resident.civilStatus || resident.civil_status || '',
          occupation: resident.occupation || '',
          citizenship: resident.citizenship || '',
          specialSector: resident.specialSector || 'None',
          is_household_head: resident.is_household_head ?? 0,
          head_resident_id: resident.head_resident_id ?? null,
          member_count: resident.member_count ?? null,
          created_by: resident.created_by,
          created_at: resident.created_at,
          created_by_name: resident.created_by_name,
          updated_by: resident.updated_by,
          updated_at: resident.updated_at,
          updated_by_name: resident.updated_by_name,
        }));

        setRows(fetchedRows);
      } catch (error) {
        console.error('Fetch error details:', error);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Request error:', error.message);
        }
      }
    };

    fetchResidents();
  }, [refreshKey]);

  // Handle filter updates
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Filter rows based on active filters
  const filteredRows = rows.filter((row) => {
    // Search filter
    if (searchValue) {
      const search = searchValue.toLowerCase();
      const matchesSearch =
        row.fullName?.toLowerCase().includes(search) ||
        row.sex?.toLowerCase().includes(search) ||
        row.birthplace?.toLowerCase().includes(search) ||
        row.address?.toLowerCase().includes(search) ||
        row.civilStatus?.toLowerCase().includes(search) ||
        row.occupation?.toLowerCase().includes(search) ||
        row.citizenship?.toLowerCase().includes(search) ||
        row.specialSector?.toLowerCase().includes(search);

      if (!matchesSearch) return false;
    }

    // Split specialSector string for exact matching
    const sectorArray = row.specialSector?.split(',').map(s => s.trim()) || [];
    
    // Special sector filters - exact match
    if (filters.sectors.pwd && !sectorArray.includes('PD')) return false;
    if (filters.sectors.senior && !sectorArray.includes('S')) return false;
    if (filters.sectors.solop && !sectorArray.includes('SP')) return false;
    
    // Age filters
    const age = calculateAge(row.birthdate);
    if (filters.ageMin && age !== "—" && age < Number(filters.ageMin)) return false;
    if (filters.ageMax && age !== "—" && age > Number(filters.ageMax)) return false;
    
    // Gender filter
    if (filters.gender !== 'All' && row.sex !== filters.gender) return false;
    
    // Civil status filter
    if (filters.civilStatuses.length > 0 && !filters.civilStatuses.includes(row.civilStatus)) return false;
    
    // Employment filter
    if (filters.employment !== 'All') {
      if (filters.employment === 'Employed' && !row.occupation) return false;
      if (filters.employment === 'Unemployed' && row.occupation) return false;
    }

    // Household filter
    if (filters.household === 'Heads' && row.is_household_head !== 1) return false;
    if (filters.household === 'Members' && row.is_household_head === 1) return false;

    // Date Registered filter (based on created_at)
    if (filters.dateFrom) {
      if (!row.created_at || dayjs(row.created_at).isBefore(dayjs(filters.dateFrom).startOf('day'))) return false;
    }
    if (filters.dateTo) {
      if (!row.created_at || dayjs(row.created_at).isAfter(dayjs(filters.dateTo).endOf('day'))) return false;
    }
    
    return true;
  });

  const hierarchicalRows = useMemo(() => {
    // 1. Separate heads and members from the filtered list
    const heads = [];
    const membersByHead = {};
    const orphanedMembers = [];

    filteredRows.forEach(row => {
      if (row.is_household_head === 1) {
        heads.push(row);
        membersByHead[row.id] = [];
      }
    });

    filteredRows.forEach(row => {
      if (row.is_household_head === 0) {
        if (membersByHead[row.head_resident_id]) {
          membersByHead[row.head_resident_id].push(row);
        } else {
          // If the member matches filters but the head doesn't, treat as orphaned/top-level
          orphanedMembers.push(row);
        }
      }
    });

    // 2. Build the final array
    const result = [];
    let headCounter = 1;

    heads.forEach(head => {
      const headMembers = membersByHead[head.id] || [];
      const hasMembers = headMembers.length > 0;
      
      result.push({
        ...head,
        hierarchicalNo: headCounter,
        isExpandable: hasMembers,
        isExpanded: expandedHeads.has(head.id),
      });

      if (hasMembers && expandedHeads.has(head.id)) {
        headMembers.forEach((member, mIdx) => {
          result.push({
            ...member,
            hierarchicalNo: `${headCounter}.${mIdx + 1}`,
            isSubRow: true,
          });
        });
      }

      headCounter++;
    });

    // Append any orphaned members at the end
    orphanedMembers.forEach(orphan => {
      result.push({
        ...orphan,
        hierarchicalNo: headCounter,
        isExpandable: false,
        isExpanded: false,
      });
      headCounter++;
    });

    return result;
  }, [filteredRows, expandedHeads]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <DataGrid
        rows={hierarchicalRows}
        columns={columns}
        getRowId={(row) => row.id}
        hideFooter
        showToolbar
        sx={{ flex: 1, minHeight: 0 }}
        slots={{
          toolbar: ResidentsToolbar,
        }}
        slotProps={{
          toolbar: {
            onAddSuccess: () => setRefreshKey((prev) => prev + 1),
            onApplyFilters: handleApplyFilters,
            filteredRows,
            onSearchChange: (value) => setSearchValue(value),
          },
        }}
      />

      {/* Info popper shown on hover */}
      <InfoPopper
        open={infoOpen}
        anchorEl={infoAnchorEl}
        fields={[
          { label: "Created by", value: selectedRow?.created_by_name },
          { label: "Created at", value: selectedRow?.created_at },
          { label: "Updated by", value: selectedRow?.updated_by_name },
          { label: "Updated at", value: selectedRow?.updated_at },
        ]}
      />

      {/* Edit Modal */}
      <EditResidentModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedRow(null);
        }}
        residentId={selectedRow?.id || selectedRow?.resident_id}
        resident={selectedRow}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
          setEditOpen(false);
        }}
      />

      {/* Archive Confirmation — replaces the old hard-delete confirmation.
          Residents are never permanently deleted anymore; this just flips
          is_archived on and removes them from this active list. */}
      <ArchiveResidentModal
        open={archiveOpen}
        onClose={() => {
          setArchiveOpen(false);
          setSelectedRow(null);
        }}
        onConfirm={() => setRefreshKey(prev => prev + 1)}
        target={selectedRow}
      />

      <TransferHeadModal
        open={transferHeadOpen}
        onClose={() => {
          setTransferHeadOpen(false);
          setSelectedRow(null);
        }}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
        member={selectedRow}
      />
    </Box>
  );
};

export default ResidentsTable;
import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser } from '../utils/storage';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Avatar, Button, Stack, TextField, MenuItem, FormControl, InputLabel, Select, Snackbar, Alert, IconButton
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import UserDetails from './UserDetails';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

export default function UserList({ users, setUsers }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCourse, setFilterCourse] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [detailUser, setDetailUser] = useState(null); // NEW: selected user for details

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  // استخراج لیست دوره‌ها
  const allCourses = Array.from(new Set(users.map(u => (u.bootcampType ? `${u.bootcampType}${u.bootcampRound || ''}` : null)).filter(Boolean)));

  // فیلتر و جستجو
  let filteredUsers = users;
  if (search) filteredUsers = filteredUsers.filter(u => (`${u.name} ${u.family}`).toLowerCase().includes(search.toLowerCase()));
  if (filterType !== 'all') {
    if (filterType === 'forced') filteredUsers = filteredUsers.filter(u => u.type === 'cowork-forced');
    if (filterType === 'bootcamp') filteredUsers = filteredUsers.filter(u => u.isBootcamp && u.type !== 'cowork-forced');
    if (filterType === 'normal') filteredUsers = filteredUsers.filter(u => !u.isBootcamp && u.type !== 'cowork-forced');
  }
  if (filterCourse) filteredUsers = filteredUsers.filter(u => (u.bootcampType ? `${u.bootcampType}${u.bootcampRound || ''}` : '') === filterCourse);

  const handleDelete = (userId) => {
    if (window.confirm('آیا از حذف این کاربر مطمئن هستید؟')) {
      deleteUser(userId);
      if (setUsers) setUsers(getUsers());
      setSnackbar({ open: true, message: 'کاربر حذف شد', severity: 'success' });
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" mb={2} align="center">لیست کاربران</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="center">
        <TextField
          label="جستجوی نام"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>نوع کاربر</InputLabel>
          <Select
            value={filterType}
            label="نوع کاربر"
            onChange={e => setFilterType(e.target.value)}
          >
            <MenuItem value="all">همه</MenuItem>
            <MenuItem value="forced">کوورک اجباری</MenuItem>
            <MenuItem value="bootcamp">دانشجو</MenuItem>
            <MenuItem value="normal">عادی</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>دوره</InputLabel>
          <Select
            value={filterCourse}
            label="دوره"
            onChange={e => setFilterCourse(e.target.value)}
          >
            <MenuItem value="">همه دوره‌ها</MenuItem>
            {allCourses.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Table sx={{ minWidth: 900 }} size="small">
        <TableHead>
          <TableRow sx={{ background: '#f7f7fa' }}>
            <TableCell>ردیف</TableCell>
            <TableCell>عکس</TableCell>
            <TableCell>نام و نام خانوادگی</TableCell>
            <TableCell>شماره تلفن</TableCell>
            <TableCell>نوع کاربر</TableCell>
            <TableCell>دوره</TableCell>
            <TableCell>جزئیات</TableCell>
            <TableCell>حذف</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUsers.length === 0 && (
            <TableRow><TableCell colSpan={8} align="center">کاربری ثبت نشده است.</TableCell></TableRow>
          )}
          {filteredUsers.map((user, i) => (
            <TableRow key={user.id} sx={{ background: i % 2 === 0 ? '#fff' : '#f5f5f5' }}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>
                {user.avatar ? (
                  <Avatar src={user.avatar} />
                ) : (
                  <Avatar><PersonIcon /></Avatar>
                )}
              </TableCell>
              <TableCell>{user.name} {user.family}</TableCell>
              <TableCell>{user.phone}</TableCell>
              <TableCell>{user.type === 'cowork-forced' ? 'کوورک اجباری' : user.isBootcamp ? 'دانشجو' : 'عادی'}</TableCell>
              <TableCell>{user.bootcampType ? `${user.bootcampType} (${user.bootcampRound})` : '-'}</TableCell>
              <TableCell>
                <IconButton color="primary" onClick={() => setDetailUser(user)}><InfoIcon /></IconButton>
              </TableCell>
              <TableCell>
                <IconButton color="error" onClick={() => handleDelete(user.id)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
      {/* جزئیات کاربر */}
      <Dialog open={!!detailUser} onClose={() => setDetailUser(null)} maxWidth="md" fullWidth>
        <DialogTitle>جزئیات کاربر</DialogTitle>
        <DialogContent>
          {detailUser && <UserDetails user={detailUser} setUsers={setUsers} hideChargeBox />}
        </DialogContent>
      </Dialog>
    </Box>
  );
} 
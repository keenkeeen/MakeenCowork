import { useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Avatar, Switch, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, Snackbar, Alert, MenuItem, FormControl, InputLabel, Select, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import { getUsers, updateUser } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import moment from 'jalali-moment';
import * as XLSX from 'xlsx';

export default function CourseAttendance({ users, setUsers }) {
  const [detailUser, setDetailUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [editAvatar, setEditAvatar] = useState(null);
  const [absenceModal, setAbsenceModal] = useState({ open: false, user: null, reason: '' });
  
  // خواندن لیست دوره‌های فعال از localStorage
  const [activeBootcamps, setActiveBootcamps] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('activeBootcamps') || '[]');
    } catch {
      return [];
    }
  });

  // استخراج لیست دوره‌ها برای فیلتر
  const allCourses = Array.from(new Set(users.map(u => (u.bootcampType ? `${u.bootcampType}${u.bootcampRound || ''}` : null)).filter(Boolean)));

  // فیلتر فقط دانشجویان بوتکمپ
  let filteredUsers = users.filter(u => u.isBootcamp);
  
  if (search) filteredUsers = filteredUsers.filter(u => (`${u.name} ${u.family}`).toLowerCase().includes(search.toLowerCase()));
  if (filterCourse) filteredUsers = filteredUsers.filter(u => (u.bootcampType ? `${u.bootcampType}${u.bootcampRound || ''}` : '') === filterCourse);

  // فقط دانشجویان بوتکمپ با دوره فعال را نمایش بده (مگر اینکه جستجو فعال باشد)
  filteredUsers = filteredUsers.filter(u => {
    const bootcampKey = u.bootcampType && u.bootcampRound ? `${u.bootcampType}${u.bootcampRound}` : '';
    if (search) return true; // اگر جستجو فعال است، همه را نشان بده
    return activeBootcamps.includes(bootcampKey);
  });

  const today = new Date().toISOString().slice(0, 10);
  
  function splitByAttendance(arr) {
    const absent = arr.filter(u => !(u.courseAttendances || []).some(a => a.date === today && a.enterTime));
    const present = arr.filter(u => (u.courseAttendances || []).some(a => a.date === today && a.enterTime));
    return [...absent, ...present];
  }
  
  const sortedUsers = splitByAttendance(filteredUsers);

  // محاسبه مجموع ساعت‌های ورود/خروج (کلاس‌های دوره)
  const getTotalAttendance = (user) => {
    let total = 0;
    (user.courseAttendances || []).forEach(a => {
      if (a.enterTime && a.exitTime) {
        const [eh, em] = a.enterTime.split(':').map(Number);
        const [xh, xm] = a.exitTime.split(':').map(Number);
        total += (xh * 60 + xm) - (eh * 60 + em);
      }
    });
    return total; // دقیقه
  };
  
  // مجموع خروج موقت (کلاس‌های دوره)
  const getTotalBreak = (user) => {
    let total = 0;
    (user.courseOutSessions || []).forEach(s => {
      if (s.start && s.end) {
        const [sh, sm] = s.start.split(':').map(Number);
        const [eh, em] = s.end.split(':').map(Number);
        total += (eh * 60 + em) - (sh * 60 + sm);
      }
    });
    return total;
  };
  
  // وضعیت ورود/خروج امروز (کلاس‌های دوره)
  const getTodayAttendance = (user) => {
    const today = new Date().toISOString().slice(0, 10);
    return (user.courseAttendances || []).find(a => a.date === today);
  };
  
  // وضعیت خروج موقت باز امروز (کلاس‌های دوره)
  const getOpenBreak = (user) => {
    const today = new Date().toISOString().slice(0, 10);
    return (user.courseOutSessions || []).find(s => s.date === today && s.start && !s.end);
  };

  // تغییر وضعیت cowork-forced
  const handleToggleForced = (user) => {
    const newUser = { ...user, type: user.type === 'cowork-forced' ? 'normal' : 'cowork-forced' };
    updateUser(newUser);
    setUsers(getUsers());
    setSnackbar({ open: true, message: 'وضعیت کوورک اجباری تغییر کرد', severity: 'success' });
  };

  // ثبت ورود/خروج
  const handleCheckInOut = (user) => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    let found = false;
    let isCheckIn = false;
    const usersList = users.map(u => {
      if (u.id !== user.id) return u;
      let att = (u.courseAttendances || []).find(a => a.date === today);
      if (!att) {
        // ثبت ورود
        isCheckIn = true;
        // در بخش حضور غیاب دانشجویان، اشتراک بررسی نمی‌شود
        found = true;
        return {
          ...u,
          courseAttendances: [
            ...(u.courseAttendances || []),
            { id: uuidv4(), date: today, enterTime: time },
          ],
        };
      } else if (!att.exitTime) {
        found = true;
        // ثبت خروج
        return {
          ...u,
          courseAttendances: (u.courseAttendances || []).map(a =>
            a.date === today ? { ...a, exitTime: time } : a
          ),
        };
      }
      return u;
    });
    // اگر ورود غیرمجاز بود، ادامه نده
    if (isCheckIn && !found) return;
    setUsers(usersList);
    updateUser(usersList.find(u => u.id === user.id));
    setSnackbar({ open: true, message: found ? (user.courseAttendances && user.courseAttendances.find(a => a.date === today && !a.exitTime) ? 'خروج ثبت شد' : 'ورود ثبت شد') : 'امروز قبلاً ورود و خروج ثبت شده است', severity: 'success' });
    setRefresh(r => r + 1);
  };

  // مدیریت خروج موقت (کرنومتر) - کلاس‌های دوره
  const handleBreak = (user) => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    const usersList = getUsers();
    const idx = usersList.findIndex(u => u.id === user.id);
    if (idx === -1) return;
    let open = (usersList[idx].courseOutSessions || []).find(s => s.date === today && s.start && !s.end);
    if (!open) {
      // شروع خروج موقت
      usersList[idx].courseOutSessions = [
        ...(usersList[idx].courseOutSessions || []),
        { date: today, start: time },
      ];
      setSnackbar({ open: true, message: 'خروج موقت شروع شد', severity: 'info' });
    } else {
      open.end = time;
      setSnackbar({ open: true, message: 'پایان خروج موقت ثبت شد', severity: 'success' });
    }
    updateUser(usersList[idx]);
    setUsers(getUsers());
    setRefresh(r => r + 1);
  };

  // باز کردن جزئیات
  const handleOpenDetails = (user) => {
    setDetailUser(user);
    setEditMode(false);
    setEditForm(user);
  };

  // تابع آپلود عکس در ویرایش
  const handleEditAvatarChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setEditAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ذخیره ویرایش
  const handleSaveEdit = () => {
    const updated = { ...editForm, avatar: editAvatar !== null ? editAvatar : editForm.avatar };
    updateUser(updated);
    setUsers(getUsers());
    setSnackbar({ open: true, message: 'اطلاعات کاربر ویرایش شد', severity: 'success' });
    setEditMode(false);
    setDetailUser(updated);
  };

  // تبدیل تاریخ میلادی به شمسی (سال/ماه/روز)
  const toJalali = (dateStr) => {
    if (!dateStr) return '';
    const m = moment(dateStr, 'YYYY-MM-DD').locale('fa');
    const j = m.format('jYYYY/jMM/jDD');
    return j;
  };

  // تابع خروجی اکسل
  const exportToExcel = () => {
    const data = sortedUsers.map((user, i) => {
      const att = getTodayAttendance(user);
      const openBreak = getOpenBreak(user);
      const isPresentToday = !!(user.attendances || []).find(a => a.date === today && a.enterTime);
      return {
        'ردیف': i + 1,
        'نام و نام خانوادگی': `${user.name} ${user.family}`,
        'شماره تلفن': user.phone,
        'دوره': user.bootcampType ? `${user.bootcampType} (${user.bootcampRound})` : '-',
        'وضعیت حضور امروز': isPresentToday ? 'حاضر' : 'غایب',
        'مجموع روزهای حضور': (user.attendances || []).length,
        'مجموع خروج موقت': (user.outSessions || []).length,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'حضور_غیاب_دوره');
    XLSX.writeFile(wb, 'course_attendance.xlsx');
  };

  // تابع ثبت دلیل غیبت
  const handleSaveAbsenceReason = () => {
    if (!absenceModal.user) return;
    const today = new Date().toISOString().slice(0, 10);
    const updatedUser = { ...absenceModal.user };
    updatedUser.absenceCalls = [
      ...(updatedUser.absenceCalls || []).filter(call => call.date !== today),
      { id: uuidv4(), date: today, reason: absenceModal.reason }
    ];
    updateUser(updatedUser);
    setUsers(getUsers());
    setAbsenceModal({ open: false, user: null, reason: '' });
    setSnackbar({ open: true, message: 'دلیل غیبت ثبت شد', severity: 'success' });
  };

  // رندر جدول
  return (
    <Box sx={{ my: 4 }}>
      {/* فیلترها و جستجو */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="center">
        <Button variant="outlined" color="success" onClick={exportToExcel}>خروجی اکسل</Button>
        <TextField
          label="جستجوی نام"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>فیلتر دوره</InputLabel>
          <Select
            value={filterCourse}
            label="فیلتر دوره"
            onChange={e => setFilterCourse(e.target.value)}
          >
            <MenuItem value="">همه دوره‌ها</MenuItem>
            {allCourses.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      
      {/* جدول کاربران */}
      <Typography variant="h5" mb={3} align="center">حضور و غیاب دوره‌ها</Typography>
      <Table sx={{ minWidth: 900 }} size="small">
        <TableHead>
          <TableRow sx={{ background: '#f7f7fa' }}>
            <TableCell>ردیف</TableCell>
            <TableCell>عکس</TableCell>
            <TableCell>نام و نام خانوادگی</TableCell>
            <TableCell>شماره و نوع دوره</TableCell>
            <TableCell>شماره تلفن</TableCell>
            <TableCell>کوورک اجباری</TableCell>
            <TableCell>وضعیت حضور امروز</TableCell>
            <TableCell>پیگیری غیبت</TableCell>
            <TableCell>ورود/خروج</TableCell>
            <TableCell>خروج موقت</TableCell>
            <TableCell>جزئیات</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedUsers.map((user, i) => {
            const att = getTodayAttendance(user);
            const openBreak = getOpenBreak(user);
            const isPresentToday = !!(user.courseAttendances || []).find(a => a.date === today && a.enterTime);
            return (
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
                <TableCell>{user.bootcampType ? `${user.bootcampType} (${user.bootcampRound})` : '-'}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <Switch checked={user.type === 'cowork-forced'} onChange={() => handleToggleForced(user)} />
                </TableCell>
                <TableCell>
                  {isPresentToday ? (
                    <Typography color="success.main" fontWeight={700}>حاضر</Typography>
                  ) : (
                    <Typography color="error.main" fontWeight={700}>غایب</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {!isPresentToday && (
                    <Button variant="outlined" color="warning" size="small" onClick={() => setAbsenceModal({ open: true, user, reason: '' })}>
                      پیگیری غیبت
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant={att && !att.exitTime ? 'contained' : 'outlined'}
                    color={att && !att.exitTime ? 'warning' : 'success'}
                    size="small"
                    onClick={() => handleCheckInOut(user)}
                  >
                    {att && !att.exitTime ? 'ثبت خروج' : 'ثبت ورود'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant={openBreak ? 'contained' : 'outlined'}
                    color={openBreak ? 'secondary' : 'primary'}
                    size="small"
                    onClick={() => handleBreak(user)}
                  >
                    {openBreak ? 'پایان خروج موقت' : 'خروج موقت'}
                  </Button>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDetails(user)}><EditIcon /></IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* جزئیات کاربر */}
      <Dialog open={!!detailUser} onClose={() => setDetailUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>جزئیات دانشجو</DialogTitle>
        <DialogContent>
          {detailUser && !editMode && (
            <Stack spacing={3} mt={1}>
              {/* اطلاعات فردی */}
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <Avatar src={detailUser.avatar} sx={{ width: 56, height: 56 }}>
                    {!detailUser.avatar && <PersonIcon fontSize="large" />}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700} fontSize={18}>{detailUser.name} {detailUser.family}</Typography>
                    <Typography color="text.secondary" fontSize={14}>{detailUser.phone}</Typography>
                  </Box>
                </Stack>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary">اطلاعات فردی</Typography>
                <Stack spacing={0.5} mt={1}>
                  {detailUser.nationalId && <Typography fontSize={14}>کد ملی: {detailUser.nationalId}</Typography>}
                  {detailUser.bootcampType && <Typography fontSize={14}>دوره: {detailUser.bootcampType} ({detailUser.bootcampRound})</Typography>}
                  <Typography fontSize={14}>توضیحات: {detailUser.desc || '-'}</Typography>
                </Stack>
              </Box>
              <Divider />
              {/* وضعیت‌ها */}
              <Box>
                <Typography variant="subtitle2" color="primary">وضعیت‌ها</Typography>
                <Stack direction="row" spacing={2} mt={1}>
                  <Typography fontSize={14}>کوورک اجباری: <b>{detailUser.type === 'cowork-forced' ? 'بله' : 'خیر'}</b></Typography>
                  <Typography fontSize={14}>دانشجوی بوتکمپ: <b>{detailUser.isBootcamp ? 'بله' : 'خیر'}</b></Typography>
                </Stack>
              </Box>
              <Divider />
              {/* آمار حضور */}
              <Box>
                <Typography variant="subtitle2" color="primary">آمار حضور</Typography>
                <Stack direction="row" spacing={2} mt={1}>
                  <Typography fontSize={14}>مجموع ساعت‌های حضور: <b>{(() => { const t = getTotalAttendance(detailUser); return t > 0 ? `${Math.floor(t/60)}:${('0'+(t%60)).slice(-2)} ساعت` : '۰'; })()}</b></Typography>
                  <Typography fontSize={14}>مجموع خروج موقت: <b>{(() => { const t = getTotalBreak(detailUser); return t > 0 ? `${Math.floor(t/60)}:${('0'+(t%60)).slice(-2)} ساعت` : '۰'; })()}</b></Typography>
                </Stack>
              </Box>
              <Divider />
              {/* جزئیات حضور */}
              <Box>
                <Typography variant="subtitle2" color="primary">جزئیات حضورها</Typography>
                <Box sx={{ maxHeight: 120, overflow: 'auto', border: '1px solid #eee', borderRadius: 2, p: 1, mt: 1 }}>
                  {(detailUser.attendances || []).length === 0 && <Typography fontSize={13} color="text.secondary">حضور ثبت نشده است.</Typography>}
                  {(detailUser.attendances || []).map((a, idx) => (
                    <Typography key={a.id || idx} variant="body2" fontSize={13}>
                      {a.date} | ورود: {a.enterTime || '-'} | خروج: {a.exitTime || '-'}
                    </Typography>
                  ))}
                </Box>
              </Box>
              {/* جزئیات خروج موقت */}
              <Box>
                <Typography variant="subtitle2" color="primary" mt={2}>جزئیات خروج موقت</Typography>
                <Box sx={{ maxHeight: 120, overflow: 'auto', border: '1px solid #eee', borderRadius: 2, p: 1, mt: 1 }}>
                  {(detailUser.outSessions || []).length === 0 && <Typography fontSize={13} color="text.secondary">خروج موقتی ثبت نشده است.</Typography>}
                  {(detailUser.outSessions || []).map((s, idx) => (
                    <Typography key={idx} variant="body2" fontSize={13}>
                      {toJalali(s.date)} | شروع: {s.start || '-'} | پایان: {s.end || '(در حال خروج)'}
                    </Typography>
                  ))}
                </Box>
              </Box>
              <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setEditMode(true)}>ویرایش اطلاعات</Button>
            </Stack>
          )}
          {detailUser && editMode && (
            <Stack spacing={2} mt={1}>
              {/* آپلود عکس */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button variant="outlined" component="label" sx={{ mr: 2 }}>
                  انتخاب عکس جدید
                  <input type="file" accept="image/*" hidden onChange={handleEditAvatarChange} />
                </Button>
                {(editAvatar || editForm.avatar) && (
                  <img src={editAvatar || editForm.avatar} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                )}
              </Box>
              <TextField label="نام" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              <TextField label="نام خانوادگی" value={editForm.family || ''} onChange={e => setEditForm(f => ({ ...f, family: e.target.value }))} />
              <TextField label="شماره تلفن" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              <TextField label="کد ملی" value={editForm.nationalId || ''} onChange={e => setEditForm(f => ({ ...f, nationalId: e.target.value }))} />
              <TextField label="توضیحات" value={editForm.desc || ''} onChange={e => setEditForm(f => ({ ...f, desc: e.target.value }))} />
              <Button variant="contained" onClick={handleSaveEdit}>ذخیره</Button>
              <Button variant="outlined" color="error" onClick={() => setEditMode(false)}>انصراف</Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailUser(null)}>بستن</Button>
        </DialogActions>
      </Dialog>

      {/* مودال پیگیری غیبت */}
      <Dialog open={absenceModal.open} onClose={() => setAbsenceModal({ open: false, user: null, reason: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>ثبت دلیل غیبت</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography>نام: {absenceModal.user?.name} {absenceModal.user?.family}</Typography>
            <TextField
              label="دلیل غیبت"
              value={absenceModal.reason}
              onChange={e => setAbsenceModal(m => ({ ...m, reason: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <Button variant="contained" color="primary" onClick={handleSaveAbsenceReason} disabled={!absenceModal.reason.trim()}>
              ثبت
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
} 
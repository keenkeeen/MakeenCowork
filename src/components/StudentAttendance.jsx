import { useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Avatar, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, Snackbar, Alert, MenuItem, FormControl, InputLabel, Select, Divider, Chip, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import { getUsers } from '../utils/storage';
import moment from 'jalali-moment';
import * as XLSX from 'xlsx';

export default function StudentAttendance({ users, setUsers }) {
  const [detailUser, setDetailUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, present, absent
  const [dateRange, setDateRange] = useState('30days'); // 7days, 30days, 3months, 6months, 1year, all
  
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
  
  // محاسبه تاریخ شروع بر اساس بازه انتخاب شده
  const getStartDate = () => {
    const now = new Date();
    switch (dateRange) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      case '3months':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      case '6months':
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      case '1year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      default:
        return '1900-01-01'; // همه تاریخ‌ها
    }
  };
  
  const startDate = getStartDate();
  
  // فیلتر بر اساس وضعیت حضور (کلاس‌های دوره)
  if (filterStatus === 'present') {
    filteredUsers = filteredUsers.filter(u => (u.courseAttendances || []).some(a => a.date === today && a.enterTime));
  } else if (filterStatus === 'absent') {
    filteredUsers = filteredUsers.filter(u => !(u.courseAttendances || []).some(a => a.date === today && a.enterTime));
  }

  // محاسبه آمار حضور (کلاس‌های دوره)
  const getAttendanceStats = (user) => {
    const courseAttendances = (user.courseAttendances || []).filter(a => a.date >= startDate);
    const totalDays = courseAttendances.length;
    const presentDays = courseAttendances.filter(a => a.enterTime).length;
    const absentDays = totalDays - presentDays;
    
    // محاسبه مجموع ساعت‌ها
    let totalHours = 0;
    courseAttendances.forEach(a => {
      if (a.enterTime && a.exitTime) {
        const [eh, em] = a.enterTime.split(':').map(Number);
        const [xh, xm] = a.exitTime.split(':').map(Number);
        totalHours += (xh * 60 + xm) - (eh * 60 + em);
      }
    });
    
    return {
      totalDays,
      presentDays,
      absentDays,
      totalHours: Math.floor(totalHours / 60),
      totalMinutes: totalHours % 60
    };
  };

  // محاسبه آمار خروج موقت (کلاس‌های دوره)
  const getBreakStats = (user) => {
    const courseOutSessions = (user.courseOutSessions || []).filter(s => s.date >= startDate);
    const totalBreaks = courseOutSessions.length;
    
    let totalBreakTime = 0;
    courseOutSessions.forEach(s => {
      if (s.start && s.end) {
        const [sh, sm] = s.start.split(':').map(Number);
        const [eh, em] = s.end.split(':').map(Number);
        totalBreakTime += (eh * 60 + em) - (sh * 60 + sm);
      }
    });
    
    return {
      totalBreaks,
      totalBreakHours: Math.floor(totalBreakTime / 60),
      totalBreakMinutes: totalBreakTime % 60
    };
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
    const getDateRangeText = () => {
      switch (dateRange) {
        case '7days': return 'هفته اخیر';
        case '30days': return 'ماه اخیر';
        case '3months': return 'سه ماه اخیر';
        case '6months': return 'شش ماه اخیر';
        case '1year': return 'سال اخیر';
        default: return 'همه';
      }
    };
    
    const data = filteredUsers.map((user, i) => {
      const stats = getAttendanceStats(user);
      const breakStats = getBreakStats(user);
      const isPresentToday = !!(user.courseAttendances || []).find(a => a.date === today && a.enterTime);
      
      return {
        'ردیف': i + 1,
        'نام و نام خانوادگی': `${user.name} ${user.family}`,
        'شماره تلفن': user.phone,
        'دوره': user.bootcampType ? `${user.bootcampType} (${user.bootcampRound})` : '-',
        'وضعیت حضور امروز': isPresentToday ? 'حاضر' : 'غایب',
        'بازه زمانی': getDateRangeText(),
        'مجموع روزهای حضور': stats.totalDays,
        'روزهای حاضر': stats.presentDays,
        'روزهای غایب': stats.absentDays,
        'مجموع ساعت‌های حضور': `${stats.totalHours}:${('0' + stats.totalMinutes).slice(-2)}`,
        'مجموع خروج موقت': breakStats.totalBreaks,
        'مجموع ساعت‌های خروج موقت': `${breakStats.totalBreakHours}:${('0' + breakStats.totalBreakMinutes).slice(-2)}`,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'حضور_غیاب_دانشجوها');
    XLSX.writeFile(wb, `student_attendance_${getDateRangeText()}.xlsx`);
  };

  // باز کردن جزئیات
  const handleOpenDetails = (user) => {
    setDetailUser(user);
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
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>وضعیت حضور</InputLabel>
          <Select
            value={filterStatus}
            label="وضعیت حضور"
            onChange={e => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">همه</MenuItem>
            <MenuItem value="present">فقط حاضر</MenuItem>
            <MenuItem value="absent">فقط غایب</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      
      {/* انتخاب بازه زمانی */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" mb={1}>بازه زمانی گزارش:</Typography>
        <ToggleButtonGroup
          value={dateRange}
          exclusive
          onChange={(e, newValue) => newValue && setDateRange(newValue)}
          size="small"
        >
          <ToggleButton value="7days">هفته اخیر</ToggleButton>
          <ToggleButton value="30days">ماه اخیر</ToggleButton>
          <ToggleButton value="3months">سه ماه اخیر</ToggleButton>
          <ToggleButton value="6months">شش ماه اخیر</ToggleButton>
          <ToggleButton value="1year">سال اخیر</ToggleButton>
          <ToggleButton value="all">همه</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* جدول کاربران */}
      <Typography variant="h5" mb={3} align="center">حضور و غیاب دانشجوها</Typography>
      <Table sx={{ minWidth: 900 }} size="small">
        <TableHead>
          <TableRow sx={{ background: '#f7f7fa' }}>
            <TableCell>ردیف</TableCell>
            <TableCell>عکس</TableCell>
            <TableCell>نام و نام خانوادگی</TableCell>
            <TableCell>شماره و نوع دوره</TableCell>
            <TableCell>شماره تلفن</TableCell>
            <TableCell>وضعیت حضور امروز</TableCell>
            <TableCell>آمار حضور</TableCell>
            <TableCell>آمار خروج موقت</TableCell>
            <TableCell>جزئیات</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUsers.map((user, i) => {
            const stats = getAttendanceStats(user);
            const breakStats = getBreakStats(user);
            const isPresentToday = !!(user.attendances || []).find(a => a.date === today && a.enterTime);
            
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
                  {isPresentToday ? (
                    <Chip label="حاضر" color="success" size="small" />
                  ) : (
                    <Chip label="غایب" color="error" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="caption">کل روزها: {stats.totalDays}</Typography>
                    <Typography variant="caption">حاضر: {stats.presentDays}</Typography>
                    <Typography variant="caption">غایب: {stats.absentDays}</Typography>
                    <Typography variant="caption">ساعت: {stats.totalHours}:{('0' + stats.totalMinutes).slice(-2)}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="caption">تعداد: {breakStats.totalBreaks}</Typography>
                    <Typography variant="caption">ساعت: {breakStats.totalBreakHours}:{('0' + breakStats.totalBreakMinutes).slice(-2)}</Typography>
                  </Stack>
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
      <Dialog open={!!detailUser} onClose={() => setDetailUser(null)} maxWidth="md" fullWidth>
        <DialogTitle>جزئیات حضور و غیاب دانشجو</DialogTitle>
        <DialogContent>
          {detailUser && (
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
                    {detailUser.bootcampType && (
                      <Typography color="primary" fontSize={14}>
                        دوره: {detailUser.bootcampType} ({detailUser.bootcampRound})
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
              <Divider />
              
              {/* آمار کلی */}
              <Box>
                <Typography variant="subtitle2" color="primary" mb={2}>آمار کلی حضور و غیاب</Typography>
                <Stack direction="row" spacing={4} flexWrap="wrap">
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="h6" color="primary">{getAttendanceStats(detailUser).totalDays}</Typography>
                    <Typography variant="caption">کل روزهای ثبت شده</Typography>
                  </Box>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="h6" color="success.main">{getAttendanceStats(detailUser).presentDays}</Typography>
                    <Typography variant="caption">روزهای حاضر</Typography>
                  </Box>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="h6" color="error.main">{getAttendanceStats(detailUser).absentDays}</Typography>
                    <Typography variant="caption">روزهای غایب</Typography>
                  </Box>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="h6" color="info.main">
                      {getAttendanceStats(detailUser).totalHours}:{('0' + getAttendanceStats(detailUser).totalMinutes).slice(-2)}
                    </Typography>
                    <Typography variant="caption">مجموع ساعت‌های حضور</Typography>
                  </Box>
                </Stack>
              </Box>
              <Divider />
              
              {/* جزئیات حضور */}
              <Box>
                <Typography variant="subtitle2" color="primary" mb={2}>جزئیات حضورها</Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee', borderRadius: 2, p: 2 }}>
                  {(detailUser.attendances || []).filter(a => a.date >= startDate).length === 0 ? (
                    <Typography fontSize={13} color="text.secondary">حضور ثبت نشده است.</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {(detailUser.attendances || []).filter(a => a.date >= startDate).map((a, idx) => (
                        <Box key={a.id || idx} sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 1,
                          borderRadius: 1,
                          bgcolor: a.enterTime ? '#f0f8f0' : '#fff3f3'
                        }}>
                          <Typography variant="body2" fontSize={13}>
                            {toJalali(a.date)}
                          </Typography>
                          <Typography variant="body2" fontSize={13}>
                            ورود: {a.enterTime || '-'}
                          </Typography>
                          <Typography variant="body2" fontSize={13}>
                            خروج: {a.exitTime || '-'}
                          </Typography>
                          <Chip 
                            label={a.enterTime ? 'حاضر' : 'غایب'} 
                            color={a.enterTime ? 'success' : 'error'} 
                            size="small" 
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Box>
              
              {/* جزئیات خروج موقت */}
              <Box>
                <Typography variant="subtitle2" color="primary" mb={2}>جزئیات خروج موقت</Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee', borderRadius: 2, p: 2 }}>
                  {(detailUser.outSessions || []).filter(s => s.date >= startDate).length === 0 ? (
                    <Typography fontSize={13} color="text.secondary">خروج موقتی ثبت نشده است.</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {(detailUser.outSessions || []).filter(s => s.date >= startDate).map((s, idx) => (
                        <Box key={idx} sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 1,
                          borderRadius: 1,
                          bgcolor: s.end ? '#f0f8f0' : '#fff8e1'
                        }}>
                          <Typography variant="body2" fontSize={13}>
                            {toJalali(s.date)}
                          </Typography>
                          <Typography variant="body2" fontSize={13}>
                            شروع: {s.start || '-'}
                          </Typography>
                          <Typography variant="body2" fontSize={13}>
                            پایان: {s.end || '(در حال خروج)'}
                          </Typography>
                          <Chip 
                            label={s.end ? 'تمام شده' : 'در حال خروج'} 
                            color={s.end ? 'success' : 'warning'} 
                            size="small" 
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Box>
              
              {/* پیگیری غیبت */}
              {(detailUser.absenceCalls || []).filter(call => call.date >= startDate).length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="primary" mb={2}>پیگیری غیبت</Typography>
                    <Box sx={{ maxHeight: 150, overflow: 'auto', border: '1px solid #eee', borderRadius: 2, p: 2 }}>
                      <Stack spacing={1}>
                        {(detailUser.absenceCalls || []).filter(call => call.date >= startDate).map((call, idx) => (
                          <Box key={call.id || idx} sx={{ 
                            p: 1,
                            borderRadius: 1,
                            bgcolor: '#fff3e0'
                          }}>
                            <Typography variant="body2" fontSize={13} fontWeight={600}>
                              {toJalali(call.date)}
                            </Typography>
                            <Typography variant="body2" fontSize={13}>
                              {call.reason}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailUser(null)}>بستن</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
} 
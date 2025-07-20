import React from 'react'
import { Box, Typography, Chip, Divider, Table, TableHead, TableRow, TableCell, TableBody, Stack, Card, CardContent, Grid, Paper, Switch, FormControlLabel, Avatar, TextField } from '@mui/material'
import AbsenceCallList from './AbsenceCallList'
import moment from 'jalali-moment'
import PersonIcon from '@mui/icons-material/Person';

export default function UserDetails({ user, setUsers }) {
  const [refresh, setRefresh] = React.useState(0)
  const [isForced, setIsForced] = React.useState(user?.type === 'bootcamp-forced')
  React.useEffect(() => { setIsForced(user?.type === 'bootcamp-forced') }, [user])
  if (!user) return null

  // محاسبه تعداد روزهای باقی‌مانده اشتراک
  const totalDays = user.subscriptions?.reduce((sum, s) => sum + (s.days || 0), 0) || 0
  const attendedDays = user.attendances?.length || 0
  const remainDays = totalDays - attendedDays

  const handleForcedChange = (e) => {
    const newType = e.target.checked ? 'cowork-forced' : 'normal'
    const updatedUser = { ...user, type: newType }
    import('../utils/storage').then(({ updateUser, getUsers }) => {
      updateUser(updatedUser)
      if (setUsers) setUsers(getUsers())
      setRefresh(r => r + 1)
    })
    setIsForced(e.target.checked)
  }

  // تبدیل تاریخ میلادی به شمسی (سال/ماه/روز)
  const toJalali = (dateStr) => {
    if (!dateStr) return '';
    const m = moment(dateStr, 'YYYY-MM-DD').locale('fa');
    const j = m.format('jYYYY/jMM/jDD');
    return j;
  }

  return (
    <Grid container spacing={3} sx={{ mt: 4 }}>
      <Grid item xs={12} md={5}>
        <Card elevation={3} sx={{ borderRadius: 3, mb: 2 }}>
          <CardContent>
            {user.isBootcamp && (
              <FormControlLabel
                control={<Switch checked={isForced} onChange={handleForcedChange} />}
                label="حضور اجباری (پیگیری غیبت)"
                sx={{ mb: 2, display: 'block' }}
              />
            )}
            <Typography variant="h6" mb={2}>جزئیات کاربر</Typography>
            <Stack direction="row" spacing={2} mb={2}>
              <Chip label={user.type === 'cowork-forced' ? 'کوورک اجباری' : 'عادی'} color={user.type === 'cowork-forced' ? 'error' : 'default'} />
              {user.isBootcamp && <Chip label="دانشجوی بوتکمپ" color="primary" />}
            </Stack>
            <Typography>نام: {user.name} {user.family}</Typography>
            <Typography>شماره تماس: {user.phone}</Typography>
            {user.nationalId && <Typography>کد ملی: {user.nationalId}</Typography>}
            {user.bootcampType && <Typography>نوع بوتکمپ: {user.bootcampType} (دوره {user.bootcampRound})</Typography>}
            <Typography mt={2}>روزهای باقی‌مانده اشتراک: <b>{remainDays}</b></Typography>
          </CardContent>
        </Card>
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent>
            <AbsenceCallList user={user} onChange={() => setRefresh(r => r + 1)} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={7}>
        <Paper elevation={2} sx={{ borderRadius: 3, mb: 3, p: 2 }}>
          <Typography variant="subtitle1">حضور غیاب‌ها (کوورک)</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>تاریخ</TableCell>
                <TableCell>حضور یا غیاب</TableCell>
                <TableCell>ورود</TableCell>
                <TableCell>خروج</TableCell>
                <TableCell>توضیحات غیبت</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {user.attendances?.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">حضور کوورک ثبت نشده است.</TableCell></TableRow>
              )}
              {user.attendances?.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{toJalali(a.date)}</TableCell>
                  <TableCell>{a.enterTime ? 'حاضر' : 'غایب'}</TableCell>
                  <TableCell>{a.enterTime || '-'}</TableCell>
                  <TableCell>{a.exitTime || '-'}</TableCell>
                  <TableCell>
                    {!a.enterTime ? (user.absenceCalls?.find(call => call.date === a.date)?.reason || '-') : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
        
        {/* حضور غیاب کلاس‌های دوره */}
        {user.isBootcamp && (
          <Paper elevation={2} sx={{ borderRadius: 3, mb: 3, p: 2 }}>
            <Typography variant="subtitle1" color="primary">حضور غیاب کلاس‌های دوره</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>تاریخ</TableCell>
                  <TableCell>حضور یا غیاب</TableCell>
                  <TableCell>ورود</TableCell>
                  <TableCell>خروج</TableCell>
                  <TableCell>یادداشت</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {user.courseAttendances?.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">حضور کلاس ثبت نشده است.</TableCell></TableRow>
                )}
                {user.courseAttendances?.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>{toJalali(a.date)}</TableCell>
                    <TableCell>{a.enterTime ? 'حاضر' : 'غایب'}</TableCell>
                    <TableCell>{a.enterTime || '-'}</TableCell>
                    <TableCell>{a.exitTime || '-'}</TableCell>
                    <TableCell>{a.note || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
        {/* باکس خروج‌های موقت (کوورک) */}
        <Paper elevation={2} sx={{ borderRadius: 3, mb: 3, p: 2 }}>
          <Typography variant="subtitle1" color="secondary">خروج‌های موقت (کوورک)</Typography>
          {(() => {
            // گروه‌بندی خروج‌ها بر اساس تاریخ
            const sessionsByDate = {};
            (user.outSessions || []).forEach(s => {
              if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
              sessionsByDate[s.date].push(s);
            });
            const dates = Object.keys(sessionsByDate).sort().reverse();
            if (dates.length === 0) return <Typography color="text.secondary">خروج موقتی کوورک ثبت نشده است.</Typography>;
            return dates.map(date => {
              // مجموع زمان خروج موقت این روز
              const total = sessionsByDate[date].reduce((sum, s) => {
                if (s.start && s.end) {
                  const [sh, sm] = s.start.split(':').map(Number);
                  const [eh, em] = s.end.split(':').map(Number);
                  return sum + ((eh * 60 + em) - (sh * 60 + sm));
                }
                return sum;
              }, 0);
              return (
                <Box key={date} mb={2}>
                  <Typography fontWeight={700} mb={0.5}>{toJalali(date)} (مجموع: {total > 0 ? `${Math.floor(total/60)}:${('0'+(total%60)).slice(-2)} ساعت` : '۰'})</Typography>
                  <Stack spacing={0.5}>
                    {sessionsByDate[date].map((s, i) => (
                      <Typography key={i} variant="body2" color="text.secondary">
                        {s.start} {s.end ? `تا ${s.end}` : '(در حال خروج)'}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              );
            });
          })()}
        </Paper>
        
        {/* خروج‌های موقت کلاس‌های دوره */}
        {user.isBootcamp && (
          <Paper elevation={2} sx={{ borderRadius: 3, mb: 3, p: 2 }}>
            <Typography variant="subtitle1" color="primary">خروج‌های موقت کلاس‌های دوره</Typography>
            {(() => {
              // گروه‌بندی خروج‌ها بر اساس تاریخ
              const sessionsByDate = {};
              (user.courseOutSessions || []).forEach(s => {
                if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
                sessionsByDate[s.date].push(s);
              });
              const dates = Object.keys(sessionsByDate).sort().reverse();
              if (dates.length === 0) return <Typography color="text.secondary">خروج موقتی کلاس ثبت نشده است.</Typography>;
              return dates.map(date => {
                // مجموع زمان خروج موقت این روز
                const total = sessionsByDate[date].reduce((sum, s) => {
                  if (s.start && s.end) {
                    const [sh, sm] = s.start.split(':').map(Number);
                    const [eh, em] = s.end.split(':').map(Number);
                    return sum + ((eh * 60 + em) - (sh * 60 + sm));
                  }
                  return sum;
                }, 0);
                return (
                  <Box key={date} mb={2}>
                    <Typography fontWeight={700} mb={0.5}>{toJalali(date)} (مجموع: {total > 0 ? `${Math.floor(total/60)}:${('0'+(total%60)).slice(-2)} ساعت` : '۰'})</Typography>
                    <Stack spacing={0.5}>
                      {sessionsByDate[date].map((s, i) => (
                        <Typography key={i} variant="body2" color="text.secondary">
                          {s.start} {s.end ? `تا ${s.end}` : '(در حال خروج)'}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                );
              });
            })()}
          </Paper>
        )}
        <Paper elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="subtitle1">بدهی‌ها</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>تاریخ</TableCell>
                <TableCell>مبلغ</TableCell>
                <TableCell>دلیل</TableCell>
                <TableCell>پرداخت</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {user.debts?.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center">بدهی ثبت نشده است.</TableCell></TableRow>
              )}
              {user.debts?.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{toJalali(d.date)}</TableCell>
                  <TableCell>{d.amount}</TableCell>
                  <TableCell>{d.reason}</TableCell>
                  <TableCell>{d.paid ? 'پرداخت شده' : 'بدهکار'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Grid>
    </Grid>
  )
} 
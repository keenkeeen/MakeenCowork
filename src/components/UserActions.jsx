import React, { useState } from 'react'
import { Box, Button, TextField, MenuItem, Stack, Typography, Paper, Snackbar, Alert } from '@mui/material'
import { v4 as uuidv4 } from 'uuid'
import { updateUser, getUsers } from '../utils/storage'
import DatePicker from 'react-multi-date-picker'

export default function UserActions({ user, onChange }) {
  const [days, setDays] = useState('')
  const [amount, setAmount] = useState('')
  const [debtReason, setDebtReason] = useState('')
  const [presenceTime, setPresenceTime] = useState({ enter: '', exit: '' })
  const [presenceDate, setPresenceDate] = useState('')
  const [presenceMode, setPresenceMode] = useState('enter')
  const [paid, setPaid] = useState(true)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  if (!user) return null

  // افزودن اشتراک
  const handleAddSubscription = () => {
    if (!days) {
      setSnackbar({ open: true, message: 'تعداد روز را وارد کنید', severity: 'error' }); return;
    }
    const newUser = { ...user }
    newUser.subscriptions = [
      ...(user.subscriptions || []),
      {
        id: uuidv4(),
        days: Number(days),
        startDate: new Date().toISOString().slice(0, 10),
        paid,
      },
    ]
    updateUser(newUser)
    onChange && onChange(newUser)
    setDays('')
    setPaid(true)
    setSnackbar({ open: true, message: 'اشتراک با موفقیت اضافه شد', severity: 'success' })
  }

  // ثبت حضور یا خروج
  const handleAddAttendance = () => {
    if (!presenceDate || !presenceTime.enter) {
      setSnackbar({ open: true, message: 'تاریخ و ساعت ورود را وارد کنید', severity: 'error' }); return;
    }
    const newUser = { ...user }
    if (presenceMode === 'enter') {
      newUser.attendances = [
        ...(user.attendances || []),
        {
          id: uuidv4(),
          date: presenceDate,
          enterTime: presenceTime.enter,
        },
      ]
    } else {
      // ثبت خروج برای آخرین حضور باز
      const last = (newUser.attendances || []).slice().reverse().find(a => a.date === presenceDate && !a.exitTime)
      if (last) last.exitTime = presenceTime.exit
    }
    updateUser(newUser)
    onChange && onChange(newUser)
    setPresenceTime({ enter: '', exit: '' })
    setPresenceDate('')
    setSnackbar({ open: true, message: 'حضور/خروج ثبت شد', severity: 'success' })
  }

  // افزودن بدهی
  const handleAddDebt = () => {
    if (!amount || !debtReason) {
      setSnackbar({ open: true, message: 'مبلغ و دلیل بدهی را وارد کنید', severity: 'error' }); return;
    }
    const newUser = { ...user }
    newUser.debts = [
      ...(user.debts || []),
      {
        id: uuidv4(),
        amount: Number(amount),
        reason: debtReason,
        date: new Date().toISOString().slice(0, 10),
        paid: false,
      },
    ]
    updateUser(newUser)
    onChange && onChange(newUser)
    setAmount('')
    setDebtReason('')
    setSnackbar({ open: true, message: 'بدهی با موفقیت اضافه شد', severity: 'success' })
  }

  return (
    <Paper elevation={2} sx={{ my: 2, p: 2, border: '1px solid #eee', borderRadius: 2, background: '#f9f9f9' }}>
      <Typography variant="subtitle1" mb={1}>افزودن شارژ رزرو (اشتراک)</Typography>
      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label="تعداد روز"
          type="number"
          value={days}
          onChange={e => setDays(e.target.value)}
          size="small"
        />
        <TextField
          label="وضعیت پرداخت"
          select
          value={paid ? 'پرداخت شده' : 'بدهکار'}
          onChange={e => setPaid(e.target.value === 'پرداخت شده')}
          size="small"
        >
          <MenuItem value="پرداخت شده">پرداخت شده</MenuItem>
          <MenuItem value="بدهکار">بدهکار</MenuItem>
        </TextField>
        <Button variant="contained" onClick={handleAddSubscription}>افزودن</Button>
      </Stack>
      <Typography variant="subtitle1" mb={1}>ثبت حضور/خروج</Typography>
      <Stack direction="row" spacing={2} mb={2}>
        <DatePicker
          value={presenceDate}
          onChange={setPresenceDate}
          format="YYYY/MM/DD"
          calendarPosition="bottom-right"
          inputClass="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall"
          style={{ width: '120px' }}
        />
        <TextField
          label={presenceMode === 'enter' ? 'ساعت ورود' : 'ساعت خروج'}
          type="time"
          value={presenceMode === 'enter' ? presenceTime.enter : presenceTime.exit}
          onChange={e => setPresenceTime(p => presenceMode === 'enter' ? { ...p, enter: e.target.value } : { ...p, exit: e.target.value })}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="نوع"
          select
          value={presenceMode}
          onChange={e => setPresenceMode(e.target.value)}
          size="small"
        >
          <MenuItem value="enter">ورود</MenuItem>
          <MenuItem value="exit">خروج</MenuItem>
        </TextField>
        <Button variant="contained" onClick={handleAddAttendance}>ثبت</Button>
      </Stack>
      <Typography variant="subtitle1" mb={1}>افزودن بدهی</Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          label="مبلغ"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          size="small"
        />
        <TextField
          label="دلیل"
          value={debtReason}
          onChange={e => setDebtReason(e.target.value)}
          size="small"
        />
        <Button variant="contained" onClick={handleAddDebt}>افزودن</Button>
      </Stack>
      <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Paper>
  )
} 
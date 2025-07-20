import React, { useState } from 'react'
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, Stack } from '@mui/material'
import { v4 as uuidv4 } from 'uuid'
import { updateUser } from '../utils/storage'
import DatePicker from 'react-multi-date-picker'

export default function AbsenceCallList({ user, onChange }) {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')

  if (!user) return null

  const handleAddCall = () => {
    if (!date || !reason) return
    const newUser = { ...user }
    newUser.absenceCalls = [
      ...(user.absenceCalls || []),
      {
        id: uuidv4(),
        date: date instanceof Date ? date.toLocaleDateString('fa-IR-u-ca-persian') : date,
        reason,
      },
    ]
    updateUser(newUser)
    onChange && onChange(newUser)
    setDate('')
    setReason('')
  }

  // تبدیل تاریخ میلادی به شمسی (سال/ماه/روز)
  const toJalali = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr)
      if (!isNaN(d)) {
        return d.toLocaleDateString('fa-IR-u-ca-persian')
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="subtitle1" mb={1}>تماس‌های غیبت/دلیل عدم حضور</Typography>
      <Stack direction="row" spacing={2} mb={2}>
        <DatePicker
          value={date}
          onChange={setDate}
          format="YYYY/MM/DD"
          calendarPosition="bottom-right"
          inputClass="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall"
          style={{ width: '120px' }}
        />
        <TextField
          label="دلیل یا توضیح"
          value={reason}
          onChange={e => setReason(e.target.value)}
          size="small"
        />
        <Button variant="contained" onClick={handleAddCall}>افزودن</Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>تاریخ</TableCell>
            <TableCell>دلیل/توضیح</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {user.absenceCalls?.length === 0 && (
            <TableRow><TableCell colSpan={2} align="center">تماسی ثبت نشده است.</TableCell></TableRow>
          )}
          {user.absenceCalls?.map(call => (
            <TableRow key={call.id}>
              <TableCell>{toJalali(call.date)}</TableCell>
              <TableCell>{call.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
} 
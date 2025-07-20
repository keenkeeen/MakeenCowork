import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Stack, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Alert } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import moment from 'jalali-moment';

const TRANSACTIONS_KEY = 'cowork3_transactions';
const PRICES_KEY = 'cowork3_prices';

export default function AccountCharge({ users, setUsers }) {
  const [userId, setUserId] = useState('');
  const [days, setDays] = useState('');
  const [payType, setPayType] = useState('cash');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [alert, setAlert] = useState(null);
  const [transactions, setTransactions] = useState(() => {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  });
  const [prices, setPrices] = useState({ forced: '', bootcamp: '', normal: '' });
  const [filterUser, setFilterUser] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  useEffect(() => {
    const data = localStorage.getItem(PRICES_KEY);
    if (data) setPrices(JSON.parse(data));
  }, []);

  // تعیین قیمت مصوب بر اساس نوع کاربر
  const getUserPrice = (user) => {
    if (!user) return '';
    if (user.type === 'cowork-forced') return prices.forced || '';
    if (user.isBootcamp) return prices.bootcamp || '';
    return prices.normal || '';
  };

  // به‌روزرسانی مبلغ خودکار هنگام تغییر کاربر یا تعداد روز یا نوع پرداخت
  useEffect(() => {
    if (!userId || !days || isNaN(Number(days)) || Number(days) <= 0) return;
    const user = users.find(u => u.id === userId);
    const price = getUserPrice(user);
    if (!price) return;
    if (payType === 'cash' || payType === 'debt') {
      setAmount(String(Number(days) * Number(price)));
    }
  }, [userId, days, payType, prices, users]);

  const handleUserChange = e => setUserId(e.target.value);
  const handlePayTypeChange = e => {
    setPayType(e.target.value);
    if (e.target.value !== 'cash') setAmount('');
  };

  const handleDaysChange = e => {
    setDays(e.target.value);
  };

  const handleAmountChange = e => setAmount(e.target.value);

  const handleSubmit = e => {
    e.preventDefault();
    if (!userId || !days || (payType === 'cash' && !amount)) {
      setAlert({ type: 'error', msg: 'همه فیلدهای ضروری را پر کنید.' });
      return;
    }
    const user = users.find(u => u.id === userId);
    if (!user) {
      setAlert({ type: 'error', msg: 'کاربر انتخاب نشده است.' });
      return;
    }
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    let newUser = { ...user };
    let newTransaction = {
      id: uuidv4(),
      userId,
      name: user.name + ' ' + user.family,
      days: Number(days),
      payType,
      amount: payType === 'cash' ? Number(amount) : Number(amount),
      desc,
      date,
    };
    if (payType === 'cash') {
      // ثبت تراکنش نقدی و افزودن اشتراک پرداخت شده
      newUser.subscriptions = [
        ...(user.subscriptions || []),
        { id: uuidv4(), days: Number(days), startDate: date, paid: true },
      ];
    } else {
      // ثبت بدهی و افزودن اشتراک بدهکار
      newUser.subscriptions = [
        ...(user.subscriptions || []),
        { id: uuidv4(), days: Number(days), startDate: date, paid: false },
      ];
      // افزودن بدهی به debts
      newUser.debts = [
        ...(user.debts || []),
        { id: uuidv4(), amount: Number(amount), reason: 'اشتراک دفتری', date, paid: false },
      ];
    }
    // ذخیره تراکنش
    const newTransactions = [newTransaction, ...transactions];
    setTransactions(newTransactions);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
    // بروزرسانی کاربر
    const updatedUsers = users.map(u => u.id === userId ? newUser : u);
    setUsers && setUsers(updatedUsers);
    localStorage.setItem('cowork3_users', JSON.stringify(updatedUsers));
    setAlert({ type: 'success', msg: 'شارژ با موفقیت ثبت شد.' });
    setUserId(''); setDays(''); setPayType('cash'); setAmount(''); setDesc('');
  };

  // فیلتر تراکنش‌ها
  const filteredTransactions = transactions.filter(t => {
    let ok = true;
    if (filterUser && t.userId !== filterUser) ok = false;
    if (filterFrom && t.date < filterFrom) ok = false;
    if (filterTo && t.date > filterTo) ok = false;
    return ok;
  });

  // تبدیل تاریخ میلادی به شمسی (سال/ماه/روز)
  const toJalali = (dateStr) => {
    if (!dateStr) return '';
    const m = moment(dateStr, 'YYYY-MM-DD').locale('fa');
    const j = m.format('jYYYY/jMM/jDD');
    // تبدیل به قالب سال/ماه/روز و راست به چپ
    return j;
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 6 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" mb={3} align="center">شارژ حساب کاربر</Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              select
              label="انتخاب کاربر"
              value={userId}
              onChange={handleUserChange}
              fullWidth
              required
            >
              {users.map(u => (
                <MenuItem key={u.id} value={u.id}>{u.name} {u.family}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="تعداد روز"
              type="number"
              value={days}
              onChange={handleDaysChange}
              fullWidth
              required
            />
            <TextField
              select
              label="نوع پرداخت"
              value={payType}
              onChange={handlePayTypeChange}
              fullWidth
              required
            >
              <MenuItem value="cash">نقدی</MenuItem>
              <MenuItem value="debt">حساب دفتری</MenuItem>
            </TextField>
            <TextField
              label="مبلغ پرداختی (تومان)"
              type="number"
              value={amount}
              onChange={handleAmountChange}
              fullWidth
              disabled={payType !== 'cash' && payType !== 'debt'}
              required={payType === 'cash' || payType === 'debt'}
              helperText={userId && days && getUserPrice(users.find(u => u.id === userId)) ? `مبلغ پیشنهادی: ${(Number(days) * Number(getUserPrice(users.find(u => u.id === userId)))).toLocaleString()} تومان` : ''}
            />
            <TextField
              label="توضیحات"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <Button variant="contained" type="submit">ثبت شارژ</Button>
            {alert && <Alert severity={alert.type}>{alert.msg}</Alert>}
          </Stack>
        </form>
      </Paper>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="subtitle1" mb={2}>تراکنش‌های مالی</Typography>
        {/* فیلترها */}
        <Stack direction="row" spacing={2} mb={2}>
          <TextField
            select
            label="فیلتر کاربر"
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">همه کاربران</MenuItem>
            {users.map(u => (
              <MenuItem key={u.id} value={u.id}>{u.name} {u.family}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="از تاریخ"
            type="date"
            value={filterFrom}
            onChange={e => setFilterFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="تا تاریخ"
            type="date"
            value={filterTo}
            onChange={e => setFilterTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>کاربر</TableCell>
              <TableCell>تعداد روز</TableCell>
              <TableCell>نوع پرداخت</TableCell>
              <TableCell>مبلغ</TableCell>
              <TableCell>تاریخ</TableCell>
              <TableCell>توضیحات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">تراکنشی ثبت نشده است.</TableCell></TableRow>
            )}
            {filteredTransactions.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.days}</TableCell>
                <TableCell>{t.payType === 'cash' ? 'نقدی' : 'حساب دفتری'}</TableCell>
                <TableCell>{t.amount ? t.amount.toLocaleString() : '-'}</TableCell>
                <TableCell>{toJalali(t.date)}</TableCell>
                <TableCell>{t.desc || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
} 
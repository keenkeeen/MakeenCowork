import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Stack, Checkbox, FormControlLabel, Divider } from '@mui/material';

const PRICES_KEY = 'cowork3_prices';
const ACTIVE_BOOTCAMPS_KEY = 'activeBootcamps';

export default function SettingsMain() {
  const [prices, setPrices] = useState({
    forced: '',
    bootcamp: '',
    normal: '',
  });
  const [saved, setSaved] = useState(false);

  // مدیریت فعال بودن دوره‌ها
  const [bootcamps, setBootcamps] = useState([]); // لیست همه دوره‌ها
  const [activeBootcamps, setActiveBootcamps] = useState([]); // لیست فعال‌ها

  useEffect(() => {
    const data = localStorage.getItem(PRICES_KEY);
    if (data) setPrices(JSON.parse(data));
    // استخراج لیست دوره‌ها از کاربران
    const users = JSON.parse(localStorage.getItem('cowork3_users') || '[]');
    const all = Array.from(new Set(users.filter(u => u.isBootcamp).map(u => u.bootcampType && u.bootcampRound ? `${u.bootcampType}${u.bootcampRound}` : null).filter(Boolean)));
    setBootcamps(all);
    // خواندن لیست فعال‌ها
    const act = JSON.parse(localStorage.getItem(ACTIVE_BOOTCAMPS_KEY) || '[]');
    setActiveBootcamps(act);
  }, []);

  const handleChange = e => {
    setPrices({ ...prices, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(PRICES_KEY, JSON.stringify(prices));
    setSaved(true);
  };

  // تغییر وضعیت فعال بودن دوره
  const handleBootcampToggle = (bootcamp) => {
    let updated;
    if (activeBootcamps.includes(bootcamp)) {
      updated = activeBootcamps.filter(b => b !== bootcamp);
    } else {
      updated = [...activeBootcamps, bootcamp];
    }
    setActiveBootcamps(updated);
    localStorage.setItem(ACTIVE_BOOTCAMPS_KEY, JSON.stringify(updated));
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" mb={3} align="center">تنظیمات قیمت مصوب اشتراک</Typography>
        <Stack spacing={2}>
          <TextField
            label="قیمت هر روز (کوورک اجباری)"
            name="forced"
            value={prices.forced}
            onChange={handleChange}
            type="number"
            fullWidth
          />
          <TextField
            label="قیمت هر روز (دانشجوی عادی)"
            name="bootcamp"
            value={prices.bootcamp}
            onChange={handleChange}
            type="number"
            fullWidth
          />
          <TextField
            label="قیمت هر روز (غیر دانشجو)"
            name="normal"
            value={prices.normal}
            onChange={handleChange}
            type="number"
            fullWidth
          />
          <Button variant="contained" onClick={handleSave}>ذخیره</Button>
          {saved && <Typography color="success.main" align="center">ذخیره شد!</Typography>}
        </Stack>
        {/* مدیریت فعال بودن دوره‌ها */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" mb={2} align="center">مدیریت فعال/غیرفعال بودن دوره‌ها</Typography>
        <Stack spacing={1}>
          {bootcamps.length === 0 && <Typography color="text.secondary" align="center">دوره‌ای ثبت نشده است.</Typography>}
          {bootcamps.map(b => (
            <FormControlLabel
              key={b}
              control={<Checkbox checked={activeBootcamps.includes(b)} onChange={() => handleBootcampToggle(b)} />}
              label={b}
            />
          ))}
        </Stack>
      </Paper>
    </Box>
  );
} 
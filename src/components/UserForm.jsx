import React, { useState } from 'react'
import { TextField, Button, MenuItem, FormControlLabel, Switch, Box, Typography, Stepper, Step, StepLabel, Snackbar, Alert, Paper } from '@mui/material'
import { v4 as uuidv4 } from 'uuid'
import { addUser } from '../utils/storage'
import { getUsers } from '../utils/storage'

const idDocTypes = [
  { value: 'کارت ملی', label: 'کارت ملی' },
  { value: 'گواهینامه', label: 'گواهینامه' },
  { value: 'سایر', label: 'سایر' },
]

const steps = ['انتخاب نوع کاربر', 'اطلاعات فردی', 'اطلاعات تکمیلی']

export default function UserForm({ onSuccess, setUsers }) {
  const [isBootcamp, setIsBootcamp] = useState(false)
  const [isForced, setIsForced] = useState(false)
  const [form, setForm] = useState({
    name: '',
    family: '',
    phone: '',
    nationalId: '',
    idDocType: '',
    idDocOther: '',
    emergencyPhone: '',
    desc: '',
    bootcampRound: '',
    bootcampType: '',
    type: 'normal',
  })
  const [errors, setErrors] = useState({})
  const [activeStep, setActiveStep] = useState(0)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [avatar, setAvatar] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAvatarChange = e => {
    setAvatar(e.target.value);
  };

  const validateStep = () => {
    let errs = {}
    if (activeStep === 1) {
      if (!form.name) errs.name = 'نام الزامی است'
      if (!form.family) errs.family = 'نام خانوادگی الزامی است'
      if (!form.phone) errs.phone = 'شماره تماس الزامی است'
    }
    if (activeStep === 2) {
      if (isBootcamp) {
        if (!form.bootcampRound) errs.bootcampRound = 'دوره چندم؟'
        if (!form.bootcampType) errs.bootcampType = 'نوع دوره؟'
      } else {
        if (!form.nationalId) errs.nationalId = 'کد ملی الزامی است'
        if (!form.idDocType) errs.idDocType = 'مدرک شناسایی الزامی است'
        if (form.idDocType === 'سایر' && !form.idDocOther) errs.idDocOther = 'توضیح مدرک الزامی است'
        if (!form.emergencyPhone) errs.emergencyPhone = 'شماره تماس اضطراری الزامی است'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = e => {
    e && e.preventDefault()
    if (!validateStep()) return
    if (activeStep < steps.length - 1) setActiveStep(s => s + 1)
    else handleSubmit()
  }
  const handleBack = () => setActiveStep(s => s - 1)

  const handleSubmit = () => {
    // ساخت آبجکت کاربر
    const user = {
      id: uuidv4(),
      ...form,
      avatar,
      isBootcamp,
      type: isBootcamp && isForced ? 'cowork-forced' : 'normal',
      bootcampRound: isBootcamp ? form.bootcampRound : undefined,
      bootcampType: isBootcamp ? form.bootcampType : undefined,
      subscriptions: [],
      attendances: [],
      courseAttendances: [], // حضور در کلاس‌های دوره
      courseOutSessions: [], // خروج‌های موقت در کلاس‌های دوره
      debts: [],
      absenceCalls: [],
      outSessions: [], // اضافه کردن فیلد خروج موقت
    }
    addUser(user)
    if (setUsers) setUsers(getUsers())
    if (onSuccess) onSuccess(user)
    setForm({
      name: '', family: '', phone: '', nationalId: '', idDocType: '', idDocOther: '', emergencyPhone: '', desc: '', bootcampRound: '', bootcampType: '', type: 'normal',
    })
    setAvatar('')
    setIsBootcamp(false)
    setIsForced(false)
    setActiveStep(0)
    setOpenSnackbar(true)
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto', mb: 4 }}>
      <Typography variant="h6" mb={2} align="center">ثبت‌نام کاربر جدید</Typography>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>
      <form onSubmit={handleNext}>
        {activeStep === 0 && (
          <>
            <FormControlLabel
              control={<Switch checked={isBootcamp} onChange={e => { setIsBootcamp(e.target.checked); if (!e.target.checked) setIsForced(false) }} />}
              label="دانشجوی بوتکمپ هستم"
              sx={{ mb: 2, display: 'block' }}
            />
            {isBootcamp && (
              <FormControlLabel
                control={<Switch checked={isForced} onChange={e => setIsForced(e.target.checked)} />}
                label="حضور اجباری (پیگیری غیبت)"
                sx={{ mb: 2, display: 'block' }}
              />
            )}
          </>
        )}
        {activeStep === 1 && (
          <>
            {/* لینک عکس */}
            <TextField
              label="لینک عکس (اختیاری)"
              name="avatar"
              value={avatar}
              onChange={handleAvatarChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="نام"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="نام خانوادگی"
              name="family"
              value={form.family}
              onChange={handleChange}
              error={!!errors.family}
              helperText={errors.family}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="شماره تماس"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              fullWidth
              sx={{ mb: 2 }}
            />
          </>
        )}
        {activeStep === 2 && (
          isBootcamp ? (
            <>
              <TextField
                label="دوره چندم"
                name="bootcampRound"
                value={form.bootcampRound}
                onChange={handleChange}
                error={!!errors.bootcampRound}
                helperText={errors.bootcampRound}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="نوع بوتکمپ"
                name="bootcampType"
                value={form.bootcampType}
                onChange={handleChange}
                error={!!errors.bootcampType}
                helperText={errors.bootcampType}
                select
                fullWidth
                sx={{ mb: 2 }}
              >
                <MenuItem value="فرانت‌اند">فرانت‌اند</MenuItem>
                <MenuItem value="بک‌اند">بک‌اند</MenuItem>
                <MenuItem value="UI/UX">UI/UX</MenuItem>
              </TextField>
            </>
          ) : (
            <>
              <TextField
                label="کد ملی"
                name="nationalId"
                value={form.nationalId}
                onChange={handleChange}
                error={!!errors.nationalId}
                helperText={errors.nationalId}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="مدرک شناسایی"
                name="idDocType"
                value={form.idDocType}
                onChange={handleChange}
                error={!!errors.idDocType}
                helperText={errors.idDocType}
                select
                fullWidth
                sx={{ mb: 2 }}
              >
                {idDocTypes.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
              {form.idDocType === 'سایر' && (
                <TextField
                  label="توضیح مدرک شناسایی"
                  name="idDocOther"
                  value={form.idDocOther}
                  onChange={handleChange}
                  error={!!errors.idDocOther}
                  helperText={errors.idDocOther}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              )}
              <TextField
                label="شماره تماس اضطراری"
                name="emergencyPhone"
                value={form.emergencyPhone}
                onChange={handleChange}
                error={!!errors.emergencyPhone}
                helperText={errors.emergencyPhone}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="توضیحات"
                name="desc"
                value={form.desc}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
                multiline
                minRows={2}
              />
            </>
          )
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">قبلی</Button>
          <Button type="submit" variant="contained" color="primary">
            {activeStep === steps.length - 1 ? 'ثبت کاربر' : 'بعدی'}
          </Button>
        </Box>
      </form>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }}>
          کاربر با موفقیت ثبت شد!
        </Alert>
      </Snackbar>
    </Paper>
  )
} 
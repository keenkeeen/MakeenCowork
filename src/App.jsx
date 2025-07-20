import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import UserForm from './components/UserForm'
import UserList from './components/UserList'
import UserDetails from './components/UserDetails'
import DailyDashboard from './components/DailyDashboard'
import CourseAttendance from './components/CourseAttendance'
import StudentAttendance from './components/StudentAttendance'
import AppLayout from './layout/AppLayout'
import { Typography } from '@mui/material'
import { getUsers } from './utils/storage'
import SettingsMain from './components/SettingsMain'
import AccountCharge from './components/AccountCharge'

function App() {
  const [selectedUser, setSelectedUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [users, setUsers] = useState(getUsers())
  return (
    <AppLayout page={page} onChangePage={setPage}>
      {page === 'dashboard' && <DailyDashboard users={users} setUsers={setUsers} />}
      {page === 'users' && <>
        <UserForm onSuccess={() => setSelectedUser(null)} setUsers={setUsers} />
        <UserList onSelect={setSelectedUser} users={users} setUsers={setUsers} />
        <UserDetails user={selectedUser} setUsers={setUsers} />
      </>}
      {page === 'course-attendance' && <CourseAttendance users={users} setUsers={setUsers} />}
      {page === 'student-attendance' && <StudentAttendance users={users} setUsers={setUsers} />}
      {page === 'settings' && <SettingsMain />}
      {page === 'charge' && <AccountCharge users={users} setUsers={setUsers} />}
      {page === 'stats' && <Typography variant="h5" align="center" sx={{ mt: 8 }}>بخش آمار به زودی...</Typography>}
    </AppLayout>
  )
}

export default App

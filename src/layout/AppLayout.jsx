import React, { useState } from 'react'
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, IconButton, CssBaseline } from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import BarChartIcon from '@mui/icons-material/BarChart'
import SchoolIcon from '@mui/icons-material/School'
import AssignmentIcon from '@mui/icons-material/Assignment'
import MenuIcon from '@mui/icons-material/Menu'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'

const drawerWidth = 200

const menuItems = [
  { key: 'dashboard', label: 'مدیریت کوورک', icon: <DashboardIcon /> },
  { key: 'users', label: 'کاربران', icon: <PeopleIcon /> },
  { key: 'course-attendance', label: 'حضور غیاب دوره', icon: <SchoolIcon /> },
  { key: 'student-attendance', label: 'آمار حضور و غیاب دانشجوها', icon: <AssignmentIcon /> },
  { key: 'charge', label: 'شارژ حساب', icon: <BarChartIcon /> },
  { key: 'settings', label: 'تنظیمات اصلی', icon: <BarChartIcon /> },
  { key: 'stats', label: 'آمار', icon: <BarChartIcon /> },
]

export default function AppLayout({ page, onChangePage, children }) {
  // حذف state open
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: 1201, background: 'primary.main', right: 0, left: 'auto', width: `calc(100% - ${drawerWidth}px)` }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            مدیریت فضای کار اشتراکی
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        anchor="right"
        open={true}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: '#f7f7fa',
            right: 0,
            left: 'auto',
          },
        }}
      >
        <Toolbar />
        <List>
          {menuItems.map(item => (
            <ListItem button key={item.key} selected={page === item.key} onClick={() => onChangePage(item.key)} sx={{ justifyContent: 'flex-end', textAlign: 'right' }}>
              <ListItemText primary={item.label} sx={{ textAlign: 'right', mr: 1 }} />
              <ListItemIcon sx={{ minWidth: 36, ml: 1 }}>{item.icon}</ListItemIcon>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, background: '#f5f5f5', minHeight: '100vh', marginRight: `${drawerWidth}px` }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
} 
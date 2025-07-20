// ابزار ذخیره‌سازی داده‌ها در LocalStorage

const STORAGE_KEY = 'cowork3_users'

export function getUsers() {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export function addUser(user) {
  const users = getUsers()
  users.push(user)
  saveUsers(users)
}

export function updateUser(updatedUser) {
  const users = getUsers().map(u => u.id === updatedUser.id ? updatedUser : u)
  saveUsers(users)
}

export function deleteUser(userId) {
  const users = getUsers().filter(u => u.id !== userId)
  saveUsers(users)
} 

// تابع محاسبه روزهای باقی‌مانده اشتراک
export const calculateRemainingDays = (user) => {
  if (!user) return 0;
  const totalDays = user.subscriptions?.reduce((sum, s) => sum + (s.days || 0), 0) || 0;
  const attendedDays = user.attendances?.length || 0;
  return Math.max(0, totalDays - attendedDays);
}; 
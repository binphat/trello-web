import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Board from '~/pages/Boards/_id'
import NotFound from './pages/404/NotFound(test)'
import Auth from '~/pages/Auth/Auth.jsx'
import AccountVerification from './pages/Auth/AccountVerification'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/User/userSlice'
import Settings from '~/pages/Settings/Settings'
import Boards from './pages/Boards'
import AdminAllBoards from './components/Admin/AdminAllBoards'

/**
 * Component xử lý chuyển hướng dựa trên role của user
 */
const RoleBasedRedirect = ({ user }) => {
  console.log('🔄 RoleBasedRedirect check:', {
    user: user,
    hasUser: !!user,
    role: user?.role
  })

  if (!user) {
    return <Navigate to='/login' replace={true} />
  }

  // Chuyển hướng dựa trên role
  if (user.role === 'admin') {
    return <Navigate to='/admin/all' replace={true} />
  } else {
    // Client hoặc các role khác
    return <Navigate to='/boards' replace={true} />
  }
}

/**
 * Giải pháp Clean Code trong việc xác định các
 * route nào cần đăng nhập tài khoản xong thì mới
 * cho truy cập
 *
 * Sử dụng <Outlet /> của react-router-dom để hiển
 * thị các Child Route (xem cách sử dụng trong App()
 * bên dưới)
 * https://reactrouter.com/en/main/components/outlet
 *
 * Một bài hướng dẫn khá đầy đủ:
 * https://www.robinwieruch.de/react-router-
 * private-routes/
 */
const ProtectedRoute = ({ user }) => {
  // ✅ Enhanced debugging
  console.log('🛡️ ProtectedRoute check:', {
    user: user,
    hasUser: !!user,
    userId: user?._id || user?.id,
    email: user?.email
  })

  if (!user) return <Navigate to='/login' replace={true}/>
  return <Outlet />
}

/**
 * Component bảo vệ routes chỉ dành cho admin
 */
const AdminRoute = ({ user }) => {
  console.log('👑 AdminRoute check:', {
    user: user,
    hasUser: !!user,
    role: user?.role,
    isAdmin: user?.role === 'admin'
  })
  
  // Kiểm tra user đã đăng nhập chưa
  if (!user) return <Navigate to='/login' replace={true}/>
  
  // Kiểm tra user có phải admin không
  if (user.role !== 'admin') {
    return <Navigate to='/boards' replace={true}/>
  }
  
  return <Outlet />
}

/**
 * Component bảo vệ routes chỉ dành cho client
 */
const ClientRoute = ({ user }) => {
  console.log('👤 ClientRoute check:', {
    user: user,
    hasUser: !!user,
    role: user?.role,
    isClient: user?.role !== 'admin'
  })
  
  // Kiểm tra user đã đăng nhập chưa
  if (!user) return <Navigate to='/login' replace={true}/>
  
  // Kiểm tra user có phải client không (không phải admin)
  if (user.role === 'admin') {
    return <Navigate to='/admin/all' replace={true}/>
  }
  
  return <Outlet />
}

function App() {
  const currentUser = useSelector(selectCurrentUser)
  
  // ✅ Debug current user state
  console.log('🎯 App render - Current user from Redux:', {
    currentUser,
    hasUser: !!currentUser,
    userId: currentUser?._id || currentUser?.id,
    role: currentUser?.role
  })

  return (
    <Routes>
      {/* Root route - chuyển hướng dựa trên role */}
      <Route path='/' element={<RoleBasedRedirect user={currentUser} />} />
      
      {/* Admin Routes - Chỉ dành cho admin */}
      <Route element={<AdminRoute user={currentUser} />}>
        <Route path='/admin/all' element={<AdminAllBoards />} />
        {/* Có thể thêm các route admin khác ở đây */}
        {/* <Route path='/admin/users' element={<AdminUsers />} /> */}
        {/* <Route path='/admin/settings' element={<AdminSettings />} /> */}
      </Route>
      
      {/* Client Routes - Chỉ dành cho client (không phải admin) */}
      <Route element={<ClientRoute user={currentUser} />}>
        {/* Board Details */}
        <Route path='/boards/:boardId' element={<Board />} />
        {/* Board List */}
        <Route path='/boards/' element={<Boards />} />
      </Route>
      
      {/* Protected Routes - Cho tất cả user đã đăng nhập */}
      <Route element={<ProtectedRoute user={currentUser} />}>
        {/* User Settings - cả admin và client đều có thể truy cập */}
        <Route path='/settings/account' element={<Settings />} />
        <Route path='/settings/security' element={<Settings />} />
        <Route path='/settings/rating' element={<Settings />} />
      </Route>
      
      {/* Authentication Routes - Chỉ cho user chưa đăng nhập */}
      <Route path='/login' element={
        currentUser ? <RoleBasedRedirect user={currentUser} /> : <Auth />
      }/>
      <Route path='/register' element={
        currentUser ? <RoleBasedRedirect user={currentUser} /> : <Auth />
      }/>
      <Route path='/account/verification' element={<AccountVerification />}/>
      
      {/* 404 Route */}
      <Route path='*' element={<NotFound />} />
    </Routes>
  )
}

export default App
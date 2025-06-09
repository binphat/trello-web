//
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
//
import Board from '~/pages/Boards/_id'
import NotFound from './pages/404/NotFound(test)'
import Auth from '~/pages/Auth/Auth.jsx'
import AccountVerification from './pages/Auth/AccountVerification'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/User/userSlice'
import Settings from '~/pages/Settings/Settings'
import Boards from './pages/Boards'
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
function App() {
  const currentUser = useSelector(selectCurrentUser)
    // ✅ Debug current user state
    console.log('🎯 App render - Current user from Redux:', {
      currentUser,
      hasUser: !!currentUser,
      userId: currentUser?._id || currentUser?.id
    })
  return (
    <Routes>
      <Route path='/' element={
        // Ở đây cần replace giá trị true để nó thay thế route /, có thể hiểu là route / sẽ không còn nằm trong history của Browser.
        // Thực hành để hiểu hơn bằng cách nhấn Go Home từ trang 404 xong thử quay lại
        // bằng nút back của trình duyệt giữa 2 trường hợp có replace hoặc không có.
        <Navigate to="/boards" replace={true} />
      } />
      {/* Protected Routes (Hiểu đơn giản trong dự án
        của chúng ta là những route chỉ cho truy cập sau
        khi đã login) */}
      <Route element={<ProtectedRoute user={currentUser} />}>

        {/* React Router Dom/boards/{board_id} */}
        {/* <Outlet /> của react-router-dom sẽ chạy vào child route trong này */}
        {/* Board Details */}
        <Route path='/boards/:boardId' element={<Board />} />
        {/* Board List */}
        <Route path='/boards/' element={<Boards />} />
        {/* User Setting */}
        <Route path='settings/account' element={<Settings />} />
        <Route path='settings/security' element={<Settings />} />
        <Route path='settings/rating' element={<Settings />} />
      </Route>
      {/* Authetication*/}
      <Route path='/login' element={<Auth />}/>
      <Route path='/register' element={<Auth />}/>
      <Route path='/account/verification' element={<AccountVerification />}/>

      <Route path='*' element={<NotFound/> } />
    </Routes>
  )
}

export default App

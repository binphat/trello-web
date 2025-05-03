//
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
//
import Board from '~/pages/Boards/_id'
import NotFound from './pages/404/NotFound(test)'
import Auth from '~/pages/Auth/Auth.jsx'
import AccountVerification from './pages/Auth/AccountVerification'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/User/userSlice'

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
  if (!user) return <Navigate to='/login' replace={true}/>
  return <Outlet />
}
function App() {
  const currentUser = useSelector(selectCurrentUser)
  return (
    <Routes>
      <Route path='/' element={
        // Ở đây cần replace giá trị true để nó thay thế route /, có thể hiểu là route / sẽ không còn nằm trong history của Browser.
        // Thực hành để hiểu hơn bằng cách nhấn Go Home từ trang 404 xong thử quay lại
        // bằng nút back của trình duyệt giữa 2 trường hợp có replace hoặc không có.
        <Navigate to="/boards/6800a4e43d2e90f5dd5bd70c" replace={true} />
      } />
      {/* Protected Routes (Hiểu đơn giản trong dự án
        của chúng ta là những route chỉ cho truy cập sau
        khi đã login) */}
      <Route element={<ProtectedRoute user={currentUser} />}>

        {/* React Router Dom/boards/{board_id} */}
        {/* <Outlet /> của react-router-dom sẽ chạy vào child route trong này */}
        {/* Board Details */}
        <Route path='/boards/:boardId' element={<Board />} />

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

//
import { Routes, Route, Navigate } from 'react-router-dom'
//
import Board from '~/pages/Boards/_id'
import NotFound from './pages/404/NotFound'
import Auth from '~/pages/Auth/Auth.jsx'

function App() {
  return (
    <Routes>
      <Route path='/' element={
        // Ở đây cần replace giá trị true để nó thay thế route /, có thể hiểu là route / sẽ không còn nằm trong history của Browser.
        // Thực hành để hiểu hơn bằng cách nhấn Go Home từ trang 404 xong thử quay lại
        // bằng nút back của trình duyệt giữa 2 trường hợp có replace hoặc không có.
        <Navigate to="/boards/6800a4e43d2e90f5dd5bd70c" replace={true} />
      } />
      {/* React Router Dom/boards/{board_id} */}
      {/* Board Details */}
      <Route path='/boards/:boardId' element={<Board />} />

      {/* Authetication*/}
      <Route path='/login' element={<Auth />}/>
      <Route path='/register' element={<Auth />}/>


      <Route path='*' element={<NotFound/> } />
    </Routes>
  )
}

export default App

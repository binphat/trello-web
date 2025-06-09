import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'
import { toast } from 'react-toastify'

// Khởi tạo giá trị State của một cái Slice (Mảnh) trong Redux
const initialState = {
  currentUser: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null
}

// Các hành động gọi api (bất đồng bộ) và cập nhật dữ liệu vào Redux, dùng Middleware createAsyncThunk đi kèm với extraReducers
// createAsyncThunk
export const loginUserAPI = createAsyncThunk(
  'user/loginUserAPI',
  async (data) => {
    const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/login`, data)
    // ✅ Debug: Kiểm tra response
    console.log('Login Response:', response.data)
    // Lưu ý: Axios sẽ trả về kết quả về qua property của nó là data
    return response.data
  }
)
export const updateUserAPI = createAsyncThunk(
  'user/updateUserAPI',
  async (data) => {
    const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/update`, data)
    return response.data
  }
)
export const logoutUserAPI = createAsyncThunk(
  'user/logoutUserAPI',
  async (showSuccessMessage = true) => {
    const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/logout`)
    if (showSuccessMessage) {
      toast.success('Đăng xuất thành công')
    }
    return response.data
  }
)

// Khởi tạo một cái Slice trong kho lưu trữ - Redux Store
export const userSlice = createSlice({
  name: 'user',
  initialState,
  // Nơi xử lý dữ liệu đồng bộ
  reducers: {},
  // extraReducers: Nơi xử lý dữ liệu bất đồng bộ
  extraReducers: (builder) => {
    builder.addCase(loginUserAPI.fulfilled, (state, action) => {
      // ✅ FIX: Backend trả về tất cả data ở cùng level, không có nested { user, token }
      const userData = action.payload

      // Tách token ra khỏi userData
      const { accessToken, refreshToken, ...userInfo } = userData

      // Lưu user info (không bao gồm token)
      state.currentUser = userInfo

      // Lưu accessToken
      state.token = accessToken

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', accessToken)
      }

      // ✅ Debug log
      console.log('✅ User stored in Redux:', userInfo)
      console.log('✅ Token stored in Redux:', accessToken)
    })
      .addCase(loginUserAPI.rejected, (state, action) => {
      // ✅ Xử lý khi login thất bại
        state.currentUser = null
        state.token = null
        console.error('❌ Login failed:', action.error)
      })
      .addCase(logoutUserAPI.fulfilled, (state) => {
        state.currentUser = null
        state.token = null
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
      })
      .addCase(updateUserAPI.fulfilled, (state, action) => {
        const user = action.payload
        state.currentUser = user
      })
  }
})

// Actions: Là nơi định nghĩa cho các components bên dưới gọi bằng dispatch() tới nó để cập nhật lại dữ liệu thông qua reducer (chạy đồng bộ)
//
// Để ý ở trên thì không thấy properties actions đâu cả, bởi vì cái actions này đơn giản là được thằng redux tạo tự động theo tên của reducer nhé.
// export const {} = userSlice.actions

// Selectors: Là nơi dành cho các components bên dưới gọi bằng hook useSelector() để lấy dữ liệu từ trong kho redux store ra sử dụng
export const selectCurrentUser = (state) => {
  return state.user.currentUser
}

export const userReducer = userSlice.reducer
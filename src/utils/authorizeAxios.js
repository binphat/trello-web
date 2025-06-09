import axios from 'axios'
import { toast } from 'react-toastify'
import { interceptorLoadingElements } from './formatters'
import { refreshTokenAPI } from '~/apis'
import { logoutUserAPI } from '~/redux/User/userSlice'

let axiosReduxStore

export const injectStore = (mainStore) => {
  axiosReduxStore = mainStore
}

// Khởi tạo axios instance với cấu hình mặc định
let authorizedAxiosInstance = axios.create({
  // Thêm baseURL nếu cần
  // baseURL: process.env.API_ROOT,
  timeout: 1000 * 60 * 10, // 10 phút timeout
  withCredentials: true, // Bật chế độ gửi cookie tự động
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Thêm interceptor cho request
authorizedAxiosInstance.interceptors.request.use((config) => {
  // Lấy token từ Redux store (thay vì localStorage để tránh vấn đề với chế độ ẩn danh)
  const state = axiosReduxStore?.getState()
  const token = state?.user?.currentUser?.accessToken || state?.user?.token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('🔑 Added token to request:', token.substring(0, 20) + '...')
  } else {
    console.log('⚠️ No token found in Redux store')
  }

  // Debug thông tin request
  console.log('🚀 Making request to:', config.url)
  console.log('🔍 Request headers:', config.headers)

  interceptorLoadingElements(true)
  return config
}, (error) => {
  interceptorLoadingElements(false)
  return Promise.reject(error)
})

let refreshTokenPromise = null

// Thêm interceptor cho response
authorizedAxiosInstance.interceptors.response.use(
  (response) => {
    interceptorLoadingElements(false)
    return response
  },
  async (error) => {
    interceptorLoadingElements(false)
    const originalRequest = error.config
    
    // Xử lý lỗi 401 (Unauthorized)
    if (error.response?.status === 401) {
      console.log('🚫 401 Unauthorized - dispatching logout')
      // Thêm kiểm tra tránh lặp vô hạn
      if (!originalRequest._retry && !originalRequest.url.includes('/logout')) {
        axiosReduxStore.dispatch(logoutUserAPI(false))
      }
      return Promise.reject(error)
    }

    // Xử lý lỗi 410 (GONE) - Refresh token
    if (error.response?.status === 410 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        if (!refreshTokenPromise) {
          refreshTokenPromise = refreshTokenAPI()
            .then(data => {
              // Cập nhật token mới vào Redux store
              const newUserData = {
                ...axiosReduxStore.getState().user.currentUser,
                accessToken: data?.accessToken
              }

              axiosReduxStore.dispatch({
                type: 'user/loginUserAPI/fulfilled',
                payload: newUserData
              })
              return data?.accessToken
            })
            .finally(() => {
              refreshTokenPromise = null
            })
        }

        const accessToken = await refreshTokenPromise
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return authorizedAxiosInstance(originalRequest)
      } catch (refreshError) {
        // Nếu refresh token thất bại thì đăng xuất
        if (!originalRequest.url.includes('/logout')) {
          axiosReduxStore.dispatch(logoutUserAPI(false))
        }
        return Promise.reject(refreshError)
      }
    }

    // Xử lý thông báo lỗi chung
    if (error.response?.status !== 410) { // Không hiển thị toast cho lỗi 410
      const errorMessage = error.response?.data?.message || error?.message
      toast.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

export default authorizedAxiosInstance
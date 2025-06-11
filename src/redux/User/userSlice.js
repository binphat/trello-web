import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'
import { toast } from 'react-toastify'

// ✅ Enhanced safe storage helpers
const createStorageHelper = (storage) => ({
  get: (key) => {
    try {
      if (typeof window !== 'undefined' && storage) {
        const item = storage.getItem(key)
        return item === 'undefined' ? null : item
      }
    } catch (error) {
      console.warn(`${storage.constructor.name} not available:`, error)
    }
    return null
  },

  set: (key, value) => {
    try {
      if (typeof window !== 'undefined' && storage && value !== null && value !== undefined) {
        storage.setItem(key, value)
        return true
      }
    } catch (error) {
      console.warn(`${storage.constructor.name} not available:`, error)
    }
    return false
  },

  remove: (key) => {
    try {
      if (typeof window !== 'undefined' && storage) {
        storage.removeItem(key)
        return true
      }
    } catch (error) {
      console.warn(`${storage.constructor.name} not available:`, error)
    }
    return false
  },

  setJSON: (key, obj) => {
    try {
      const jsonString = JSON.stringify(obj)
      return createStorageHelper(storage).set(key, jsonString)
    } catch (error) {
      console.warn('Failed to stringify object:', error)
      return false
    }
  },

  getJSON: (key) => {
    try {
      const jsonString = createStorageHelper(storage).get(key)
      return jsonString ? JSON.parse(jsonString) : null
    } catch (error) {
      console.warn('Failed to parse JSON:', error)
      return null
    }
  }
})

const localStorage = createStorageHelper(typeof window !== 'undefined' ? window.localStorage : null)
const sessionStorage = createStorageHelper(typeof window !== 'undefined' ? window.sessionStorage : null)

// ✅ Get initial user state from storage (prefer localStorage, fallback to sessionStorage)
const getInitialUserState = () => {
  // Try to get from localStorage first
  let currentUser = localStorage.getJSON('currentUser')
  let token = localStorage.get('token')

  // Fallback to sessionStorage if localStorage fails (private mode)
  if (!currentUser || !token) {
    currentUser = sessionStorage.getJSON('currentUser') || null
    token = sessionStorage.get('token') || null
  }

  return { currentUser, token }
}

// Khởi tạo giá trị State của một cái Slice (Mảnh) trong Redux
const initialState = getInitialUserState()

// Các hành động gọi api (bất đồng bộ) và cập nhật dữ liệu vào Redux, dùng Middleware createAsyncThunk đi kèm với extraReducers
export const loginUserAPI = createAsyncThunk(
  'user/loginUserAPI',
  async (data) => {
    const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/login`, data)
    return response.data
  }
)

export const updateUserAPI = createAsyncThunk(
  'user/updateUserAPI',
  async (data) => {
    let config = {}
    let payload

    // Nếu là FormData, tức là có upload file
    if (data instanceof FormData) {
      payload = data
      config = { headers: { 'Content-Type': 'multipart/form-data' } }
    } else {
      payload = data
    }

    const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/update`, payload, config)
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

// ✅ Helper to persist user data to storage
const persistUserData = (userInfo, token) => {
  // Try localStorage first
  const localStorageSuccess = localStorage.setJSON('currentUser', userInfo) && localStorage.set('token', token)

  // Always save to sessionStorage as backup
  sessionStorage.setJSON('currentUser', userInfo)
  sessionStorage.set('token', token)

}

// ✅ Helper to clear user data from storage
const clearUserData = () => {
  localStorage.remove('currentUser')
  localStorage.remove('token')
  sessionStorage.remove('currentUser')
  sessionStorage.remove('token')
}

// Khởi tạo một cai Slice trong kho lưu trữ - Redux Store
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loginUserAPI.fulfilled, (state, action) => {
      const userData = action.payload

      // Tách token ra khỏi userData
      const { accessToken, refreshToken, ...userInfo } = userData

      // Cập nhật state
      state.currentUser = userInfo
      state.token = accessToken

      // ✅ Persist to storage
      persistUserData(userInfo, accessToken)
    })
      .addCase(loginUserAPI.rejected, (state, action) => {
        state.currentUser = null
        state.token = null
        clearUserData()
      })
      .addCase(logoutUserAPI.fulfilled, (state) => {
        state.currentUser = null
        state.token = null
        clearUserData()
      })
      .addCase(updateUserAPI.fulfilled, (state, action) => {
        const updatedUser = action.payload
        console.log('🚀 ~ .addCase ~ updatedUser:', updatedUser)
        state.currentUser = { ...state.currentUser, ...updatedUser }
        persistUserData(state.currentUser, state.token)
      })
  }
})

// Selectors
export const selectCurrentUser = (state) => {
  return state.user.currentUser
}

export const selectCurrentToken = (state) => {
  return state.user.token
}

export const userReducer = userSlice.reducer
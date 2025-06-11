// detailedEvaluationResultsAPI.js - API functions cho RatingTab
import axios from 'axios'
import { API_ROOT } from '~/utils/constants'

// Improved function để lấy token từ nhiều nguồn
const getTokenFromMultipleSources = () => {
  try {
    // Method 1: Thử lấy từ localStorage trực tiếp
    const directToken = localStorage.getItem('token') || localStorage.getItem('accessToken')
    if (directToken) {
      console.log('🔑 Found direct token')
      return directToken
    }

    // Method 2: Thử lấy từ Redux Persist
    const persistedState = localStorage.getItem('persist:root')
    if (persistedState) {
      const parsedState = JSON.parse(persistedState)
      
      // Thử các đường dẫn khác nhau
      const possiblePaths = [
        () => JSON.parse(parsedState.user || '{}').currentUser?.accessToken,
        () => JSON.parse(parsedState.auth || '{}').user?.accessToken,
        () => JSON.parse(parsedState.auth || '{}').token,
        () => JSON.parse(parsedState.user || '{}').user?.accessToken,
        () => JSON.parse(parsedState.user || '{}').token
      ]

      for (const getToken of possiblePaths) {
        try {
          const token = getToken()
          if (token) {
            console.log('🔑 Found token from persist')
            return token
          }
        } catch (e) {
          // Continue to next method
        }
      }
    }

    // Method 3: Thử lấy từ sessionStorage
    const sessionToken = sessionStorage.getItem('token') || sessionStorage.getItem('accessToken')
    if (sessionToken) {
      console.log('🔑 Found session token')
      return sessionToken
    }

    console.log('❌ No token found anywhere')
    return null
  } catch (error) {
    console.error('Error getting token:', error)
    return null
  }
}

// Improved function để kiểm tra token có hợp lệ không
const validateToken = (token) => {
  if (!token) return false
  
  try {
    // Kiểm tra JWT format cơ bản
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    // Decode payload để kiểm tra expiry
    const payload = JSON.parse(atob(parts[1]))
    const now = Date.now() / 1000
    
    if (payload.exp && payload.exp < now) {
      console.log('❌ Token expired')
      return false
    }
    
    return true
  } catch (error) {
    console.log('❌ Invalid token format')
    return false
  }
}

// Enhanced function để handle auth error
const handleAuthError = (error) => {
  console.error('Authentication error:', error.response?.data)
  
  if (error.response?.status === 401) {
    // Clear all possible token storage locations
    localStorage.removeItem('token')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('persist:root')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('accessToken')
    
    // Show user-friendly message
    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    
    // Redirect to login
    window.location.href = '/login'
  }
  throw error
}

// 🆕 API function chính để lấy kết quả đánh giá chi tiết
export const getDetailedEvaluationResultsAPI = async (token = null) => {
  try {
    const authToken = token || getTokenFromMultipleSources()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    if (!validateToken(authToken)) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
    }
    
    console.log('🔄 Fetching detailed evaluation results...')
    console.log('🔑 Using token:', authToken.substring(0, 20) + '...')
    
    const response = await axios.get(`${API_ROOT}/v1/evaluations/my-results/detailed`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 15000 // 15 second timeout
    })
    
    console.log('✅ Detailed API Response:', response.data)
    
    if (response.data && response.data.success) {
      return response.data.data
    }
    
    throw new Error(response.data?.message || 'Không thể lấy kết quả đánh giá chi tiết')
  } catch (err) {
    console.error('❌ Get detailed evaluation results API Error:', err)
    
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err
  }
}

// 🆕 API function để lấy kết quả của một board cụ thể
export const getBoardDetailedResultsAPI = async (boardId, token = null) => {
  try {
    const authToken = token || getTokenFromMultipleSources()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    if (!validateToken(authToken)) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
    }
    
    console.log('🔄 Fetching board detailed results for:', boardId)
    
    const response = await axios.get(`${API_ROOT}/v1/evaluations/my-results/detailed`, {
      params: { boardId },
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 10000
    })
    
    console.log('✅ Board detailed API Response:', response.data)
    return response.data.data
  } catch (err) {
    console.error('❌ Get board detailed results API Error:', err)
    
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err
  }
}

// 🆕 API function để export kết quả đánh giá
export const exportEvaluationResultsAPI = async (boardId = null, format = 'excel', token = null) => {
  try {
    const authToken = token || getTokenFromMultipleSources()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    if (!validateToken(authToken)) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
    }
    
    console.log('🔄 Exporting evaluation results...')
    
    const params = { format }
    if (boardId) params.boardId = boardId
    
    const response = await axios.get(`${API_ROOT}/v1/evaluations/export`, {
      params,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      responseType: 'blob', // Quan trọng cho file download
      withCredentials: true,
      timeout: 30000 // 30 second timeout cho export
    })
    
    // Tạo URL để download file
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    
    // Lấy filename từ response header hoặc tạo default
    const contentDisposition = response.headers['content-disposition']
    let filename = 'evaluation-results.xlsx'
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }
    
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    console.log('✅ Successfully exported evaluation results')
    return { success: true, filename }
  } catch (err) {
    console.error('❌ Export evaluation results API Error:', err)
    
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err
  }
}

// 🆕 API function để lấy thống kê chi tiết
export const getEvaluationStatisticsAPI = async (timeRange = '3months', token = null) => {
  try {
    const authToken = token || getTokenFromMultipleSources()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    if (!validateToken(authToken)) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
    }
    
    console.log('🔄 Fetching evaluation statistics...')
    
    const response = await axios.get(`${API_ROOT}/v1/evaluations/statistics`, {
      params: { timeRange },
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 10000
    })
    
    console.log('✅ Statistics API Response:', response.data)
    return response.data.data
  } catch (err) {
    console.error('❌ Get evaluation statistics API Error:', err)
    
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err
  }
}

// Utility function để test API
export const testDetailedEvaluationAPI = async (token = null) => {
  try {
    const authToken = token || getTokenFromMultipleSources()
    console.log('🧪 Testing detailed evaluation API...')
    
    if (!authToken) {
      return { valid: false, error: 'No token found' }
    }

    if (!validateToken(authToken)) {
      return { valid: false, error: 'Token invalid or expired' }
    }

    // Test với detailed evaluation endpoint
    const response = await axios.get(`${API_ROOT}/v1/evaluations/my-results/detailed`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 5000
    })

    return { valid: true, data: response.data }
  } catch (err) {
    console.error('❌ Detailed evaluation API test failed:', err)
    return { valid: false, error: err.message }
  }
}
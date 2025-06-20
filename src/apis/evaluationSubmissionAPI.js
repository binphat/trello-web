// evaluationSubmissionAPI.js - Improved version with better token handling

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

// Enhanced API functions
export const getAllMyEvaluationResultsAPI = async (userId = null, token = null) => {
  try {
    const authToken = token || getTokenFromMultipleSources()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    if (!validateToken(authToken)) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
    }
    
    console.log('🔑 Using token:', authToken.substring(0, 20) + '...')
    
    const params = userId ? { userId } : {}
    
    const response = await axios.get(`${API_ROOT}/v1/evaluations/my-results/all`, {
      params,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 10000 // 10 second timeout
    })
    
    console.log('✅ API Response:', response.data)
    return response.data
  } catch (err) {
    console.error('❌ Get my evaluation results API Error:', err)
    
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err
  }
}

export const submitSingleEvaluationAPI = async (evaluationData, token = null) => {
  try {
    const authToken = token || getTokenFromMultipleSources()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    if (!validateToken(authToken)) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
    }

    console.log('🚀 Submitting evaluation with token:', authToken.substring(0, 20) + '...')

    const response = await axios.post(
      `${API_ROOT}/v1/evaluations`,
      {
        board: evaluationData.boardId,
        evaluatedUser: evaluationData.evaluatedUserId,
        evaluator: evaluationData.evaluatorId,
        ratings: Object.entries(evaluationData.ratings).map(([id, score]) => ({
          criterion: id,
          score
        }))
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        timeout: 15000 // 15 second timeout
      }
    )

    console.log('✅ Submit response:', response.data)

    if (response.data && (response.data._id || response.data.success)) {
      return response.data
    }
    throw new Error(response.data?.message || 'Đánh giá không thành công')
  } catch (err) {
    console.error('❌ Submit evaluation API Error:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    })
    
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err
  }
}

export const getMyEvaluationsAPI = async (boardId = null, token = null) => {
  try {
    const authToken = token || getTokenFromMultipleSources()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    if (!validateToken(authToken)) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
    }
    
    const params = boardId ? { boardId } : {}
    const response = await axios.get(
      `${API_ROOT}/v1/evaluations`,
      {
        params,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        timeout: 10000
      }
    )
    return response.data
  } catch (err) {
    console.error('❌ Get evaluations API Error:', err)
    
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err
  }
}

export const getMyEvaluationResultsAPI = async (boardId, userId, token = null) => {
  try {
    const authToken = token || getTokenFromMultipleSources()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

    if (!validateToken(authToken)) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.')
    }
    
    const response = await axios.get(
      `${API_ROOT}/v1/evaluations/my-results`,
      {
        params: { boardId, userId },
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        timeout: 10000
      }
    )
    return response.data
  } catch (err) {
    console.error('❌ Get my evaluation results API Error:', err)
    
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err
  }
}

// Utility function để test token
export const testTokenAPI = async (token = null) => {
  try {
    const authToken = token || getTokenFromMultipleSources()
    console.log('🧪 Testing token:', authToken ? 'Token found' : 'No token')
    
    if (!authToken) {
      return { valid: false, error: 'No token found' }
    }

    if (!validateToken(authToken)) {
      return { valid: false, error: 'Token invalid or expired' }
    }

    // Test với một API endpoint đơn giản
    const response = await axios.get(`${API_ROOT}/v1/user/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 5000
    })

    return { valid: true, data: response.data }
  } catch (err) {
    console.error('❌ Token test failed:', err)
    return { valid: false, error: err.message }
  }
}
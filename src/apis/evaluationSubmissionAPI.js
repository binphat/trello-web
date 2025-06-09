// evaluationSubmissionAPI.js - Version nhận token từ tham số

import axios from 'axios'
import { API_ROOT } from '~/utils/constants'

// Helper function để lấy token từ Redux Persist
const getTokenFromPersist = () => {
  try {
    const persistedState = localStorage.getItem('persist:root')
    console.log('🔍 Persisted state:', persistedState) // Debug line
    if (persistedState) {
      const parsedState = JSON.parse(persistedState)
      console.log('🔍 Parsed state:', parsedState) // Debug line
      if (parsedState.user) {
        const userState = JSON.parse(parsedState.user)
        console.log('🔍 User state:', userState) // Debug line
        console.log('🔑 Token:', userState.currentUser?.accessToken) // Debug line
        return userState.currentUser?.accessToken || null
      }
    }
    return null
  } catch (error) {
    console.error('Error getting token from persist:', error)
    return null
  }
}

// Helper function để handle authentication error
const handleAuthError = (error) => {
  if (error.response?.status === 401) {
    // Token hết hạn hoặc không hợp lệ
    localStorage.removeItem('persist:root')
    
    // Redirect to login (tùy theo routing của bạn)
    window.location.href = '/login'
    // hoặc: window.location.reload()
  }
  throw error
}

// API với token từ tham số hoặc persist
export const getAllMyEvaluationResultsAPI = async (userId = null, token = null) => {
  try {
    // Lấy token từ tham số hoặc persist
    const authToken = token || getTokenFromPersist()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }
    
    console.log('🔑 Using token:', authToken.substring(0, 20) + '...')
    
    const params = userId ? { userId } : {}
    
    const response = await axios.get(`${API_ROOT}/v1/evaluations/my-results/all`, {
      params,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    })
    
    console.log('✅ API Response:', response.data)
    return response.data
  } catch (err) {
    console.error('❌ Get my evaluation results API Error:', err)
    
    // Handle authentication errors
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err
  }
}

export const submitSingleEvaluationAPI = async (evaluationData, token = null) => {
  try {
    const authToken = token || getTokenFromPersist()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }

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
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && (response.data._id || response.data.success)) {
      return response.data;
    }
    throw new Error(response.data?.message || 'Đánh giá không thành công');
  } catch (err) {
    console.error('API Error:', {
      status: err.response?.status,
      data: err.response?.data,
      config: err.config
    });
    
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err;
  }
};

export const getMyEvaluationsAPI = async (boardId = null, token = null) => {
  try {
    const authToken = token || getTokenFromPersist()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }
    
    const params = boardId ? { boardId } : {}
    const response = await axios.get(
      `${API_ROOT}/v1/evaluations`,
      {
        params,
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  } catch (err) {
    console.error('Get evaluations API Error:', err)
    
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err
  }
}

export const getMyEvaluationResultsAPI = async (boardId, userId, token = null) => {
  try {
    const authToken = token || getTokenFromPersist()
    
    if (!authToken) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập lại.')
    }
    
    const response = await axios.get(
      `${API_ROOT}/v1/evaluations/my-results`,
      {
        params: { boardId, userId },
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  } catch (err) {
    console.error('Get my evaluation results API Error:', err)
    
    if (err.response?.status === 401) {
      handleAuthError(err)
    }
    
    throw err
  }
}
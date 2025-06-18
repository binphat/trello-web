import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'
import { toast } from 'react-toastify'
import { DEFAULT_ITEMS_PER_PAGE } from '~/utils/constants'
// Board
// Đã move vào redux
// export const fetchBoardDetailsAPI = async (boardId) => {
//   const response = await axios.get(`${API_ROOT}/v1/boards/${boardId}`)
//   // Lưu ý: Axios sẽ trả về kết quả về qua property của nó là data
//   return response.data
// }
// Board,
// put là cập nhật dữ liệu
export const updateBoardDetailsAPI = async (boardId, updateData) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/boards/${boardId}`, updateData)
  // put là cập nhật dữ liệu)
  return response.data
}

export const moveCardToDifferentColumnAPI = async (updateData) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/boards/supports/moving_card`, updateData)
  return response.data
}

// Column
export const createNewColumnAPI = async (newColumnData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/columns`, newColumnData)
  // Lưu ý: Axios sẽ trả về kết quả về qua property của nó là data
  return response.data
}
// Update Column
// put là cập nhật dữ liệu
export const updateColumnDetailsAPI = async (columnId, updateData) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/columns/${columnId}`, updateData)
  // put là cập nhật dữ liệu)
  return response.data
}
// Delete Column
export const deleteColumnDetailsAPI = async (columnId) => {
  const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/columns/${columnId}`)
  // put là cập nhật dữ liệu)
  return response.data
}


// Card
export const createNewCardAPI = async (newCardData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/cards`, newCardData)
  // Lưu ý: Axios sẽ trả về kết quả về qua property của nó là data
  return response.data
}
// 5. Thêm API function vào apis/index.js
export const deleteCardAPI = async (cardId) => {
  const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/cards/${cardId}`)
  return response.data
}

/** Users */
export const registerUserAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/register`, data)
  toast.success('Tài khoản được tạo thành công! Vui lòng kiểm tra và xác minh tài khoản của bạn trước khi đăng nhập!', { theme: 'colored' })
  return response.data
}

export const verifyUserAPI = async (data) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/verify`, data)
  // Debug: Kiểm tra cookie được set chưa
  console.log('🍪 Cookies after verify:', document.cookie)
  console.log('🔍 Response headers:', response.headers)
  toast.success('Tài khoản đã xác minh thành công! Bây giờ bạn có thể đăng nhập để tận hưởng các dịch vụ của chúng tôi! Chúc một ngày tốt lành!', { theme: 'colored' })
  return response.data
}
export const refreshTokenAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/refresh_token`)
  return response.data
}
export const fetchBoardsAPI = async (searchPath) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/boards${searchPath}`)
  return response.data
}
export const createNewBoardAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/boards`, data)
  toast.success('Tạo bảng thành công')
  return response.data
}
export const updateCardDetailsAPI = async (cardId, updateData) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/cards/${cardId}`, updateData)
  return response.data
}
export const inviteUserToBoardAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/invitations/board`, data)
  toast.success('Đã mời thành công vào bảng thành công!')
  return response.data
}
// Chatbot API
export const sendChatbotMessageAPI = async ({ message, conversationHistory }) => {
  try {
    const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/ai/chatbot`, {
      message,
      conversationHistory
    })
    return response.data
  } catch (error) {
    // Có thể thêm toast thông báo lỗi nếu cần
    toast.error('Gửi tin nhắn thất bại. Vui lòng thử lại sau!', { theme: 'colored' })
    throw error // Re-throw để xử lý tiếp trong Redux
  }
}

export const getChatbotHistoryAPI = async () => {
  try {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/chatbot/history`)
    return response.data
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử chat:', error)
    throw error
  }
}

export const clearChatbotHistoryAPI = async () => {
  try {
    const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/chatbot/history`)
    return response.data
  } catch (error) {
    toast.error('Xóa lịch sử chat thất bại', { theme: 'colored' })
    throw error
  }
}
// Evaluation Criteria
export const createEvaluationCriteriaAPI = async ({ boardId, criteriaList }) => {
  try {
    const response = await authorizedAxiosInstance.post(
      `${API_ROOT}/v1/evaluation`,
      { boardId, criteriaList }
    )
    toast.success('Tạo tiêu chí đánh giá thành công!', { theme: 'colored' })
    return response.data
  } catch (error) {
    toast.error('Tạo tiêu chí đánh giá thất bại!', { theme: 'colored' })
    throw error
  }
}

// Lấy danh sách tiêu chí đánh giá theo boardId
export const getEvaluationCriteriaAPI = async (boardId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/single/criteria?boardId=${boardId}`)
  return response.data
}

// ==================== EVALUATION SUBMISSION APIs ====================

// Lấy danh sách tất cả đánh giá của một board
export const getEvaluationsAPI = async (boardId) => {
  try {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/evaluation/evaluations?boardId=${boardId}`)
    return response.data
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đánh giá:', error)
    throw error
  }
}

// Lấy danh sách đánh giá của một user cụ thể trong board
export const getUserEvaluationsAPI = async (boardId, userId) => {
  try {
    const response = await authorizedAxiosInstance.get(
      `${API_ROOT}/v1/evaluation/user-evaluations?boardId=${boardId}&userId=${userId}`
    )
    return response.data
  } catch (error) {
    console.error('Lỗi khi lấy đánh giá của user:', error)
    throw error
  }
}

// Lấy các đánh giá mà user hiện tại đã thực hiện
export const getMyEvaluationsAPI = async (boardId) => {
  try {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/evaluation/my-evaluations?boardId=${boardId}`)
    return response.data
  } catch (error) {
    console.error('Lỗi khi lấy đánh giá của tôi:', error)
    throw error
  }
}

// Cập nhật đánh giá (nếu cho phép chỉnh sửa)
export const updateEvaluationAPI = async (evaluationId, updateData) => {
  try {
    const response = await authorizedAxiosInstance.put(
      `${API_ROOT}/v1/evaluation/evaluations/${evaluationId}`,
      updateData
    )
    toast.success('Cập nhật đánh giá thành công!', { theme: 'colored' })
    return response.data
  } catch (error) {
    toast.error('Cập nhật đánh giá thất bại!', { theme: 'colored' })
    throw error
  }
}

// Xóa đánh giá (nếu có quyền)
export const deleteEvaluationAPI = async (evaluationId) => {
  try {
    const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/evaluation/evaluations/${evaluationId}`)
    toast.success('Xóa đánh giá thành công!', { theme: 'colored' })
    return response.data
  } catch (error) {
    toast.error('Xóa đánh giá thất bại!', { theme: 'colored' })
    throw error
  }
}

// ==================== EVALUATION STATISTICS APIs ====================

// Lấy thống kê đánh giá của board
export const getEvaluationStatsAPI = async (boardId) => {
  try {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/evaluation/`)
    return response.data
  } catch (error) {
    console.error('Lỗi khi lấy thống kê đánh giá:', error)
    throw error
  }
}
// ==================== SINGLE EVALUATION CRITERIA APIs ====================

/**
 * Tạo một tiêu chí đánh giá đơn lẻ
 * @param {Object} payload - Dữ liệu tiêu chí
 * @param {string} payload.boardId - ID của bảng
 * @param {string} payload.title - Tiêu đề tiêu chí
 * @returns {Promise} Promise trả về tiêu chí đã tạo
 */
export const createSingleEvaluationCriteriaAPI = async ({ boardId, title }) => {
  try {
    const response = await authorizedAxiosInstance.post(
      `${API_ROOT}/v1/single`,
      { boardId, title }
    )
    return response.data
  } catch (error) {
    toast.error('Thêm tiêu chí thất bại!', { theme: 'colored' })
    throw error
  }
}

/**
 * Cập nhật một tiêu chí đánh giá đơn lẻ
 * @param {string} criteriaId - ID của tiêu chí
 * @param {Object} updateData - Dữ liệu cập nhật
 * @param {string} updateData.title - Tiêu đề mới
 * @returns {Promise} Promise trả về tiêu chí đã cập nhật
 */
export const updateSingleEvaluationCriteriaAPI = async (singleCriteriaId, updateData) => {
  try {
    const response = await authorizedAxiosInstance.put(
      `${API_ROOT}/v1/single/${singleCriteriaId}`,
      updateData
    )
    toast.success('Cập nhật tiêu chí thành công!', { theme: 'colored' })
    return response.data
  } catch (error) {
    toast.error('Cập nhật tiêu chí thất bại!', { theme: 'colored' })
    throw error
  }
}

/**
 * Xóa một tiêu chí đánh giá đơn lẻ
 * @param {string} criteriaId - ID của tiêu chí
 * @returns {Promise} Promise trả về kết quả xóa
 */
export const deleteSingleEvaluationCriteriaAPI = async (singleCriteriaId) => {
  try {
    const response = await authorizedAxiosInstance.delete(
      `${API_ROOT}/v1/single/${singleCriteriaId}`
    )
    return response.data
  } catch (error) {
    toast.error('Xóa tiêu chí thất bại!', { theme: 'colored' })
    throw error
  }
}
/**
 * Lấy thông tin một tiêu chí đơn lẻ
 * @param {string} criteriaId - ID của tiêu chí
 * @returns {Promise} Promise trả về thông tin tiêu chí
 */
export const getSingleEvaluationCriteriaAPI = async (criteriaId) => {
  try {
    const response = await authorizedAxiosInstance.get(
      `${API_ROOT}/v1/evaluation/criteria/single/${criteriaId}`
    )
    return response.data
  } catch (error) {
    console.error('Lỗi khi lấy thông tin tiêu chí:', error)
    throw error
  }
}
export const sendExplainAIRequestAPI = async ({ text }) => {
  // Giả sử gọi API tới BE hoặc OpenAI
  const response = await authorizedAxiosInstance.post('/v1/explain', { text })
  return response.data
}
// Spell Check API
export const checkSpellingAPI = async (text, language = 'auto') => {
  try {
    const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/spell-check`, {
      text,
      language
    })
    return response.data
  } catch (error) {
    console.error('Spell check API error:', error)
    throw error
  }
}

// ✅ API function đã sửa
export const fetchAllBoards = async (queryParams = {}) => {
  try {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/boards/admin/all`, {
      params: {
        page: queryParams.page || 1,
        itemsPerPage: queryParams.itemsPerPage || DEFAULT_ITEMS_PER_PAGE,
        ...(queryParams.q && { q: queryParams.q }) // Chỉ thêm q nếu có search query
      }
    })
    return response.data
  } catch (error) {
    console.error('❌ Error in fetchAllBoards:', error)
    throw error
  }
}
// Thêm vào file apis/index.js
export const fetchAllUsers = async (queryParams = {}) => {
  try {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/all`, {
      params: {
        page: queryParams.page || 1,
        limit: queryParams.limit || DEFAULT_ITEMS_PER_PAGE,
        ...(queryParams.search && { search: queryParams.search }) // Chỉ thêm search nếu có
      }
    })
    return response.data
  } catch (error) {
    console.error('❌ Error in fetchAllUsers:', error)
    throw error
  }
}
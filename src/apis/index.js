import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'
import { toast } from 'react-toastify'
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
/** Users */
export const registerUserAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/register`, data)
  toast.success('Tài khoản được tạo thành công! Vui lòng kiểm tra và xác minh tài khoản của bạn trước khi đăng nhập!', { theme: 'colored' })
  return response.data
}

export const verifyUserAPI = async (data) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/verify`, data)
  toast.success('Tài khoản đã xác minh thành công! Bây giờ bạn có thể đăng nhập để tận hưởng các dịch vụ của chúng tôi! Chúc một ngày tốt lành!', { theme: 'colored' })
  return response.data
}

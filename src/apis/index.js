import axios from 'axios'
import { API_ROOT } from '~/utils/constants'


// Board
export const fetchBoardDetailsAPI = async (boardId) => {
  const response = await axios.get(`${API_ROOT}/v1/boards/${boardId}`)
  // Lưu ý: Axios sẽ trả về kết quả về qua property của nó là data
  return response.data
}

// Column
export const createNewColumnAPI = async (newColumnData) => {
  const response = await axios.post(`${API_ROOT}/v1/columns`, newColumnData)
  // Lưu ý: Axios sẽ trả về kết quả về qua property của nó là data
  return response.data
}

// Card
export const createNewCardAPI = async (newCardData) => {
  const response = await axios.post(`${API_ROOT}/v1/cards`, newCardData)
  // Lưu ý: Axios sẽ trả về kết quả về qua property của nó là data
  return response.data
}

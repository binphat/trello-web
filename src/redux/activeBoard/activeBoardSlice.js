import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { API_ROOT } from '~/utils/constants'
import { generatePlaceholderCard } from '~/utils/formatters'
import { isEmpty } from 'lodash'
import { mapOrder } from '~/utils/sorts'
// Khởi tạo giá trị State của một cái Slice (Mảnh) trong Redux
const initialState = {
  currentActiveBoard: null
}

// Các hành động gọi api (bất đồng bộ) và cập nhật dữ liệu vào Redux, dùng Middleware createAsyncThunk đi kèm với extraReducers
// createAsyncThunk
export const fetchBoardDetailsAPI = createAsyncThunk(
  'activeBoard/fetchBoardDetailsAPI',
  async (boardId) => {
    const response = await axios.get(`${API_ROOT}/v1/boards/${boardId}`)
    // Lưu ý: Axios sẽ trả về kết quả về qua property của nó là data
    return response.data
  }
)

// Khởi tạo một cái Slice trong kho lưu trữ - Redux Store
export const activeBoardSlice = createSlice({
  name: 'activeBoard',
  initialState,
  // Nơi xử lý dữ liệu đồng bộ
  reducers: {
    // Lưu ý luôn là ở đây luôn luôn cần cặp ngoặc nhọn cho function trong reducer cho dù
    // code bên trong chỉ có 1 dòng, đây là rule của Redux
    updateCurrentActiveBoard: (state, action) => {
      // action.payload là chuẩn đặt tên nhận dữ liệu vào reducer, ở đây chúng ta gắn nó ra một biến có nghĩa hơn
      const board = action.payload

      // Xử lý dữ liệu nếu cần thiết

      // Update lại dữ liệu của cái currentActiveBoard
      state.currentActiveBoard = board
    }
  },
  // extraReducers: Nơi xử lý dữ liệu bất đồng bộ
  extraReducers: (builder) => {
    builder.addCase(fetchBoardDetailsAPI.fulfilled, (state, action) => {
      // action.payload ở đây chính là cái response.data trả về ở trên
      let board = action.payload
      // Sắp xếp thứ tự các column ở đây trước khi đưa dữ liệu xuống bên dưới các component con
      board.columns = mapOrder(board.columns, board.columnOrderIds, '_id')
      board.columns.forEach(column => {
      // Khi F5 trang web, cần xử lý vấn đề kéo thả vào một column rỗng (37.2)
        if (isEmpty(column.cards)) {
          column.cards = [generatePlaceholderCard(column)]
          column.cardOrderIds = [generatePlaceholderCard(column)._id]
        } else {
          // Sắp xếp thứ tự cards ở đây luôn trước khi đưa dữ liệu xuống dưới các component con
          column.cards = mapOrder(column.cards, column.cardOrderIds, '_id')
        }
      })
      // Update lại dữ liệu của cái currentActiveBoard
      state.currentActiveBoard = board
    })
  }
})
// Actions: Là nơi định nghĩa cho các components bên dưới gọi bằng dispatch() tới nó để cập nhật lại dữ liệu thông qua reducer (chạy đồng bộ)
//
// Để ý ở trên thì không thấy properties actions đâu cả, bởi vì cái actions này đơn giản là được thằng redux tạo tự động theo tên của reducer nhé.
export const { updateCurrentActiveBoard } = activeBoardSlice.actions

// Selectors: Là nơi dành cho các components bên dưới gọi bằng hook useSelector() để lấy dữ liệu từ trong kho redux store ra sử dụng
export const selectCurrentActiveBoard = (state) => {
  return state.activeBoard.currentActiveBoard
}
// Cái file này tên là activeBoardSlice NHƯNG chúng ta sẽ export một thứ tên là Reducer
// export default activeBoardSlice.reducer
export const activeBoardReducer = activeBoardSlice.reducer
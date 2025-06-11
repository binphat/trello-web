import { createSlice } from '@reduxjs/toolkit'
import { callApiUpdateCard } from '~/redux/activeBoard/activeBoardSlice'
import { deleteCardAPI } from '~/apis'
import { createAsyncThunk } from '@reduxjs/toolkit'
// Khởi tạo giá trị của một Slice trong redux
const initialState = {
  currentActiveCard: null,
  isShowModalActiveCard: false
}
// 8. Thêm action deleteCard vào activeCardSlice.js
export const deleteCard = createAsyncThunk(
  'activeCard/deleteCard',
  async (cardId, { dispatch, rejectWithValue }) => {
    try {
      // Gọi API xóa card từ activeBoardSlice
      const result = await dispatch(deleteCardAPI(cardId)).unwrap()
      
      // Đóng modal sau khi xóa thành công
      dispatch(cleaAndHideCurrentActiveCard())
      
      return result
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

// Khởi tạo một slice trong kho lưu trữ - redux store
export const activeCardSlice = createSlice({
  name: 'activeCard',
  initialState,
  // Reducers: Nơi xử lý dữ liệu đồng bộ
  reducers: {
    showModalActiveCard: (state) => {
      state.isShowModalActiveCard = true
    },
    // Lưu ý luôn là ở đây cần cập nhật ngọc cho function trong reducer cho dù code bên trên
    // trông đồng, đây là rule của Redux
    // https://redux-toolkit.js.org/usage/immer-reducers#mutating-and-returning-state
    cleaAndHideCurrentActiveCard: (state) => {
      state.currentActiveCard = null
      state.isShowModalActiveCard = false
    },
    updateCurrentActiveCard: (state, action) => {
      const fullCard = action.payload // action.payload là chuẩn đặt tên nhận dữ liệu vào
      // chúng ta gán nó ra một biến có nghĩa hơn
      // xử lý dữ liệu nếu cần thiết
      // ...
      // Update lại dữ liệu currentActiveCard trong Redux
      state.currentActiveCard = fullCard
    }
  },
  extraReducers: (builder) => {
    builder.addCase(callApiUpdateCard.fulfilled, (state, action) => {
      // Cập nhật luôn activeCard khi API update thành công
      state.currentActiveCard = action.payload
    })
    // 9. Thêm vào extraReducers trong activeCardSlice.js
      .addCase(deleteCard.fulfilled, (state) => {
        // Card đã được xóa, clear active card
        state.currentActiveCard = null
        state.isShowModalActiveCard = false
      })
  }
})

// Action creators are generated for each case reducer function
// Actions: Là nơi dành cho các components bên dưới gọi bằng dispatch() tới nó để
// thông qua reducer (chạy đồng bộ)
// Để ý ở trên thì không thấy properties actions đâu cả, bởi vì những cái actions
// thằng redux tạo tự động theo tên của reducer nhé.
export const {
  cleaAndHideCurrentActiveCard,
  updateCurrentActiveCard,
  showModalActiveCard
} = activeCardSlice.actions

// Selectors: Là nơi dành cho các components bên dưới gọi bằng hook useSelector()
// trong kho redux store ra sử dụng
export const selectCurrentActiveCard = (state) => {
  return state.activeCard.currentActiveCard
}
export const selectIsShowModalActiveCard = (state) => {
  return state.activeCard.isShowModalActiveCard
}
// Cái file này tên là activeCardSlice NHƯNG chúng ta sẽ export một thứ tên là Reducer, mọi người lưu
// ý :D
// export default activeCardSlice.reducer
export const activeCardReducer = activeCardSlice.reducer
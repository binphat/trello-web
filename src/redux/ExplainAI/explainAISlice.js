import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'

const initialState = {
  isLoading: false,
  error: null,
  result: ''
}

// Async thunk để gọi API diễn giải (paraphrase)
export const paraphraseText = createAsyncThunk(
  'explainAI/paraphrase',
  async (content, { rejectWithValue }) => {
    try {
      // Gửi POST request với nội dung cần diễn giải
      const response = await authorizedAxiosInstance.post('http://localhost:8017/v1/explain', { content, language: 'vi' })
      return response.data.result
    } catch (error) {
      // Trả về lỗi tùy chỉnh nếu có
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const explainAISlice = createSlice({
  name: 'explainAI',
  initialState,
  reducers: {
    // Reset lại state khi cần
    clearResult: (state) => {
      state.result = ''
      state.error = null
      state.isLoading = false
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(paraphraseText.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(paraphraseText.fulfilled, (state, action) => {
        state.isLoading = false
        state.result = action.payload
      })
      .addCase(paraphraseText.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export const { clearResult } = explainAISlice.actions

export default explainAISlice.reducer

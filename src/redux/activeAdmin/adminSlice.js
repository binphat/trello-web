// adminSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'

export const fetchAllBoardsAPI = createAsyncThunk(
  'admin/fetchAllBoardsAPI',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/admin/boards`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

const initialState = {
  allBoards: [],
  loading: false,
  error: null
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllBoardsAPI.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllBoardsAPI.fulfilled, (state, action) => {
        state.loading = false
        // Sắp xếp boards theo mức độ hoạt động (số lượng thay đổi gần đây)
        state.allBoards = action.payload.sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        })
      })
      .addCase(fetchAllBoardsAPI.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const adminReducer = adminSlice.reducer
export const selectAllBoards = (state) => state.admin.allBoards
export const selectAdminLoading = (state) => state.admin.loading
export const selectAdminError = (state) => state.admin.error
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'

const initialState = {
  criteriaList: [],
  loading: false,
  error: null,
}

export const fetchCriteria = createAsyncThunk(
  'criteria/fetchCriteria',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/criteria`)
      return response.data // giả sử data là mảng tiêu chí [{ id, label }, ...]
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

const criteriaSlice = createSlice({
  name: 'criteria',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchCriteria.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCriteria.fulfilled, (state, action) => {
        state.loading = false
        state.criteriaList = action.payload
      })
      .addCase(fetchCriteria.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Lỗi khi tải tiêu chí'
      })
  }
})

export const selectCriteria = (state) => state.criteria.criteriaList
export const selectCriteriaLoading = (state) => state.criteria.loading

export const criteriaReducer = criteriaSlice.reducer

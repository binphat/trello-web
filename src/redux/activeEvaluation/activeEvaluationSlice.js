import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'react-toastify'
import {
  createEvaluationCriteriaAPI,
  getEvaluationsAPI,
  createSingleEvaluationCriteriaAPI,
  updateSingleEvaluationCriteriaAPI,
  deleteSingleEvaluationCriteriaAPI,
  getEvaluationCriteriaAPI
} from '~/apis/index'

const initialState = {
  criteriaList: [],
  evaluations: [],
  userEvaluations: [],
  evaluatedUsers: [],
  loading: false,
  submittingEvaluation: false,
  addingSingleCriteria: false,
  updatingSingleCriteria: false,
  deletingSingleCriteria: false,
  error: null
  
}
// Thêm thunk action này vào phần THUNK ACTIONS
export const fetchEvaluationCriteriaThunk = createAsyncThunk(
  'evaluation/fetchEvaluationCriteria',
  async (boardId, thunkAPI) => {
    try {
      const data = await getEvaluationCriteriaAPI(boardId)
      return data
    } catch (error) {
      console.error('Error fetching evaluation criteria:', error)
      // Không hiển thị toast error ở đây để tránh spam
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

// ========== THUNK ACTIONS ========== //

export const createEvaluationCriteria = createAsyncThunk(
  'evaluation/createEvaluationCriteria',
  async ({ boardId, criteriaList }, thunkAPI) => {
    try {
      const data = await createEvaluationCriteriaAPI({ boardId, criteriaList })
      return data
    } catch (error) {
      toast.error('Tạo tiêu chí đánh giá thất bại!', { theme: 'colored' })
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const addSingleEvaluationCriteria = createAsyncThunk(
  'evaluation/addSingleCriteria',
  async ({ boardId, title }, thunkAPI) => {
    try {
      const data = await createSingleEvaluationCriteriaAPI({ boardId, title })
      return data
    } catch (error) {
      toast.error('Thêm tiêu chí thất bại!', { theme: 'colored' })
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const updateSingleEvaluationCriteria = createAsyncThunk(
  'evaluation/updateSingleCriteria',
  async ({ criteriaId, title }, thunkAPI) => {
    try {
      const data = await updateSingleEvaluationCriteriaAPI(criteriaId, { title })
      toast.success('Cập nhật tiêu chí thành công!', { theme: 'colored' })
      return data
    } catch (error) {
      toast.error('Cập nhật tiêu chí thất bại!', { theme: 'colored' })
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const deleteSingleEvaluationCriteria = createAsyncThunk(
  'evaluation/deleteSingleCriteria',
  async (criteriaId, thunkAPI) => {
    try {
      const data = await deleteSingleEvaluationCriteriaAPI(criteriaId)
      return { criteriaId, data }
    } catch (error) {
      toast.error('Xóa tiêu chí thất bại!', { theme: 'colored' })
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

// ✅ Thunk mới: Truyền boardId và currentUserId
export const fetchEvaluationsThunk = createAsyncThunk(
  'evaluation/fetchEvaluations',
  async ({ boardId, currentUserId }, thunkAPI) => {
    try {
      const data = await getEvaluationsAPI(boardId)
      return { evaluations: data, currentUserId }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

// ========== SLICE ========== //

const evaluationSlice = createSlice({
  name: 'evaluation',
  initialState,
  reducers: {
    clearCriteriaList: (state) => {
      state.criteriaList = []
    },
    clearEvaluations: (state) => {
      state.evaluations = []
      state.userEvaluations = []
      state.evaluatedUsers = []
    },
    addEvaluatedUser: (state, action) => {
      const userId = action.payload
      if (!state.evaluatedUsers.includes(userId)) {
        state.evaluatedUsers.push(userId)
      }
    },
    removeEvaluatedUser: (state, action) => {
      state.evaluatedUsers = state.evaluatedUsers.filter(id => id !== action.payload)
    },
    resetEvaluatedUsers: (state) => {
      state.evaluatedUsers = []
    }
  },
  extraReducers: (builder) => {
    builder
      // Create criteria
      .addCase(createEvaluationCriteria.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createEvaluationCriteria.fulfilled, (state, action) => {
        state.loading = false
        state.criteriaList = action.payload
      })
      .addCase(createEvaluationCriteria.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Add single criteria
      .addCase(addSingleEvaluationCriteria.pending, (state) => {
        state.addingSingleCriteria = true
        state.error = null
      })
      .addCase(addSingleEvaluationCriteria.fulfilled, (state, action) => {
        state.addingSingleCriteria = false
        state.criteriaList.push(action.payload)
      })
      .addCase(addSingleEvaluationCriteria.rejected, (state, action) => {
        state.addingSingleCriteria = false
        state.error = action.payload
      })

      // Update single criteria
      .addCase(updateSingleEvaluationCriteria.pending, (state) => {
        state.updatingSingleCriteria = true
        state.error = null
      })
      .addCase(updateSingleEvaluationCriteria.fulfilled, (state, action) => {
        state.updatingSingleCriteria = false
        const updated = action.payload
        const index = state.criteriaList.findIndex(c => c._id === updated._id)
        if (index !== -1) {
          state.criteriaList[index] = updated
        }
      })
      .addCase(updateSingleEvaluationCriteria.rejected, (state, action) => {
        state.updatingSingleCriteria = false
        state.error = action.payload
      })

      // Delete single criteria
      .addCase(deleteSingleEvaluationCriteria.pending, (state) => {
        state.deletingSingleCriteria = true
        state.error = null
      })
      .addCase(deleteSingleEvaluationCriteria.fulfilled, (state, action) => {
        state.deletingSingleCriteria = false
        const { criteriaId } = action.payload
        state.criteriaList = state.criteriaList.filter(c => c._id !== criteriaId)
      })
      .addCase(deleteSingleEvaluationCriteria.rejected, (state, action) => {
        state.deletingSingleCriteria = false
        state.error = action.payload
      })

      // Fetch evaluations
      .addCase(fetchEvaluationsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEvaluationsThunk.fulfilled, (state, action) => {
        state.loading = false
        const { evaluations, currentUserId } = action.payload
        state.evaluations = evaluations
        state.userEvaluations = evaluations.filter(e => e.evaluatorId === currentUserId)
      })
      .addCase(fetchEvaluationsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Thêm case này vào phần extraReducers trong builder
      .addCase(fetchEvaluationCriteriaThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEvaluationCriteriaThunk.fulfilled, (state, action) => {
        state.loading = false
        state.criteriaList = action.payload
      })
      .addCase(fetchEvaluationCriteriaThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

// ========== EXPORTS ========== //

export const {
  clearCriteriaList,
  clearEvaluations,
  addEvaluatedUser,
  removeEvaluatedUser,
  resetEvaluatedUsers
} = evaluationSlice.actions

export const selectEvaluationCriteria = (state) => state.evaluation.criteriaList
export const selectEvaluationLoading = (state) => state.evaluation.loading
export const selectSubmittingEvaluation = (state) => state.evaluation.submittingEvaluation
export const selectAddingSingleCriteria = (state) => state.evaluation.addingSingleCriteria
export const selectUpdatingSingleCriteria = (state) => state.evaluation.updatingSingleCriteria
export const selectDeletingSingleCriteria = (state) => state.evaluation.deletingSingleCriteria
export const selectEvaluationError = (state) => state.evaluation.error
export const selectAllEvaluations = (state) => state.evaluation.evaluations
export const selectUserEvaluations = (state) => state.evaluation.userEvaluations
export const selectEvaluatedUsers = (state) => state.evaluation.evaluatedUsers

export const selectEvaluationsForUser = (userId) => (state) =>
  state.evaluation.evaluations.filter(e => e.evaluatedUserId === userId)

export const selectIsUserEvaluated = (userId) => (state) =>
  state.evaluation.evaluatedUsers.includes(userId)

export const evaluationReducer = evaluationSlice.reducer

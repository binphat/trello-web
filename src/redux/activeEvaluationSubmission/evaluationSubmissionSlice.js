// evaluationSubmissionSlice.js - Sửa lỗi undefined properties
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  submitSingleEvaluationAPI,
  getMyEvaluationsAPI
} from '~/apis/evaluationSubmissionAPI'

const initialState = {
  submissions: [],
  loading: false,
  error: null,
  currentSubmission: null,
  fetchLoading: false
}

export const submitSingleEvaluationThunk = createAsyncThunk(
  'evaluationSubmission/submit',
  async (evaluationData, { rejectWithValue }) => {
    try {
      const response = await submitSingleEvaluationAPI(evaluationData)
      return response
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchMyEvaluationsThunk = createAsyncThunk(
  'evaluationSubmission/fetchMyEvaluations',
  async (boardId, { rejectWithValue }) => {
    try {
      const response = await getMyEvaluationsAPI(boardId)
      return response
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// 🔧 Helper function để lấy ID an toàn
const safeGetId = (obj, field) => {
  if (!obj) return null
  const value = obj[field]
  if (!value) return null
  return typeof value === 'object' ? value.toString() : value.toString()
}

// 🔧 Helper function để kiểm tra submission trùng lặp
const isDuplicateSubmission = (existing, newSubmission) => {
  const existingBoardId = safeGetId(existing, 'board') || safeGetId(existing, 'boardId')
  const existingEvaluatedId = safeGetId(existing, 'evaluatedUser') || safeGetId(existing, 'evaluatedUserId')
  const existingEvaluatorId = safeGetId(existing, 'evaluator') || safeGetId(existing, 'evaluatorId')

  const newBoardId = safeGetId(newSubmission, 'board') || safeGetId(newSubmission, 'boardId')
  const newEvaluatedId = safeGetId(newSubmission, 'evaluatedUser') || safeGetId(newSubmission, 'evaluatedUserId')
  const newEvaluatorId = safeGetId(newSubmission, 'evaluator') || safeGetId(newSubmission, 'evaluatorId')

  return existingBoardId === newBoardId &&
         existingEvaluatedId === newEvaluatedId &&
         existingEvaluatorId === newEvaluatorId
}

const evaluationSubmissionSlice = createSlice({
  name: 'evaluationSubmission',
  initialState,
  reducers: {
    resetSubmissionState: () => initialState,
    addLocalSubmission: (state, action) => {
      // 🔧 Kiểm tra trùng lặp trước khi thêm
      const isDuplicate = state.submissions.some(existing =>
        isDuplicateSubmission(existing, action.payload)
      )

      if (!isDuplicate) {
        state.submissions.push(action.payload)
      }
    },
    setSubmissions: (state, action) => {
      state.submissions = Array.isArray(action.payload) ? action.payload : []
    },
    // 🆕 Thêm action để remove temporary submissions
    removeTempSubmissions: (state) => {
      state.submissions = state.submissions.filter(s =>
        !s._id?.toString().startsWith('temp-')
      )
    }
  },
  extraReducers: (builder) => {
    builder
      // Submit Evaluation
      .addCase(submitSingleEvaluationThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitSingleEvaluationThunk.fulfilled, (state, action) => {
        state.loading = false
        state.currentSubmission = action.payload

        // 🔧 Sửa lỗi: Kiểm tra an toàn trước khi tìm kiếm
        try {
          const existingIndex = state.submissions.findIndex(existing =>
            isDuplicateSubmission(existing, action.payload)
          )

          if (existingIndex === -1) {
            // Không tìm thấy duplicate, thêm mới
            state.submissions.push(action.payload)
          } else {
            // Tìm thấy duplicate, cập nhật
            state.submissions[existingIndex] = action.payload
          }

          // Remove temporary submissions sau khi thành công
          state.submissions = state.submissions.filter(s =>
            !s._id?.toString().startsWith('temp-')
          )

        } catch (error) {
          console.error('Error updating submissions array:', error)
          // Fallback: chỉ thêm vào cuối array
          state.submissions.push(action.payload)
        }
      })
      .addCase(submitSingleEvaluationThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload

        // 🔧 Remove temporary submissions on error (cách an toàn hơn)
        try {
          state.submissions = state.submissions.filter(s =>
            !s._id?.toString().startsWith('temp-')
          )
        } catch (error) {
          console.error('Error removing temp submissions:', error)
          // Fallback: reset submissions array
          state.submissions = []
        }
      })

      // Fetch Evaluations
      .addCase(fetchMyEvaluationsThunk.pending, (state) => {
        state.fetchLoading = true
        state.error = null
      })
      .addCase(fetchMyEvaluationsThunk.fulfilled, (state, action) => {
        state.fetchLoading = false
        // 🔧 Đảm bảo payload là array
        state.submissions = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchMyEvaluationsThunk.rejected, (state, action) => {
        state.fetchLoading = false
        state.error = action.payload
      })
  }
})

export const {
  resetSubmissionState,
  addLocalSubmission,
  setSubmissions,
  removeTempSubmissions
} = evaluationSubmissionSlice.actions

export default evaluationSubmissionSlice.reducer

// Selectors
export const selectSubmissionLoading = (state) => state.evaluationSubmission.loading
export const selectSubmissionError = (state) => state.evaluationSubmission.error
export const selectMySubmissions = (state) => state.evaluationSubmission.submissions || []
export const selectCurrentSubmission = (state) => state.evaluationSubmission.currentSubmission
export const selectFetchLoading = (state) => state.evaluationSubmission.fetchLoading
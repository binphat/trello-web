// myEvaluationResultsSlice.js - Redux slice cho kết quả đánh giá của bản thân
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getMyEvaluationResultsAPI, getAllMyEvaluationResultsAPI } from '~/apis/evaluationSubmissionAPI'

const initialState = {
  myResults: [],
  loading: false,
  error: null,
  // Thêm state cho tất cả board
  allBoardsResults: [],
  allResultsLoading: false,
  allResultsError: null
}

// Thunk gốc cho 1 board
export const fetchMyEvaluationResultsThunk = createAsyncThunk(
  'myEvaluationResults/fetchMyResults',
  async ({ boardId, userId }, { rejectWithValue }) => {
    try {
      const response = await getMyEvaluationResultsAPI(boardId, userId)
      return response
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// 🆕 Thunk mới cho tất cả board
export const fetchAllMyEvaluationResultsThunk = createAsyncThunk(
  'myEvaluationResults/fetchAllMyResults',
  async (userId, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching all evaluation results for user:', userId)
      const response = await getAllMyEvaluationResultsAPI(userId)
      
      // Kiểm tra và xử lý response
      if (!response || !Array.isArray(response)) {
        console.warn('⚠️ Invalid response format:', response)
        return []
      }

      console.log('✅ Successfully fetched all results:', response.length, 'boards')
      return response
    } catch (err) {
      console.error('❌ Error in fetchAllMyEvaluationResultsThunk:', err)
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// 🆕 Thunk để refresh một board cụ thể trong danh sách tất cả board
export const refreshBoardEvaluationResultsThunk = createAsyncThunk(
  'myEvaluationResults/refreshBoardResults',
  async ({ boardId, userId }, { rejectWithValue, getState }) => {
    try {
      console.log('🔄 Refreshing results for board:', boardId)
      
      // Lấy kết quả mới cho board này
      const boardResults = await getMyEvaluationResultsAPI(boardId, userId)
      
      // Lấy state hiện tại
      const currentState = getState().myEvaluationResults.allBoardsResults
      
      // Cập nhật board cụ thể trong danh sách
      const updatedResults = currentState.map(boardData => {
        if (boardData.board?._id === boardId) {
          return {
            ...boardData,
            evaluations: Array.isArray(boardResults) ? boardResults : [],
            lastUpdated: new Date().toISOString()
          }
        }
        return boardData
      })

      return {
        boardId,
        updatedResults
      }
    } catch (err) {
      console.error('❌ Error refreshing board results:', err)
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const myEvaluationResultsSlice = createSlice({
  name: 'myEvaluationResults',
  initialState,
  reducers: {
    resetMyResults: () => initialState,
    clearMyResults: (state) => {
      state.myResults = []
      state.error = null
    },
    // 🆕 Actions cho tất cả board
    clearAllResults: (state) => {
      state.allBoardsResults = []
      state.allResultsError = null
    },
    resetAllResults: (state) => {
      state.allBoardsResults = []
      state.allResultsLoading = false
      state.allResultsError = null
    },
    // 🆕 Action để cập nhật một board cụ thể
    updateBoardInAllResults: (state, action) => {
      const { boardId, newData } = action.payload
      const boardIndex = state.allBoardsResults.findIndex(
        boardData => boardData.board?._id === boardId
      )
      
      if (boardIndex !== -1) {
        state.allBoardsResults[boardIndex] = {
          ...state.allBoardsResults[boardIndex],
          ...newData,
          lastUpdated: new Date().toISOString()
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Cases cho thunk gốc
      .addCase(fetchMyEvaluationResultsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyEvaluationResultsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.myResults = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchMyEvaluationResultsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.myResults = []
      })
      
      // 🆕 Cases cho thunk tất cả board
      .addCase(fetchAllMyEvaluationResultsThunk.pending, (state) => {
        state.allResultsLoading = true
        state.allResultsError = null
      })
      .addCase(fetchAllMyEvaluationResultsThunk.fulfilled, (state, action) => {
        state.allResultsLoading = false
        state.allBoardsResults = Array.isArray(action.payload) ? action.payload : []
        
        // Log để debug
        console.log('📊 Updated allBoardsResults in store:', state.allBoardsResults.length, 'boards')
      })
      .addCase(fetchAllMyEvaluationResultsThunk.rejected, (state, action) => {
        state.allResultsLoading = false
        state.allResultsError = action.payload
        state.allBoardsResults = []
        
        console.error('❌ Failed to fetch all results:', action.payload)
      })
      
      // 🆕 Cases cho refresh board cụ thể
      .addCase(refreshBoardEvaluationResultsThunk.pending, (state) => {
        // Có thể thêm loading indicator cho board cụ thể
        state.allResultsError = null
      })
      .addCase(refreshBoardEvaluationResultsThunk.fulfilled, (state, action) => {
        const { updatedResults } = action.payload
        state.allBoardsResults = updatedResults
        
        console.log('✅ Successfully refreshed board results')
      })
      .addCase(refreshBoardEvaluationResultsThunk.rejected, (state, action) => {
        state.allResultsError = action.payload
        
        console.error('❌ Failed to refresh board results:', action.payload)
      })
  }
})

export const {
  resetMyResults,
  clearMyResults,
  clearAllResults,
  resetAllResults,
  updateBoardInAllResults
} = myEvaluationResultsSlice.actions

export default myEvaluationResultsSlice.reducer

// Selectors gốc
export const selectMyEvaluationResults = (state) => state.myEvaluationResults.myResults || []
export const selectResultsLoading = (state) => state.myEvaluationResults.loading
export const selectResultsError = (state) => state.myEvaluationResults.error

// 🆕 Selectors mới cho tất cả board
export const selectAllMyEvaluationResults = (state) => state.myEvaluationResults.allBoardsResults || []
export const selectAllResultsLoading = (state) => state.myEvaluationResults.allResultsLoading
export const selectAllResultsError = (state) => state.myEvaluationResults.allResultsError

// 🆕 Selector để lấy kết quả của một board cụ thể từ allBoardsResults
export const selectBoardEvaluationResults = (boardId) => (state) => {
  const allResults = state.myEvaluationResults.allBoardsResults || []
  return allResults.find(boardData => boardData.board?._id === boardId) || null
}

// 🆕 Selector để lấy thống kê tổng quan
export const selectEvaluationStatistics = (state) => {
  const allResults = state.myEvaluationResults.allBoardsResults || []
  
  if (allResults.length === 0) {
    return {
      totalBoards: 0,
      totalEvaluations: 0,
      averageScore: 0,
      participatedBoards: []
    }
  }

  let totalEvaluations = 0
  let allScores = []
  const participatedBoards = []

  allResults.forEach(boardData => {
    const { board, evaluations } = boardData
    
    if (evaluations && Array.isArray(evaluations) && evaluations.length > 0) {
      totalEvaluations += evaluations.length
      
      // Tính điểm cho board này
      evaluations.forEach(evaluation => {
        if (evaluation.ratings && Array.isArray(evaluation.ratings)) {
          evaluation.ratings.forEach(rating => {
            if (rating && typeof rating.score === 'number') {
              allScores.push(rating.score)
            }
          })
        }
      })

      participatedBoards.push({
        id: board?._id,
        title: board?.title,
        evaluationCount: evaluations.length,
        createdAt: board?.createdAt
      })
    }
  })

  const averageScore = allScores.length > 0 
    ? Math.round((allScores.reduce((sum, score) => sum + score, 0) / allScores.length) * 10) / 10
    : 0

  return {
    totalBoards: participatedBoards.length,
    totalEvaluations,
    averageScore,
    participatedBoards: participatedBoards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
}

// 🆕 Selector để lấy top skills
export const selectTopSkills = (limit = 5) => (state) => {
  const allResults = state.myEvaluationResults.allBoardsResults || []
  const skillsMap = new Map()

  allResults.forEach(boardData => {
    const { evaluations, criteria } = boardData
    
    if (evaluations && Array.isArray(evaluations) && criteria && Array.isArray(criteria)) {
      evaluations.forEach(evaluation => {
        if (evaluation.ratings && Array.isArray(evaluation.ratings)) {
          evaluation.ratings.forEach(rating => {
            if (rating && typeof rating.score === 'number') {
              const criterion = criteria.find(c => c._id?.toString() === rating.criterion?.toString())
              const skillName = criterion?.title || criterion?.name || 'Unknown'
              
              if (!skillsMap.has(skillName)) {
                skillsMap.set(skillName, { scores: [], total: 0, count: 0 })
              }
              
              const skillData = skillsMap.get(skillName)
              skillData.scores.push(rating.score)
              skillData.total += rating.score
              skillData.count += 1
            }
          })
        }
      })
    }
  })

  const skillsArray = Array.from(skillsMap.entries()).map(([name, data]) => ({
    name,
    average: Math.round((data.total / data.count) * 10) / 10,
    count: data.count,
    scores: data.scores
  }))

  return skillsArray
    .sort((a, b) => b.average - a.average)
    .slice(0, limit)
}
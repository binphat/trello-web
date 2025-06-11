// detailedEvaluationResultsSlice.js - Redux slice cho RatingTab
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  getDetailedEvaluationResultsAPI,
  getBoardDetailedResultsAPI,
  exportEvaluationResultsAPI,
  getEvaluationStatisticsAPI
} from '~/apis/detailedEvaluationResultsAPI'

const initialState = {
  // Dữ liệu chính
  summary: {
    totalBoards: 0,
    totalEvaluations: 0,
    overallAverage: 0,
    topPerformingCriteria: [],
    recentEvaluations: []
  },
  boardResults: [],
  
  // Loading states
  loading: false,
  boardLoading: false,
  exportLoading: false,
  statisticsLoading: false,
  
  // Error states
  error: null,
  boardError: null,
  exportError: null,
  statisticsError: null,
  
  // Thống kê và filters
  statistics: null,
  filters: {
    timeRange: '3months',
    sortBy: 'date',
    sortOrder: 'desc',
    selectedBoards: [],
    selectedCriteria: []
  },
  
  // UI states
  viewMode: 'overview', // 'overview', 'detailed', 'comparison'
  selectedBoard: null,
  selectedEvaluation: null
}

// ===============================================
// ASYNC THUNKS
// ===============================================

// 🆕 Thunk để lấy tất cả kết quả đánh giá chi tiết
export const fetchDetailedEvaluationResultsThunk = createAsyncThunk(
  'detailedEvaluationResults/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching detailed evaluation results...')
      const response = await getDetailedEvaluationResultsAPI()
      
      if (!response) {
        throw new Error('Không có dữ liệu trả về')
      }

      console.log('✅ Successfully fetched detailed results')
      return response
    } catch (err) {
      console.error('❌ Error in fetchDetailedEvaluationResultsThunk:', err)
      return rejectWithValue(err.message || 'Không thể lấy kết quả đánh giá chi tiết')
    }
  }
)

// 🆕 Thunk để lấy kết quả chi tiết của một board
export const fetchBoardDetailedResultsThunk = createAsyncThunk(
  'detailedEvaluationResults/fetchBoardDetails',
  async (boardId, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching board detailed results for:', boardId)
      const response = await getBoardDetailedResultsAPI(boardId)
      
      return {
        boardId,
        data: response
      }
    } catch (err) {
      console.error('❌ Error in fetchBoardDetailedResultsThunk:', err)
      return rejectWithValue({
        boardId,
        error: err.message || 'Không thể lấy kết quả chi tiết của board'
      })
    }
  }
)

// 🆕 Thunk để export kết quả đánh giá
export const exportEvaluationResultsThunk = createAsyncThunk(
  'detailedEvaluationResults/export',
  async ({ boardId = null, format = 'excel' }, { rejectWithValue }) => {
    try {
      console.log('🔄 Exporting evaluation results...', { boardId, format })
      const response = await exportEvaluationResultsAPI(boardId, format)
      
      return {
        boardId,
        format,
        ...response
      }
    } catch (err) {
      console.error('❌ Error in exportEvaluationResultsThunk:', err)
      return rejectWithValue(err.message || 'Không thể export kết quả đánh giá')
    }
  }
)

// 🆕 Thunk để lấy thống kê chi tiết
export const fetchEvaluationStatisticsThunk = createAsyncThunk(
  'detailedEvaluationResults/fetchStatistics',
  async (timeRange = '3months', { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching evaluation statistics...', { timeRange })
      const response = await getEvaluationStatisticsAPI(timeRange)
      
      return response
    } catch (err) {
      console.error('❌ Error in fetchEvaluationStatisticsThunk:', err)
      return rejectWithValue(err.message || 'Không thể lấy thống kê đánh giá')
    }
  }
)

// 🆕 Thunk để refresh dữ liệu
export const refreshDetailedResultsThunk = createAsyncThunk(
  'detailedEvaluationResults/refresh',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      console.log('🔄 Refreshing all detailed results...')
      
      // Refresh cả detailed results và statistics
      const [detailedResults] = await Promise.all([
        dispatch(fetchDetailedEvaluationResultsThunk()).unwrap(),
        dispatch(fetchEvaluationStatisticsThunk()).unwrap()
      ])
      
      console.log('✅ Successfully refreshed all data')
      return detailedResults
    } catch (err) {
      console.error('❌ Error refreshing detailed results:', err)
      return rejectWithValue(err.message || 'Không thể refresh dữ liệu')
    }
  }
)

// ===============================================
// SLICE DEFINITION
// ===============================================

const detailedEvaluationResultsSlice = createSlice({
  name: 'detailedEvaluationResults',
  initialState,
  reducers: {
    // Reset và clear actions
    resetDetailedResults: () => initialState,
    clearDetailedResults: (state) => {
      state.summary = initialState.summary
      state.boardResults = []
      state.statistics = null
      state.error = null
    },
    
    // Filter actions
    setTimeRange: (state, action) => {
      state.filters.timeRange = action.payload
    },
    setSortBy: (state, action) => {
      state.filters.sortBy = action.payload
    },
    setSortOrder: (state, action) => {
      state.filters.sortOrder = action.payload
    },
    setSelectedBoards: (state, action) => {
      state.filters.selectedBoards = action.payload
    },
    setSelectedCriteria: (state, action) => {
      state.filters.selectedCriteria = action.payload
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
    
    // UI state actions
    setViewMode: (state, action) => {
      state.viewMode = action.payload
    },
    setSelectedBoard: (state, action) => {
      state.selectedBoard = action.payload
    },
    setSelectedEvaluation: (state, action) => {
      state.selectedEvaluation = action.payload
    },
    
    // Data manipulation actions
    updateBoardResult: (state, action) => {
      const { boardId, data } = action.payload
      const boardIndex = state.boardResults.findIndex(
        board => board.board._id === boardId
      )
      
      if (boardIndex !== -1) {
        state.boardResults[boardIndex] = {
          ...state.boardResults[boardIndex],
          ...data,
          lastUpdated: new Date().toISOString()
        }
      }
    },
    
    // Error handling actions
    clearError: (state) => {
      state.error = null
    },
    clearBoardError: (state) => {
      state.boardError = null
    },
    clearExportError: (state) => {
      state.exportError = null
    }
  },
  
  extraReducers: (builder) => {
    builder
      // ===============================================
      // Fetch Detailed Results Cases
      // ===============================================
      .addCase(fetchDetailedEvaluationResultsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDetailedEvaluationResultsThunk.fulfilled, (state, action) => {
        state.loading = false
        
        if (action.payload) {
          state.summary = action.payload.summary || initialState.summary
          state.boardResults = action.payload.boardResults || []
        }
        
        console.log('📊 Updated detailed results in store:', {
          summary: state.summary,
          boardCount: state.boardResults.length
        })
      })
      .addCase(fetchDetailedEvaluationResultsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        
        console.error('❌ Failed to fetch detailed results:', action.payload)
      })
      
      // ===============================================
      // Fetch Board Details Cases
      // ===============================================
      .addCase(fetchBoardDetailedResultsThunk.pending, (state) => {
        state.boardLoading = true
        state.boardError = null
      })
      .addCase(fetchBoardDetailedResultsThunk.fulfilled, (state, action) => {
        state.boardLoading = false
        
        const { boardId, data } = action.payload
        
        // Cập nhật board cụ thể trong boardResults
        const boardIndex = state.boardResults.findIndex(
          board => board.board._id === boardId
        )
        
        if (boardIndex !== -1) {
          state.boardResults[boardIndex] = {
            ...state.boardResults[boardIndex],
            ...data,
            lastUpdated: new Date().toISOString()
          }
        }
        
        console.log('✅ Successfully updated board details for:', boardId)
      })
      .addCase(fetchBoardDetailedResultsThunk.rejected, (state, action) => {
        state.boardLoading = false
        state.boardError = action.payload.error
        
        console.error('❌ Failed to fetch board details:', action.payload)
      })
      
      // ===============================================
      // Export Cases
      // ===============================================
      .addCase(exportEvaluationResultsThunk.pending, (state) => {
        state.exportLoading = true
        state.exportError = null
      })
      .addCase(exportEvaluationResultsThunk.fulfilled, (state, action) => {
        state.exportLoading = false
        
        console.log('✅ Successfully exported evaluation results:', action.payload)
      })
      .addCase(exportEvaluationResultsThunk.rejected, (state, action) => {
        state.exportLoading = false
        state.exportError = action.payload
        
        console.error('❌ Failed to export results:', action.payload)
      })
      
      // ===============================================
      // Statistics Cases
      // ===============================================
      .addCase(fetchEvaluationStatisticsThunk.pending, (state) => {
        state.statisticsLoading = true
        state.statisticsError = null
      })
      .addCase(fetchEvaluationStatisticsThunk.fulfilled, (state, action) => {
        state.statisticsLoading = false
        state.statistics = action.payload
        
        console.log('📈 Updated statistics in store')
      })
      .addCase(fetchEvaluationStatisticsThunk.rejected, (state, action) => {
        state.statisticsLoading = false
        state.statisticsError = action.payload
        
        console.error('❌ Failed to fetch statistics:', action.payload)
      })
      
      // ===============================================
      // Refresh Cases
      // ===============================================
      .addCase(refreshDetailedResultsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(refreshDetailedResultsThunk.fulfilled, (state, action) => {
        state.loading = false
        
        if (action.payload) {
          state.summary = action.payload.summary || state.summary
          state.boardResults = action.payload.boardResults || state.boardResults
        }
        
        console.log('🔄 Successfully refreshed detailed results')
      })
      .addCase(refreshDetailedResultsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        
        console.error('❌ Failed to refresh detailed results:', action.payload)
      })
  }
})

// ===============================================
// ACTIONS EXPORT
// ===============================================

export const {
  resetDetailedResults,
  clearDetailedResults,
  setTimeRange,
  setSortBy,
  setSortOrder,
  setSelectedBoards,
  setSelectedCriteria,
  resetFilters,
  setViewMode,
  setSelectedBoard,
  setSelectedEvaluation,
  updateBoardResult,
  clearError,
  clearBoardError,
  clearExportError
} = detailedEvaluationResultsSlice.actions

export default detailedEvaluationResultsSlice.reducer

// ===============================================
// SELECTORS
// ===============================================

// Basic selectors
export const selectDetailedResults = (state) => state.detailedEvaluationResults
export const selectSummary = (state) => state.detailedEvaluationResults.summary
export const selectBoardResults = (state) => state.detailedEvaluationResults.boardResults || []
export const selectStatistics = (state) => state.detailedEvaluationResults.statistics

// Loading selectors
export const selectDetailedLoading = (state) => state.detailedEvaluationResults.loading
export const selectBoardLoading = (state) => state.detailedEvaluationResults.boardLoading
export const selectExportLoading = (state) => state.detailedEvaluationResults.exportLoading
export const selectStatisticsLoading = (state) => state.detailedEvaluationResults.statisticsLoading

// Error selectors
export const selectDetailedError = (state) => state.detailedEvaluationResults.error
export const selectBoardError = (state) => state.detailedEvaluationResults.boardError
export const selectExportError = (state) => state.detailedEvaluationResults.exportError
export const selectStatisticsError = (state) => state.detailedEvaluationResults.statisticsError

// Filter selectors
export const selectFilters = (state) => state.detailedEvaluationResults.filters
export const selectTimeRange = (state) => state.detailedEvaluationResults.filters.timeRange
export const selectSortBy = (state) => state.detailedEvaluationResults.filters.sortBy
export const selectSortOrder = (state) => state.detailedEvaluationResults.filters.sortOrder

// UI selectors
export const selectViewMode = (state) => state.detailedEvaluationResults.viewMode
export const selectSelectedBoard = (state) => state.detailedEvaluationResults.selectedBoard
export const selectSelectedEvaluation = (state) => state.detailedEvaluationResults.selectedEvaluation

// 🆕 Advanced selectors
export const selectFilteredBoardResults = (state) => {
  const results = state.detailedEvaluationResults.boardResults || []
  const filters = state.detailedEvaluationResults.filters
  
  let filtered = [...results]
  
  // Filter by selected boards
  if (filters.selectedBoards && filters.selectedBoards.length > 0) {
    filtered = filtered.filter(board => 
      filters.selectedBoards.includes(board.board._id)
    )
  }
  
  // Sort results
  filtered.sort((a, b) => {
    let aValue, bValue
    
    switch (filters.sortBy) {
      case 'date':
        aValue = new Date(a.board.createdAt)
        bValue = new Date(b.board.createdAt)
        break
      case 'score':
        aValue = a.overallAverage || 0
        bValue = b.overallAverage || 0
        break
      case 'evaluations':
        aValue = a.totalEvaluations || 0
        bValue = b.totalEvaluations || 0
        break
      case 'title':
        aValue = a.board.title?.toLowerCase() || ''
        bValue = b.board.title?.toLowerCase() || ''
        break
      default:
        return 0
    }
    
    const order = filters.sortOrder === 'desc' ? -1 : 1
    
    if (aValue < bValue) return -1 * order
    if (aValue > bValue) return 1 * order
    return 0
  })
  
  return filtered
}

export const selectTopPerformingBoards = (limit = 5) => (state) => {
  const results = state.detailedEvaluationResults.boardResults || []
  
  return results
    .filter(board => board.overallAverage > 0)
    .sort((a, b) => (b.overallAverage || 0) - (a.overallAverage || 0))
    .slice(0, limit)
    .map(board => ({
      id: board.board._id,
      title: board.board.title,
      score: board.overallAverage,
      evaluations: board.totalEvaluations
    }))
}

export const selectBoardById = (boardId) => (state) => {
  const results = state.detailedEvaluationResults.boardResults || []
  return results.find(board => board.board._id === boardId) || null
}

export const selectRecentEvaluations = (limit = 10) => (state) => {
  const summary = state.detailedEvaluationResults.summary
  return summary.recentEvaluations?.slice(0, limit) || []
}
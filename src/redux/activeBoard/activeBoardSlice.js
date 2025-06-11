import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'
import { generatePlaceholderCard } from '~/utils/formatters'
import { isEmpty } from 'lodash'
import { mapOrder } from '~/utils/sorts'

// Template configurations
const BOARD_TEMPLATES = {
  'kanban': {
    title: 'Kanban Board',
    description: 'Basic Kanban workflow',
    columns: [
      {
        title: 'To Do',
        color: '#ff6b6b',
        sampleCards: ['Topic 1', 'Topic 2', 'Topic 3']
      },
      {
        title: 'Doing',
        color: '#4ecdc4',
        sampleCards: ['Topic 1', 'Topic 2', 'Topic 3']
      },
      {
        title: 'Done',
        color: '#45b7d1',
        sampleCards: ['Topic 1', 'Topic 2', 'Topic 3']
      }
    ]
  },
  'big-topic': {
    title: 'Big Topic Board',
    description: 'Organize tasks by themes',
    columns: [
      {
        title: 'Big Topic 1',
        color: '#96ceb4',
        sampleCards: ['Small Topic', 'Small Topic', 'Small Topic']
      },
      {
        title: 'Big Topic 2',
        color: '#ffd93d',
        sampleCards: ['Small Topic', 'Small Topic', 'Small Topic']
      },
      {
        title: 'Big Topic 3',
        color: '#6c5ce7',
        sampleCards: ['Small Topic', 'Small Topic', 'Small Topic']
      },
      {
        title: 'Big Topic 4',
        color: '#fd79a8',
        sampleCards: ['Small Topic', 'Small Topic', 'Small Topic']
      },
      {
        title: 'Big Topic 5',
        color: '#00b894',
        sampleCards: ['Small Topic', 'Small Topic', 'Small Topic']
      }
    ]
  }
}

// Khởi tạo giá trị State của một cái Slice (Mảnh) trong Redux
const initialState = {
  currentActiveBoard: null,
  isCreatingBoard: false,
  createBoardError: null,
  cardFilter: {
    showMyCardsOnly: false,
    currentUserId: null
  }
}

// Helper function để filter cards
const filterCardsForUser = (cards, userId, showMyCardsOnly) => {
  if (!showMyCardsOnly || !userId) {
    return cards
  }

  return cards.filter(card => {
    // Kiểm tra xem user có được assign vào card này không
    // Giả sử card có property memberIds hoặc assignedUsers
    return card.memberIds?.includes(userId) ||
           card.assignedUsers?.some(user => user._id === userId) ||
           card.members?.some(user => user._id === userId)
  })
}
// Thêm async thunk mới để tạo columns và cards trong board hiện tại
export const addColumnsToCurrentBoard = createAsyncThunk(
  'activeBoard/addColumnsToCurrentBoard',
  async ({ columnsData }, { getState, rejectWithValue }) => {
    try {
      const state = getState()
      const currentBoard = state.activeBoard.currentActiveBoard

      if (!currentBoard || !currentBoard._id) {
        throw new Error('Không có board hiện tại để thêm columns')
      }

      const boardId = currentBoard._id
      const createdColumns = []

      // Tạo từng column
      for (const columnTemplate of columnsData) {
        const columnData = {
          boardId: boardId,
          title: columnTemplate.title
        }

        const columnResponse = await authorizedAxiosInstance.post(`${API_ROOT}/v1/columns`, columnData)
        const newColumn = columnResponse.data

        // Tạo cards cho column
        const createdCards = []
        const cardOrderIds = []

        if (columnTemplate.cards && columnTemplate.cards.length > 0) {
          for (const cardTitle of columnTemplate.cards) {
            const cardData = {
              boardId: boardId,
              columnId: newColumn._id,
              title: cardTitle
            }

            try {
              const cardResponse = await authorizedAxiosInstance.post(`${API_ROOT}/v1/cards`, cardData)
              const newCard = cardResponse.data
              createdCards.push(newCard)
              cardOrderIds.push(newCard._id)
            } catch (cardError) {
              console.warn(`Failed to create card "${cardTitle}":`, cardError)
            }
          }
        }

        // Nếu không có card nào, tạo placeholder card
        if (createdCards.length === 0) {
          const placeholderCard = generatePlaceholderCard(newColumn)
          createdCards.push(placeholderCard)
          cardOrderIds.push(placeholderCard._id)
        }

        // Cập nhật column với cardOrderIds
        if (cardOrderIds.length > 0) {
          try {
            await authorizedAxiosInstance.put(`${API_ROOT}/v1/columns/${newColumn._id}`, {
              cardOrderIds
            })
          } catch (updateError) {
            console.warn(`Failed to update column ${newColumn._id} with cardOrderIds:`, updateError)
          }
        }

        newColumn.cards = createdCards
        newColumn.cardOrderIds = cardOrderIds
        createdColumns.push(newColumn)
      }

      // Cập nhật board với columnOrderIds mới
      const currentColumnOrderIds = currentBoard.columnOrderIds || []
      const newColumnOrderIds = [...currentColumnOrderIds, ...createdColumns.map(col => col._id)]

      await authorizedAxiosInstance.put(`${API_ROOT}/v1/boards/${boardId}`, {
        columnOrderIds: newColumnOrderIds
      })

      return {
        boardId,
        newColumns: createdColumns,
        newColumnOrderIds
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)
// Các hành động gọi api (bất đồng bộ) và cập nhật dữ liệu vào Redux, dùng Middleware createAsyncThunk đi kèm với extraReducers
// 6. Thêm async thunk vào activeBoardSlice.js
export const deleteCardAPI = createAsyncThunk(
  'activeBoard/deleteCardAPI',
  async (cardId, { rejectWithValue }) => {
    try {
      const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/cards/${cardId}`)
      return { cardId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)
export const fetchBoardDetailsAPI = createAsyncThunk(
  'activeBoard/fetchBoardDetailsAPI',
  async (boardId) => {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/boards/${boardId}`)
    return response.data
  }
)

// Async thunk: cập nhật card (labelColor)
export const callApiUpdateCard = createAsyncThunk(
  'activeBoard/callApiUpdateCard',
  async ({ cardId, labelColor }, { rejectWithValue }) => {
    try {
      const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/cards/${cardId}`, {
        labelColor
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Async thunk: tạo board từ template
export const createBoardFromTemplate = createAsyncThunk(
  'activeBoard/createBoardFromTemplate',
  async ({ templateType, customTitle }, { rejectWithValue }) => {
    try {
      const template = BOARD_TEMPLATES[templateType]
      if (!template) {
        throw new Error('Template not found')
      }

      // Tạo board mới
      const boardData = {
        title: customTitle || template.title,
        description: template.description,
        type: 'public' // hoặc 'private' tùy theo yêu cầu
      }

      const boardResponse = await authorizedAxiosInstance.post(`${API_ROOT}/v1/boards`, boardData)
      const newBoard = boardResponse.data

      // Tạo các columns theo template
      const createdColumns = []
      for (const columnTemplate of template.columns) {
        const columnData = {
          boardId: newBoard._id,
          title: columnTemplate.title
        }

        const columnResponse = await authorizedAxiosInstance.post(`${API_ROOT}/v1/columns`, columnData)
        const newColumn = columnResponse.data

        // Tạo sample cards cho column
        const createdCards = []
        const cardOrderIds = []

        if (columnTemplate.sampleCards && columnTemplate.sampleCards.length > 0) {
          for (const cardTitle of columnTemplate.sampleCards) {
            const cardData = {
              boardId: newBoard._id,
              columnId: newColumn._id,
              title: cardTitle
            }

            try {
              const cardResponse = await authorizedAxiosInstance.post(`${API_ROOT}/v1/cards`, cardData)
              const newCard = cardResponse.data
              createdCards.push(newCard)
              cardOrderIds.push(newCard._id)
            } catch (cardError) {
              console.warn(`Failed to create card "${cardTitle}":`, cardError)
              // Nếu tạo card thất bại, vẫn tiếp tục với các card khác
            }
          }
        }

        // Nếu không có card nào được tạo hoặc không có sample cards, thêm placeholder card
        if (createdCards.length === 0) {
          const placeholderCard = generatePlaceholderCard(newColumn)
          createdCards.push(placeholderCard)
          cardOrderIds.push(placeholderCard._id)
        }

        // Cập nhật column với cardOrderIds
        if (cardOrderIds.length > 0) {
          try {
            await authorizedAxiosInstance.put(`${API_ROOT}/v1/columns/${newColumn._id}`, {
              cardOrderIds
            })
          } catch (updateError) {
            console.warn(`Failed to update column ${newColumn._id} with cardOrderIds:`, updateError)
          }
        }

        newColumn.cards = createdCards
        newColumn.cardOrderIds = cardOrderIds

        createdColumns.push(newColumn)
      }

      // Cập nhật board với columnOrderIds
      const columnOrderIds = createdColumns.map(col => col._id)
      await authorizedAxiosInstance.put(`${API_ROOT}/v1/boards/${newBoard._id}`, {
        columnOrderIds
      })

      // Trả về board hoàn chỉnh
      const completeBoard = {
        ...newBoard,
        columns: createdColumns,
        columnOrderIds,
        owners: newBoard.owners || [],
        members: newBoard.members || [],
        FE_allUsers: (newBoard.owners || []).concat(newBoard.members || []),
        memberIds: (newBoard.owners || []).concat(newBoard.members || []).map(user => user._id)
      }

      return completeBoard
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Khởi tạo một cái Slice trong kho lưu trữ - Redux Store
export const activeBoardSlice = createSlice({
  name: 'activeBoard',
  initialState,
  // Nơi xử lý dữ liệu đồng bộ
  reducers: {
    updateCurrentActiveBoard: (state, action) => {
      const board = action.payload
      state.currentActiveBoard = board
    },
    updateCardInBoard: (state, action) => {
      const incomingCard = action.payload
      // Tìm dần từ board -> column -> card
      const column = state.currentActiveBoard.columns.find(i => i._id === incomingCard.columnId)
      if (column) {
        const card = column.cards.find(i => i._id === incomingCard._id)
        if (card) {
          Object.keys(incomingCard).forEach(key => {
            card[key] = incomingCard[key]
          })
        }
      }
    },
    clearCreateBoardError: (state) => {
      state.createBoardError = null
    },
    // Thêm reducer để cập nhật card filter
    updateCardFilter: (state, action) => {
      state.cardFilter = action.payload
    },
    // Reducer để áp dụng filter lên board hiện tại
    applyCardFilter: (state) => {
      if (!state.currentActiveBoard || !state.cardFilter.showMyCardsOnly) {
        return
      }

      const { currentUserId, showMyCardsOnly } = state.cardFilter

      // Áp dụng filter cho từng column
      state.currentActiveBoard.columns.forEach(column => {
        // Lưu trữ cards gốc nếu chưa có
        if (!column.originalCards) {
          column.originalCards = [...column.cards]
          column.originalCardOrderIds = [...column.cardOrderIds]
        }

        // Filter cards
        const filteredCards = filterCardsForUser(column.originalCards, currentUserId, showMyCardsOnly)
        column.cards = filteredCards
        column.cardOrderIds = filteredCards.map(card => card._id)

        // Nếu không có card nào sau khi filter, thêm placeholder
        if (filteredCards.length === 0) {
          const placeholderCard = generatePlaceholderCard(column)
          column.cards = [placeholderCard]
          column.cardOrderIds = [placeholderCard._id]
        }
      })
    },
    // Thêm reducer mới để cập nhật board hiện tại với columns mới
    addColumnsToCurrentBoardSuccess: (state, action) => {
      const { newColumns, newColumnOrderIds } = action.payload
      if (state.currentActiveBoard) {
        // Thêm columns mới vào board hiện tại
        state.currentActiveBoard.columns = [...state.currentActiveBoard.columns, ...newColumns]
        state.currentActiveBoard.columnOrderIds = newColumnOrderIds
      }
    },
    // Reducer để clear filter
    clearCardFilter: (state) => {
      state.cardFilter = {
        showMyCardsOnly: false,
        currentUserId: null
      }

      if (state.currentActiveBoard) {
        // Khôi phục cards gốc
        state.currentActiveBoard.columns.forEach(column => {
          if (column.originalCards) {
            column.cards = [...column.originalCards]
            column.cardOrderIds = [...column.originalCardOrderIds]
            // Xóa reference để tiết kiệm memory
            delete column.originalCards
            delete column.originalCardOrderIds
          }
        })
      }
    }
  },

  // extraReducers: Nơi xử lý dữ liệu bất đồng bộ
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoardDetailsAPI.fulfilled, (state, action) => {
        let board = action.payload

        // Thành viên của Board sẽ là gộp lại của 2 mảng owners và members
        board.FE_allUsers = board.owners.concat(board.members)
        board.memberIds = board.FE_allUsers.map(user => user._id)

        // Sắp xếp thứ tự các column ở đây trước khi đưa dữ liệu xuống bên dưới các component con
        board.columns = mapOrder(board.columns, board.columnOrderIds, '_id')
        board.columns.forEach(column => {
          // Khi F5 trang web, cần xử lý vấn đề kéo thả vào một column rỗng
          if (isEmpty(column.cards)) {
            column.cards = [generatePlaceholderCard(column)]
            column.cardOrderIds = [generatePlaceholderCard(column)._id]
          } else {
            // Sắp xếp thứ tự cards ở đây luôn trước khi đưa dữ liệu xuống dưới các component con
            column.cards = mapOrder(column.cards, column.cardOrderIds, '_id')
          }
        })

        state.currentActiveBoard = board

        // Clear filter khi load board mới
        state.cardFilter = {
          showMyCardsOnly: false,
          currentUserId: null
        }
      })
      .addCase(createBoardFromTemplate.pending, (state) => {
        state.isCreatingBoard = true
        state.createBoardError = null
      })
      .addCase(createBoardFromTemplate.fulfilled, (state, action) => {
        state.isCreatingBoard = false
        state.currentActiveBoard = action.payload
        state.createBoardError = null
      })
      .addCase(createBoardFromTemplate.rejected, (state, action) => {
        state.isCreatingBoard = false
        state.createBoardError = action.payload
      })
            // Thêm cases mới cho addColumnsToCurrentBoard
            .addCase(addColumnsToCurrentBoard.pending, (state) => {
              state.isCreatingBoard = true
              state.createBoardError = null
            })
            .addCase(addColumnsToCurrentBoard.fulfilled, (state, action) => {
              state.isCreatingBoard = false
              const { newColumns, newColumnOrderIds } = action.payload
              if (state.currentActiveBoard) {
                // Thêm columns mới vào board hiện tại
                state.currentActiveBoard.columns = [...state.currentActiveBoard.columns, ...newColumns]
                state.currentActiveBoard.columnOrderIds = newColumnOrderIds
              }
            })
            .addCase(addColumnsToCurrentBoard.rejected, (state, action) => {
              state.isCreatingBoard = false
              state.createBoardError = action.payload
            })
      // 7. Thêm vào extraReducers trong activeBoardSlice.js
      .addCase(deleteCardAPI.fulfilled, (state, action) => {
        const deletedCardId = action.payload.cardId

        // Tìm và xóa card khỏi column tương ứng
        state.currentActiveBoard.columns.forEach(column => {
          // Xóa card khỏi mảng cards
          column.cards = column.cards.filter(card => card._id !== deletedCardId)

          // Xóa cardId khỏi mảng cardOrderIds
          column.cardOrderIds = column.cardOrderIds.filter(cardId => cardId !== deletedCardId)

          // Nếu column trống sau khi xóa, thêm placeholder card
          if (column.cards.length === 0) {
            const placeholderCard = generatePlaceholderCard(column)
            column.cards = [placeholderCard]
            column.cardOrderIds = [placeholderCard._id]
          }
        })
      })
  }
})

// Actions
export const {
  updateCurrentActiveBoard,
  updateCardInBoard,
  clearCreateBoardError,
  updateCardFilter,
  applyCardFilter,
  clearCardFilter
} = activeBoardSlice.actions

// Selectors
export const selectCurrentActiveBoard = (state) => {
  return state.activeBoard.currentActiveBoard
}

export const selectIsCreatingBoard = (state) => {
  return state.activeBoard.isCreatingBoard
}

export const selectCreateBoardError = (state) => {
  return state.activeBoard.createBoardError
}

export const selectCardFilter = (state) => {
  return state.activeBoard.cardFilter
}

// Export reducer
export const activeBoardReducer = activeBoardSlice.reducer

// Export template configurations for use in components
export { BOARD_TEMPLATES }
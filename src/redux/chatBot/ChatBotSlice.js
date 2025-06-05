import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { sendChatbotMessageAPI } from '~/apis'

const initialState = {
  isOpen: false,
  messages: [],
  isLoading: false,
  error: null,
  lastActive: null
}

export const sendMessageToGemini = createAsyncThunk(
  'chatbot/sendMessage',
  async ({ message }, { getState, rejectWithValue }) => {
    try {
      const state = getState().chatbot
      const conversationHistory = state.messages.map(msg => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.text
      }))

      const response = await sendChatbotMessageAPI({
        message,
        conversationHistory
      })

      return response
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || error.message,
        code: error.response?.status
      })
    }
  }
)

const chatBotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    toggleChatbot: (state) => {
      state.isOpen = !state.isOpen
      if (state.isOpen) state.lastActive = new Date().toISOString()
    },
    addUserMessage: (state, action) => {
      state.messages.push({
        id: Date.now(), // Thêm id duy nhất
        text: action.payload,
        isBot: false,
        timestamp: new Date().toISOString()
      })
    },
    clearChat: (state) => {
      state.messages = []
      state.error = null
    },
    closeChatbot: (state) => {
      state.isOpen = false
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessageToGemini.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(sendMessageToGemini.fulfilled, (state, action) => {
        state.isLoading = false
        state.messages.push({
          id: Date.now(), // Thêm id duy nhất
          text: action.payload.response,
          isBot: true,
          timestamp: new Date().toISOString()
        })
        state.lastActive = new Date().toISOString()
      })
      .addCase(sendMessageToGemini.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload.message

        if (state.isOpen) {
          state.messages.push({
            id: Date.now(), // Thêm id duy nhất
            text: action.payload.code === 429
              ? 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.'
              : 'Xin lỗi, tôi không thể trả lời ngay lúc này. Vui lòng thử lại sau.',
            isBot: true,
            timestamp: new Date().toISOString()
          })
        }
      })
  }
})

// Selectors
export const selectChatbotState = (state) => state.chatbot
export const selectChatMessages = (state) => state.chatbot.messages
export const selectIsChatLoading = (state) => state.chatbot.isLoading

export const {
  toggleChatbot,
  addUserMessage,
  clearChat,
  closeChatbot
} = chatBotSlice.actions

export default chatBotSlice.reducer
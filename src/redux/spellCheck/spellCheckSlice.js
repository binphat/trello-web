// ~/redux/spellCheck/spellCheckSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'

const initialState = {
  isLoading: false,
  error: null,
  suggestion: '',
  originalText: '',
  hasSuggestion: false,
  detectedLanguage: null
}

// Helper function để detect ngôn ngữ cải thiện
const detectLanguage = (text) => {
  // Regex để check tiếng Việt (có dấu)
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/
  
  // Danh sách từ tiếng Việt phổ biến (không dấu)
  const vietnameseWords = [
    'roi', 'biet', 'duoc', 'khong', 'chua', 'nha', 'thi', 'vay', 
    'ma', 'hay', 'nao', 'sao', 'gi', 'dau', 'day', 'kia', 'nay',
    'xin', 'cam', 'on', 'chao', 'tam', 'biet', 'hen', 'gap', 'lai',
    'chuc', 'ngu', 'ngon', 'buoi', 'sang', 'chieu', 'toi', 'oi',
    'va', 'la', 'co', 'de', 'di', 'den', 'tu', 'cho', 'cua', 'mot',
    'hai', 'ba', 'nam', 'sau', 'bay', 'tam', 'chin', 'muoi'
  ]
  
  // Nếu có dấu tiếng Việt thì chắc chắn là tiếng Việt
  if (vietnameseRegex.test(text)) {
    return 'vi'
  }
  
  // Check từ tiếng Việt không dấu
  const words = text.toLowerCase().split(/\s+/)
  const cleanWords = words.map(word => word.replace(/[.,!?;:"'()]/g, ''))
  
  const vietnameseWordCount = cleanWords.filter(word => 
    vietnameseWords.includes(word.toLowerCase())
  ).length
  
  // Nếu có ít nhất 1 từ tiếng Việt trong text ngắn (dưới 5 từ)
  // hoặc tỷ lệ từ tiếng Việt >= 20% trong text dài hơn
  if (vietnameseWordCount > 0) {
    if (words.length <= 5 || (vietnameseWordCount / words.length) >= 0.2) {
      return 'vi'
    }
  }
  
  return 'en'
}

// Helper function để clean corrected text
const cleanCorrectedText = (text) => {
  if (!text) return ''
  
  // Remove extra quotes at beginning and end
  let cleaned = text.trim()
  
  // Remove quotes if they wrap the entire string
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1)
  }
  
  // Handle escaped quotes
  cleaned = cleaned.replace(/\\"/g, '"')
  
  return cleaned.trim()
}

// Async thunk để gọi API spell check với cả 2 ngôn ngữ
export const checkSpelling = createAsyncThunk(
  'spellCheck/checkSpelling',
  async (text, { rejectWithValue }) => {
    try {
      const trimmedText = text.trim()
      if (!trimmedText) {
        return {
          originalText: text,
          suggestion: '',
          hasSuggestion: false,
          detectedLanguage: null
        }
      }

      // Detect ngôn ngữ cải thiện
      const detectedLanguage = detectLanguage(trimmedText)
      console.log('🔍 Detected language:', detectedLanguage, 'for text:', trimmedText)
      
      // Gửi request với detected language trước
      const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/spell-check`, { 
        text: trimmedText,
        language: detectedLanguage
      })

      console.log('📡 First API response:', response.data)

      // Extract data from response - API trả về nested trong data.data
      let { correctedText, hasChanges, detectedLanguage: apiDetectedLanguage } = response.data.data || response.data

      // Nếu không có changes và detected language là English, thử với Vietnamese
      if (!hasChanges && detectedLanguage === 'en') {
        console.log('🔄 No changes with English, trying Vietnamese...')
        try {
          const viResponse = await authorizedAxiosInstance.post(`${API_ROOT}/v1/spell-check`, { 
            text: trimmedText,
            language: 'vi'
          })
          
          console.log('📡 Vietnamese API response:', viResponse.data)
          const viData = viResponse.data.data || viResponse.data
          if (viData.hasChanges) {
            correctedText = viData.correctedText
            hasChanges = viData.hasChanges
            apiDetectedLanguage = viData.detectedLanguage || 'vi'
            console.log('✅ Using Vietnamese correction:', correctedText)
          }
        } catch (viError) {
          // Nếu lỗi thì dùng kết quả ban đầu
          console.warn('Vietnamese spell check failed:', viError)
        }
      }

      // Clean the corrected text
      const cleanedSuggestion = cleanCorrectedText(correctedText)
      console.log('🧹 Cleaned suggestion:', cleanedSuggestion)
      
      // Use API's hasChanges flag and also verify the cleaned text is different
      const hasSuggestion = hasChanges && 
                          cleanedSuggestion && 
                          cleanedSuggestion.toLowerCase() !== trimmedText.toLowerCase()
      
      console.log('🎯 Final result:', {
        originalText: trimmedText,
        suggestion: cleanedSuggestion,
        hasSuggestion,
        hasChanges,
        detectedLanguage: apiDetectedLanguage || detectedLanguage
      })

      return {
        originalText: trimmedText,
        suggestion: hasSuggestion ? cleanedSuggestion : '',
        hasSuggestion,
        detectedLanguage: apiDetectedLanguage || detectedLanguage
      }
    } catch (error) {
      console.error('❌ Spell check error:', error)
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const spellCheckSlice = createSlice({
  name: 'spellCheck',
  initialState,
  reducers: {
    // Clear spell check results
    clearSpellCheck: (state) => {
      state.suggestion = ''
      state.originalText = ''
      state.error = null
      state.isLoading = false
      state.hasSuggestion = false
      state.detectedLanguage = null
    },
    // Dismiss current suggestion
    dismissSuggestion: (state) => {
      state.suggestion = ''
      state.hasSuggestion = false
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkSpelling.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.hasSuggestion = false
        state.suggestion = ''
      })
      .addCase(checkSpelling.fulfilled, (state, action) => {
        state.isLoading = false
        state.originalText = action.payload.originalText
        state.suggestion = action.payload.suggestion
        state.hasSuggestion = action.payload.hasSuggestion
        state.detectedLanguage = action.payload.detectedLanguage
        
        console.log('🎉 Redux state updated:', {
          originalText: state.originalText,
          suggestion: state.suggestion,
          hasSuggestion: state.hasSuggestion,
          detectedLanguage: state.detectedLanguage
        })
      })
      .addCase(checkSpelling.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.hasSuggestion = false
        state.suggestion = ''
      })
  }
})

export const { clearSpellCheck, dismissSuggestion } = spellCheckSlice.actions

// Selectors
export const selectSpellCheckLoading = (state) => state.spellCheck.isLoading
export const selectSpellCheckError = (state) => state.spellCheck.error
export const selectSpellCheckSuggestion = (state) => state.spellCheck.suggestion
export const selectSpellCheckOriginalText = (state) => state.spellCheck.originalText
export const selectHasSpellCheckSuggestion = (state) => state.spellCheck.hasSuggestion
export const selectDetectedLanguage = (state) => state.spellCheck.detectedLanguage

export default spellCheckSlice.reducer
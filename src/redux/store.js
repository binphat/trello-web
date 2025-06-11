import { configureStore } from '@reduxjs/toolkit'
import { activeBoardReducer } from './activeBoard/activeBoardSlice'
import { userReducer } from '~/redux/User/userSlice'
import { activeCardReducer } from './activeCard/activeCardSlice'
import { notificationsReducer } from './notifications/notificationsSlice'
import chatBotReducer from '~/redux/chatBot/ChatBotSlice'
import { evaluationReducer } from '~/redux/activeEvaluation/activeEvaluationSlice' // hoặc đúng path của file bạn lưu slice

import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import explainAIReducer from '~/redux/ExplainAI/explainAISlice'
import spellCheckReducer from '~/redux/spellCheck/spellCheckSlice' // 👈 Import spellCheck reducer
import evaluationSubmissionReducer from '~/redux/activeEvaluationSubmission/evaluationSubmissionSlice'
import myEvaluationResultsSlice from '~/redux/activeEvaluationSubmission/myEvaluationResultsSlice' // 👈 Thêm import mới
import detailedEvaluationResultsReducer from '~/redux/activeEvaluationSubmission/detailedEvaluationResultsSlice'
const rootPersistConfig = {
  key: 'root',
  storage,
  whitelist: ['user']
}

const reducers = combineReducers({
  activeBoard: activeBoardReducer,
  user: userReducer,
  activeCard: activeCardReducer,
  notifications: notificationsReducer,
  evaluation: evaluationReducer, // 👈 dùng đúng key tên slice là "evaluation"
  chatbot: chatBotReducer,
  explainAI: explainAIReducer,
  evaluationSubmission: evaluationSubmissionReducer,
  spellCheck: spellCheckReducer,// 👈 Thêm spellCheck reducer
  myEvaluationResults: myEvaluationResultsSlice, // 👈 Thêm reducer mới
  detailedEvaluationResults: detailedEvaluationResultsReducer
})

const persistedReducers = persistReducer(rootPersistConfig, reducers)

export const store = configureStore({
  reducer: persistedReducers,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

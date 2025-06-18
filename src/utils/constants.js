let apiRoot = ''
if (process.env.BUILD_MODE === 'dev') {
  apiRoot ='http://localhost:8017'
  console.log('⚡ Running in development mode')
}
if (process.env.BUILD_MODE === 'production') {
  apiRoot = 'https://teamup-api-f9jt.onrender.com'
  console.log('🚀 Running in production mode')  
}
// Kiểm tra URL trước khi export
if (!apiRoot) {
  console.error('❌ API_ROOT is not defined! Check your environment variables')
  throw new Error('API_ROOT is not configured')
}
export const API_ROOT = apiRoot


export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12
export const CARD_MEMBER_ACTIONS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE'
}


let apiRoot = ''
if (process.env.BUILD_MODE === 'dev') {
  apiRoot ='http://localhost:8017'
}
if (process.env.BUILD_MODE === 'production') {
  apiRoot = 'https://teamup-api-f9jt.onrender.com'
}
export const API_ROOT = apiRoot


export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12
export const CARD_MEMBER_ACTIONS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE'
}
export const criteria = [
  { id: 'teamwork', label: 'Khả năng làm việc nhóm' },
  { id: 'creativity', label: 'Tư duy sáng tạo' },
  { id: 'responsibility', label: 'Tinh thần trách nhiệm' },
  { id: 'communication', label: 'Kỹ năng giao tiếp' }
]

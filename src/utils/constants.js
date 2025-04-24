let apiRoot = ''
if (process.env.BUILD_MODE === 'dev') {
  apiRoot ='http://localhost:8017'
}
if (process.env.BUILD_MODE === 'production') {
  apiRoot = 'https://teamup-api-f9jt.onrender.com'
}
export const API_ROOT = apiRoot
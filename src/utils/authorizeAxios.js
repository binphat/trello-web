import axios from 'axios'
import { toast } from 'react-toastify'
import { interceptorLoadingElements } from './formatters'
import { refreshTokenAPI } from '~/apis'
import { logoutUserAPI } from '~/redux/User/userSlice'
/**
 * Giải thích:
 * Thông thường, chúng ta không import trực tiếp { store } từ '~redux/store' ở đây.
 * Giải pháp: Inject store. Đây là kỹ thuật cần thiết khi muốn sử dụng biến Redux store ở các file bên ngoài phạm vi component,
 * ví dụ như file `authorizeAxios` hiện tại.
 * Hiểu đơn giản: Khi ứng dụng vừa khởi chạy, code sẽ bắt đầu chạy từ file `main.jsx`. Từ bên đó, chúng ta gọi
 * hàm `injectStore` ngay lập tức để gán `mainStore` vào biến `axiosReduxStore` cục bộ trong file này.
 * Tham khảo thêm: https://redux.js.org/faq/code-structure#how-can-i-use-the-redux-store-in-non-component-files
 */

let axiosReduxStore

export const injectStore = (mainStore) => {
  axiosReduxStore = mainStore
}
// Khởi tạo một đối tượng Axios (authorizedAxiosInstance) mục đích để custom và cấu hình chung cho dự án.
let authorizedAxiosInstance = axios.create()
// Thời gian chờ tối đa của 1 request: để 10 phút
authorizedAxiosInstance.defaults.timeout = 1000 * 60 * 10
// withCredentials: Sẽ cho phép axios tự động gửi cookie trong mỗi request lên BE
//  (phục vụ việc chúng ta sẽ lưu JWT tokens (refresh & access) vào trong httpOnly Cookie của trình duyệt)
authorizedAxiosInstance.defaults.withCredentials = true
/*
 * Cấu hình Interceptors (Bộ đánh chặn vào giữa mọi Request & Response)
 * https://axios-http.com/docs/interceptors
 */
// authorizeAxios.js - Sửa lại interceptor request
authorizedAxiosInstance.interceptors.request.use((config) => {
  // 🔧 Lấy token từ Redux store thay vì cookie
  const state = axiosReduxStore.getState()
  const token = state.user.currentUser?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('🔑 Added token to request:', token.substring(0, 20) + '...')
  } else {
    console.log('⚠️ No token found in Redux store')
  }

  // Debug info
  console.log('🚀 Making request to:', config.url)
  console.log('🔍 Request headers:', config.headers)

  interceptorLoadingElements(true)
  return config
}, (error) => {
  return Promise.reject(error)
})
let refreshTokenPromise = null
// Interceptor request: Can thiệt vào giữa những cái request API
authorizedAxiosInstance.interceptors.request.use((config) => {
  // Kỹ thuật chặn spam click
  interceptorLoadingElements(true)

  return config
}, (error) => {
// Do something with request error
  return Promise.reject(error)
})
// Khởi tạo một promise cho việc gọi API refresh token
// Mục đích tạo Promise này để khi nào gọi API refresh_token xong xuôi thì mới retry lại nhiều API bị lỗi trước đó.
// https://www.thedutchlab.com/en/insights/using-axios-interceptors-for-refreshing-your-api-token

// Interceptor request: Can thiệt vào giữa những cái respone API
authorizedAxiosInstance.interceptors.response.use( (response) => {
  // Kỹ thuật chặn spam click
  interceptorLoadingElements(false)
  return response
}, (error) => {
  // Bất kỳ mã trạng thái nào nằm ngoài phạm vi 2xx sẽ khiến hàm này kích hoạt
  // Làm gì đó với lỗi phản hồi
  // Mọi mã http status code nằm ngoài khoảng 200 -> 299 sẽ là error và rơi vào đây

  // Kỹ thuật chặn spam click
  interceptorLoadingElements(false)
  // Trường hợp 1: Nếu nhận được mã lỗi 401 từ Backend (BE), thì thực hiện gọi API đăng xuất ngay lập tức.
  if (error.response?.status === 401) {
    console.log('🚫 401 Unauthorized - dispatching logout')
    axiosReduxStore.dispatch(logoutUserAPI(false))
  }
  // Trường hợp 2: Nếu nhận được mã lỗi 410 từ Backend (BE), thì sẽ gọi API để làm mới token (refresh token) và cấp lại Access Token mới.
  // Lưu ý: Các request API đang bị lỗi sẽ được lưu lại thông qua error.config để xử lý sau khi có Access Token mới.
  const originalRequests = error.config
  if (error.response?.status === 410 && !originalRequests._retry) {
    // Gán thêm một giá trị _retry bằng true trong khoảng thời gian chờ,
    // đảm bảo việc gọi refresh token này chỉ được thực hiện một lần tại một thời điểm (dựa vào điều kiện if ngay phía trên).
    originalRequests._retry = true

    // Kiểm tra xem nếu chưa có refreshTokenPromise thì thực hiện việc gọi API refresh_token đồng thời gán promise này vào biến refreshTokenPromise.
    if (!refreshTokenPromise) {
      refreshTokenPromise = refreshTokenAPI()
        .then(data => {
          // Cập nhật token mới vào Redux store
          const newUserData = {
            ...axiosReduxStore.getState().user.currentUser,
            accessToken: data?.accessToken
          }

          // Dispatch action để update token
          axiosReduxStore.dispatch({
            type: 'user/loginUserAPI/fulfilled',
            payload: newUserData
          })
          // Đồng thời access đã nằm trong httpOnly cookie (xử lý từ phía BE)
          return data?.accessToken
        })
        .catch((_error) => {
          // Nếu nhận bất kỳ lỗi nào từ api refresh thì cứ logout luôn
          axiosReduxStore.dispatch(logoutUserAPI(false))
          return Promise.reject(_error)
        })
        .finally(() => {
          // Dù API có thành công hay lỗi thì vẫn luôn gán lại cái refreshTokenPromise về null như ban đầu
          refreshTokenPromise = null
        })
    }
    // Cần return trường hợp refreshTokenPromise chạy thành công và xử lý thêm ở đây:
    // eslint-disable-next-line no-unused-vars
    return refreshTokenPromise.then(accessToken => {
      // Add token to retry request
      originalRequests.headers.Authorization = `Bearer ${accessToken}`
    /**
     * Bước 1: Đối với trường hợp nếu dự án cần lưu accessToken vào localStorage hoặc cookie (ngoài việc BE đã xử lý),
     * thì viết thêm code xử lý ở đây.
     *
     * Hiện tại ở đây không cần bước 1 vì chúng ta đã để BE đưa accessToken vào cookie (xử lý từ phía Backend)
     * sau khi API refreshToken được gọi thành công.
     */
      // Bước 2: Quan trọng: Return lại axios instance của chúng ta (đã được cấu hình) để tiếp tục gọi lại
      // những API ban đầu bị lỗi.
      return authorizedAxiosInstance(originalRequests)
    })
  }


  // console.log error là sẽ thấy cấu trúc data dẫn tới message lỗi như dưới đây
  let errorMessage = error?.message
  if (error.response?.data?.message) {
    errorMessage = error.response?.data?.message
  }
  // Dùng toastify để hiển thị bất kể mọi nơi trên màn hình - Ngoại trừ mã 410 - GONE phục vụ việc tự động refresh lại token.
  if (error.response?.status !== 410) {
    toast.error(errorMessage)
  }
  return Promise.reject(error)
})

export default authorizedAxiosInstance
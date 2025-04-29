import axios from 'axios'
import { toast } from 'react-toastify'
import { interceptorLoadingElements } from './formatters'

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
// Interceptor request: Can thiệt vào giữa những cái request API
authorizedAxiosInstance.interceptors.request.use((config) => {
  // Kỹ thuật chặn spam click
  interceptorLoadingElements(true)

  return config
}, (error) => {
// Do something with request error
  return Promise.reject(error)
})

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
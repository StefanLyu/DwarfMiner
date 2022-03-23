/**
 * 自带authorization请求头的axios
 * 用于api的验证，验证失败直接在catch或者then里回到login
 * 用catch时，确保返回的是Promise.reject，否则会默认返回fulfilled并执行后面的then
 * axios.post(url, payload).catch( err => Promise.reject(errMsg)).then(res => {})
 */
import axios from 'axios'

const myaxios = axios;

myaxios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if(token) {
        config.headers.Authorization = token
    }
    return config
})

export default myaxios
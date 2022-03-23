import axios from 'axios'

/**
 * 如果单纯用axios.interceptor.request.use，那在每次调用时都会修改一次新的config，而不是覆盖上一次的修改
 * 即使localStorage的token被删除了，但由于之前已经添加过headers，会认为还是登录状态
 * 正确用法是axios.create，每次生成一个新的axios连接，针对这个连接进行拦截
 */

const interceptor = function() {

    const token = localStorage.getItem('token') || '';

    const instance = axios.create({
        baseURL: '/api/authorization',
        timeout: 5000
    })


    instance.interceptors.request.use(config => {
        if(token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config;
    }, err => {
        return Promise.reject(err);
    })

    return instance({method: 'post'});
}
export default interceptor
import axios from 'axios'
import { getToken, removeToken } from '@/utils/auth'

export const Auth = axios.create({
  baseURL: 'http://118.24.38.46:19999/auth-center-server',
  withCredentials: false
})

export const Blog = axios.create({
  baseURL: 'http://118.24.38.46:19999/blog-admin',
  withCredentials: false
})

export const Xxl = axios.create({
  baseURL: '',
  withCredentials: false
})

export const Health = axios.create({
  baseURL: 'http://118.24.38.46:7777/gateway/health-server',
  withCredentials: false
})

export function requestByClient(client, method, url, data, then) {
  client({
    headers: {
      'access-token': getToken()
    },
    method: method,
    url: url,
    data: data
  })
    .then(then)
    .catch(error => {
      console.error(error)
    })
}

export function request(method, url, data, then) {
  Auth({
    headers: {
      'access-token': getToken()
    },
    method: method,
    url: url,
    data: data
  })
    .then(then)
}
// this.$store.getters

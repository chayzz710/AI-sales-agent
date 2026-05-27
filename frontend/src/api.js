import axios from 'axios'

//creating one axios instance pointing at the backend and making fuctions i.e, wrapper around an API call 

const api = axios.create({
    baseURL: 'http://localhost:8000'
})

// Products
export const getProducts = () => api.get('/products/')
export const createProduct = (data) => api.post('/products/', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)

// Customers
export const getCustomers = () => api.get('/customers/')
export const createCustomer = (data) => api.post('/customers/', data)
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data)
export const deleteCustomer = (id) => api.delete(`/customers/${id}`)

// Calls
export const startCall = (data) => api.post('/calls/start', data)
export const sendMessage = (data) => api.post('/calls/chat', data)
export const endCall = (data) => api.post('/calls/end', data)

// Analytics
export const getSummary = () => api.get('/analytics/summary')
export const getMonthlyRevenue = () => api.get('/analytics/monthly-revenue')
export const getMonthlyCalls = () => api.get('/analytics/monthly-calls')
export const getTopProducts = () => api.get('/analytics/top-products')
export const getRecentCalls = () => api.get('/analytics/recent-calls')
export const getCallDetail = (session_id) => api.get(`/analytics/call-detail/${session_id}`)
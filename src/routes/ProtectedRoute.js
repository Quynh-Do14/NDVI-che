import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('user') // Hoặc logic check auth của bạn
  const location = useLocation()

  return isAuthenticated ? children : <Navigate to='/login' replace state={{ from: location }} />
}

export default ProtectedRoute
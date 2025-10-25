import React from 'react'
import { Navigate } from 'react-router-dom'
import Researcher from '../pages/Researcher'
import Farmer from '../pages/Farmer'
import Manager from '../pages/Manager'
import Login from '../pages/Login/Login'

const authProtectedRoutes = [
  { 
    path: '/researcher', 
    element: <Researcher /> 
  },
  { 
    path: '/farmer', 
    element: <Farmer /> 
  },
  { 
    path: '/manager', 
    element: <Manager /> 
  },
  {
    path: '/',
    element: <Navigate to='/researcher' replace />
  }
]

const publicRoutes = [
  { 
    path: '/login', 
    element: <Login /> 
  }
]

export { authProtectedRoutes, publicRoutes }
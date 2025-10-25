import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import Researcher from './pages/Researcher.jsx'
import Farmer from './pages/Farmer.jsx'
import Manager from './pages/Manager.jsx'
import { useState, useEffect } from 'react'
import Login from './pages/Login/Login.jsx'

export default function App () {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <div className='app'>
      <header className='header'>
        <div className='header-content'>
          <div className='logo'>
            <div className='logo-icon'>
              <svg
                width='28'
                height='28'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path d='M12 3l9 4.5-9 4.5-9-4.5L12 3z' fill='#059669' />
                <path
                  d='M21 12l-9 4.5-9-4.5'
                  stroke='#34d399'
                  strokeWidth='1.2'
                />
                <path
                  d='M21 16.5L12 21 3 16.5'
                  stroke='#a7f3d0'
                  strokeWidth='1.2'
                />
              </svg>
            </div>
            <div className='logo-text'>
              <h1>Tea Monitor</h1>
              <span className='tagline'>Hệ thống giám sát sinh trưởng chè</span>
            </div>
          </div>

          <nav className='navigation'>
            <NavLink
              to='/researcher'
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <div className='nav-icon'>🔬</div>
              <span>Nhà nghiên cứu</span>
            </NavLink>
            <NavLink
              to='/farmer'
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <div className='nav-icon'>👩‍🌾</div>
              <span>Nông hộ</span>
            </NavLink>
            <NavLink
              to='/manager'
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <div className='nav-icon'>📊</div>
              <span>Nhà quản lý</span>
            </NavLink>
          </nav>

          <div className='user-info'>
            <div className='user-avatar'>{user?.name?.charAt(0) || 'U'}</div>
            <div className='user-details'>
              <span className='user-name'>{user?.name}</span>
              <span className='user-role'>{user?.role}</span>
            </div>
          </div>
        </div>
      </header>

      <main className='main-content'>
        <Routes>
          <Route path='/researcher' element={<Researcher />} />
          <Route path='/farmer' element={<Farmer />} />
          <Route path='/manager' element={<Manager />} />
          <Route path='*' element={<Navigate to='/researcher' replace />} />
          {localStorage.getItem('user') == null && (
            <Route path='/' element={<Login />} />
          )}
        </Routes>
      </main>
    </div>
  )
}

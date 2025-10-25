import React, { useState } from 'react'
import { Dropdown, Space, Divider } from 'antd'
import { UserOutlined, LogoutOutlined, DownOutlined } from '@ant-design/icons'
import { NavLink, Link } from 'react-router-dom'
const HeaderComponent = () => {
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
    window.location.href = '/login'
  }

  const items = [
    {
      key: 'logout',
      label: (
        <Link
          to='/login'
          onClick={() => {
            localStorage.clear()
            handleLogout()
          }}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Space>
            <span style={{ color: '#ff4d4f' }}>Đăng xuất</span>
          </Space>
        </Link>
      ),
      icon: <LogoutOutlined />,
      danger: true
    }
  ]
  return (
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
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div className='nav-icon'>🔬</div>
            <span>Nhà nghiên cứu</span>
          </NavLink>
          <NavLink
            to='/farmer'
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div className='nav-icon'>👩‍🌾</div>
            <span>Nông hộ</span>
          </NavLink>
          <NavLink
            to='/manager'
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div className='nav-icon'>📊</div>
            <span>Nhà quản lý</span>
          </NavLink>
        </nav>
        <Dropdown
          menu={{ items }}
          trigger={['click']}
          placement='bottomRight'
          overlayClassName='user-dropdown-overlay'
          overlayStyle={{
            minWidth: '200px'
          }}
        >
          <a onClick={e => e.preventDefault()} className='header-user-trigger'>
            <Space className='user-info'>
              <div className='user-avatar'>
                {user?.name?.charAt(0) || <UserOutlined />}
              </div>
              <div className='user-details'>
                <span className='user-name'>{user?.name}</span>
                <span className='user-role'>{user?.role}</span>
              </div>
              <DownOutlined style={{ fontSize: '12px', color: '#666' }} />
            </Space>
          </a>
        </Dropdown>
      </div>
    </header>
  )
}

export default HeaderComponent

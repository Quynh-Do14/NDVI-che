import { NavLink, Routes, Route, Navigate, Link } from "react-router-dom";
import Researcher from "./pages/Researcher.jsx";
import Manager from "./pages/Manager.jsx";
import React, { useState, useEffect } from "react";
import Login from "./pages/Login/Login.jsx";
import { Dropdown, Space, Divider } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  SettingOutlined,
  ProfileOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import Farmer from "./pages/Farmer/Farmer.jsx";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  const items = [
    {
      key: "logout",
      label: (
        <Link
          to="/login"
          onClick={() => {
            localStorage.clear();
            handleLogout();
          }}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Space>
            <span style={{ color: "#ff4d4f" }}>Đăng xuất</span>
          </Space>
        </Link>
      ),
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];
  const localUser = JSON.parse(localStorage.getItem("user"))?.data;

  return (
    <React.Fragment>
      <div className="app">
        <main className="main-content">
          <Routes>
            {/* Route công khai */}
            <Route path="/login" element={<Login />} />

            {/* Route theo role */}
            {localUser?.role === "NGUOIDUNG" && (
              <Route path="/farmer" element={<Farmer />} />
            )}
            {localUser?.role === "ADMIN" && (
              <Route path="/manager" element={<Manager />} />
            )}
            {localUser?.role === "NGHIENCUU" && (
              <Route path="/researcher" element={<Researcher />} />
            )}

            {/* Redirect mặc định */}
            <Route
              path="/"
              element={
                localUser ? (
                  localUser.role === "NGUOIDUNG" ? (
                    <Navigate to="/farmer" />
                  ) : localUser.role === "ADMIN" ? (
                    <Navigate to="/researcher" />
                  ) : localUser.role === "QUANLY" ? (
                    <Navigate to="/manager" />
                  ) : (
                    <Navigate to="/login" />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* Redirect cho các route không tồn tại */}
            <Route
              path="*"
              element={
                localUser ? (
                  localUser.role === "NGUOIDUNG" ? (
                    <Navigate to="/farmer" />
                  ) : localUser.role === "ADMIN" ? (
                    <Navigate to="/researcher" />
                  ) : localUser.role === "QUANLY" ? (
                    <Navigate to="/manager" />
                  ) : (
                    <Navigate to="/login" />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </React.Fragment>
  );
}

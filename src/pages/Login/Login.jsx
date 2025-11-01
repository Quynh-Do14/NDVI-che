import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const getRedirectPathByRole = (role) => {
    switch (role) {
      case "NGUOIDUNG":
        return "/farmer";
      case "ADMIN":
        return "/manager";
      case "NGHIENCUU":
        return "/researcher";
      default:
        return "/";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate form
    if (!formData.username || !formData.password) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("http://103.163.119.247:33612/dangnhap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          us: formData.username,
          pa: formData.password,
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();

      if (data.success) {
        // Lưu thông tin user vào localStorage
        sessionStorage.setItem("user", JSON.stringify(data));

        // Lấy role từ response
        const userRole = data.data?.role;
        console.log("userRole", userRole);

        // Xác định đường dẫn redirect dựa trên role
        const redirectPath = getRedirectPathByRole(userRole);

        console.log("redirectPath", redirectPath);

        // Redirect đến trang tương ứng với role
        // navigate(redirectPath, { replace: true });
        window.location.href = redirectPath;
      } else {
        setError("Tài khoản hoặc mật khẩu không chính xác.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" fill="#059669" />
                <path
                  d="M21 12l-9 4.5-9-4.5"
                  stroke="#34d399"
                  strokeWidth="1.2"
                />
                <path
                  d="M21 16.5L12 21 3 16.5"
                  stroke="#a7f3d0"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
            <div className="login-title">
              <h1>Đăng nhập</h1>
              <p>Hệ thống giám sát sinh trưởng chè</p>
            </div>
          </div>

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">Tên đăng nhập</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Tên đăng nhập"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p>© 2025 Tea Monitor</p>
          </div>
        </div>
      </div>
    </div>
  );
}

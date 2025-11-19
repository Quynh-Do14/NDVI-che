import { message } from "antd";
import React, { useEffect, useState } from "react";

const Nhatky = () => {
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "tuoi",
    cost: null,
    plot: "",
    note: "",
    lat: "",
    long: "",
  });
  const [anh, setAnh] = useState(null);
  const [dsLoChe, setDsLoChe] = useState([]);

  // Sửa hàm handleInputChange - bỏ currying
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLogForm((prev) => ({
      ...prev,
      [name]: name === "cost" ? Number(value) : value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAnh(e.target.files[0]);
    }
  };
  useEffect(() => {
    if (dsLoChe.length) {
      setLogForm({
        plot: dsLoChe[0].idlo,
      });
    }
  }, [dsLoChe]);
  const handleLogSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      // Thêm các trường dữ liệu vào formData
      formData.append("date", logForm.date);
      formData.append("hanhdong", logForm.type);
      formData.append("chiphi", logForm.cost.toString());
      formData.append("noidung", logForm.note);
      formData.append("lat", logForm.lat);
      formData.append("long", logForm.long);
      formData.append("loid", logForm.plot);

      // Chỉ thêm ảnh nếu có
      if (anh) {
        formData.append("nhatky", anh);
      }

      const res = await fetch("http://103.163.119.247:33612/nhatky", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      const data = await res.json();
      console.log("Response:", data);

      if (data.success) {
        // Reset form sau khi thành công
        handleReset();
        message.success("Lưu nhật ký thành công!");
      }
    } catch (err) {
      console.error("Error:", err);
      message.error("Lỗi khi lưu nhật ký!");
    }
  };

  const handleReset = () => {
    setLogForm({
      date: new Date().toISOString().split("T")[0],
      type: "tuoi",
      cost: null,
      plot: "",
      note: "",
      lat: "",
      long: "",
    });
    setAnh(null);

    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const fetchDataDSLoChe = async () => {
    fetch("http://103.163.119.247:33612/lo")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then((data) => {
        if (data.success) {
          setDsLoChe(data.data);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });
  };
  useEffect(() => {
    fetchDataDSLoChe();
  }, []);

  const user = JSON.parse(sessionStorage.getItem("user"))?.data;

  return (
    <form id="form-log" onSubmit={handleLogSubmit}>
      <div className="row">
        <div>
          <label>Ngày thực hiện</label>
          <input
            type="date"
            name="date"
            value={logForm.date}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Loại công việc</label>
          <select
            name="type"
            value={logForm.type}
            onChange={handleInputChange}
            required
          >
            <option value="tuoi">Tưới</option>
            <option value="bon">Bón phân</option>
            <option value="phun">Phun thuốc</option>
            <option value="thu-hai">Thu hái</option>
          </select>
        </div>
      </div>

      <div className="row">
        <div>
          <label>
            {logForm.type == "tuoi"
              ? "Lượng (Lít)"
              : logForm.type == "bon"
              ? "Kilogram (Kg)"
              : logForm.type == "phun"
              ? "Lượng (Lít)"
              : logForm.type == "thu-hai"
              ? "Kilogram (Kg)"
              : ""}{" "}
          </label>
          <input
            type="number"
            name="cost"
            value={logForm.cost}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Lô chè</label>
          <select name="plot" value={logForm.plot} onChange={handleInputChange}>
            <option value="">Chọn lô</option>
            {dsLoChe
              .filter((item) => item.userid == user.iduser)
              .map((plot) => (
                <option key={plot.idlo} value={plot.idlo}>
                  {plot.tenlo}
                </option>
              ))}
          </select>
        </div>
      </div>

      <label>Ghi chú</label>
      <textarea
        name="note"
        value={logForm.note}
        onChange={handleInputChange}
        placeholder="Mô tả chi tiết công việc..."
        id="log-note"
        rows={3}
      />

      <div className="row">
        <div>
          <label>Vĩ độ</label>
          <input
            type="text"
            name="lat"
            value={logForm.lat}
            placeholder="Nhập vĩ độ"
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Kinh độ</label>
          <input
            type="text"
            name="long"
            value={logForm.long}
            placeholder="Nhập kinh độ"
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Ảnh hiện trường</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {anh && (
            <span style={{ fontSize: "12px", color: "#666" }}>
              Đã chọn: {anh.name}
            </span>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button className="btn" type="submit">
          Lưu nhật ký
        </button>
        <button className="btn ghost" type="button" onClick={handleReset}>
          Xóa
        </button>
      </div>
    </form>
  );
};

export default Nhatky;

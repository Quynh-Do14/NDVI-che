import { formatNumber } from "chart.js/helpers";
import React, { useEffect, useState } from "react";

const Thongkenhatky = ({ activeTab }) => {
  const [dataStaticTuoi, setDataStaticTuoi] = useState({});
  const [dataStaticBon, setDataStaticBon] = useState({});
  const [dataStaticPhun, setDataStaticPhun] = useState({});
  const [dataStaticThuHai, setDataStaticThuHai] = useState({});

  const onGetDataStatic = async () => {
    fetch("http://103.163.119.247:33612/thongkenhatky?hanhdong=tuoi")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then((data) => {
        if (data.success) {
          setDataStaticTuoi(data.data[0]);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });

    fetch("http://103.163.119.247:33612/thongkenhatky?hanhdong=bon")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then((data) => {
        if (data.success) {
          setDataStaticBon(data.data[0]);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });

    fetch("http://103.163.119.247:33612/thongkenhatky?hanhdong=phun")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then((data) => {
        if (data.success) {
          setDataStaticPhun(data.data[0]);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });

    fetch("http://103.163.119.247:33612/thongkenhatky?hanhdong=thu-hai")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then((data) => {
        if (data.success) {
          setDataStaticThuHai(data.data[0]);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });
  };

  useEffect(() => {
    onGetDataStatic();
  }, []);

  return (
    <div
      id="tab-stats"
      className={`tab-content ${activeTab === "stats" ? "active" : ""}`}
    >
      <div className="content">
        <div className="title">Tưới nước</div>
        <div className="kpi">
          <div className="metric">
            <h5>Tổng</h5>
            <div className="val">
              {formatNumber(dataStaticTuoi.tong_chi_phi)} L
            </div>
          </div>
          <div className="metric">
            <h5>Số nhật ký</h5>
            <div className="val">{dataStaticTuoi.so_luong_nhat_ky}</div>
          </div>
          <div className="metric">
            <h5>Trung bình</h5>
            <div className="val">
              {formatNumber(dataStaticTuoi.chi_phi_trung_binh)} L
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="title">Bón phân</div>
        <div className="kpi">
          <div className="metric">
            <h5>Tổng</h5>
            <div className="val">
              {formatNumber(dataStaticBon.tong_chi_phi)} Kg
            </div>
          </div>
          <div className="metric">
            <h5>Số nhật ký</h5>
            <div className="val">{dataStaticBon.so_luong_nhat_ky}</div>
          </div>
          <div className="metric">
            <h5>Trung bình</h5>
            <div className="val">
              {formatNumber(dataStaticBon.chi_phi_trung_binh)} Kg
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="title">Phun thuốc</div>
        <div className="kpi">
          <div className="metric">
            <h5>Tổng</h5>
            <div className="val">
              {formatNumber(dataStaticPhun.tong_chi_phi)} L
            </div>
          </div>
          <div className="metric">
            <h5>Số nhật ký</h5>
            <div className="val">{dataStaticPhun.so_luong_nhat_ky}</div>
          </div>
          <div className="metric">
            <h5>Trung bình</h5>
            <div className="val">
              {formatNumber(dataStaticPhun.chi_phi_trung_binh)} L
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="title">Thu hái</div>
        <div className="kpi">
          <div className="metric">
            <h5>Tổng</h5>
            <div className="val">
              {formatNumber(dataStaticThuHai.tong_chi_phi)} Kg
            </div>
          </div>
          <div className="metric">
            <h5>Số nhật ký</h5>
            <div className="val">{dataStaticThuHai.so_luong_nhat_ky}</div>
          </div>
          <div className="metric">
            <h5>Trung bình</h5>
            <div className="val">
              {formatNumber(dataStaticThuHai.chi_phi_trung_binh)} Kg
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Thongkenhatky;

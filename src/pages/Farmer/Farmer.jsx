import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "./Farmer.css";
import { kelvinToCelsius } from "../../helper/helper";
import Nhatky from "./Nhatky";
import Baocao from "./Baocao";
import KhuyenNghiThoiTiet from "./KhuyenNghiThoiTiet";
import { Col, Dropdown, Menu, Row } from "antd";
import Thongkenhatky from "./Thongkenhatky";
import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined as UserIcon,
} from "@ant-design/icons";

// Mapbox token
mapboxgl.accessToken =
  "pk.eyJ1IjoibmdvY3R0ZCIsImEiOiJjbWJibmlod3MwMmluMnFyMG1xMWt0dTdrIn0.ok5SgmXGrHFLeMPf-OG5_w";

// Sample data (giả lập)
const plots = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "P01", name: "Lô P01", area: 0.8, ndvi: 0.72 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.94, 20.26],
            [105.943, 20.26],
            [105.943, 20.258],
            [105.94, 20.258],
            [105.94, 20.26],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "P02", name: "Lô P02", area: 1.1, ndvi: 0.61 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.952, 20.255],
            [105.956, 20.255],
            [105.956, 20.252],
            [105.952, 20.252],
            [105.952, 20.255],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "P03", name: "Lô P03", area: 0.6, ndvi: 0.45 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.962, 20.262],
            [105.966, 20.262],
            [105.966, 20.259],
            [105.962, 20.259],
            [105.962, 20.262],
          ],
        ],
      },
    },
  ],
};

// Generate NDVI grid
const generateNDVIGrid = () => {
  const ndviGrid = { type: "FeatureCollection", features: [] };
  const x0 = 105.935,
    y0 = 20.248,
    cols = 8,
    rows = 7,
    dx = 0.0045,
    dy = 0.0045;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x1 = x0 + c * dx,
        y1 = y0 + r * dy,
        x2 = x1 + dx,
        y2 = y1 + dy;
      const ndvi = +(0.35 + Math.random() * 0.45).toFixed(2);
      ndviGrid.features.push({
        type: "Feature",
        properties: { ndvi },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [x1, y1],
              [x2, y1],
              [x2, y2],
              [x1, y2],
              [x1, y1],
            ],
          ],
        },
      });
    }
  }
  return ndviGrid;
};

const advisories = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        title: "Khuyến cáo tưới nhẹ",
        level: "info",
        msg: "Duy trì 5–7 mm/ngày trong 3 ngày tới.",
      },
      geometry: { type: "Point", coordinates: [105.948, 20.256] },
    },
  ],
};

const incidents = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        type: "sau-benh",
        desc: "Phát hiện bọ xít nhỏ, lá chấm vàng",
        plot: "P02",
      },
      geometry: { type: "Point", coordinates: [105.954, 20.2535] },
    },
  ],
};

// Utility functions
const labelWork = (k) => {
  const labels = {
    tuoi: "Tưới",
    bon: "Bón phân",
    phun: "Phun thuốc",
    "thu-hai": "Thu hái",
  };
  return labels[k] || k;
};

const labelIncident = (k) => {
  const labels = {
    "sau-benh": "Sâu bệnh",
    ung: "Úng",
    han: "Hạn",
    "suong-muoi": "Sương muối",
    khac: "Khác",
  };
  return labels[k] || k;
};

const formatNumber = (n) => n.toLocaleString("vi-VN");

export default function Farmer() {
  const mapRef = useRef(null);
  const mapDivRef = useRef(null);

  // State
  const [activeTab, setActiveTab] = useState("log");
  const [layerVisibility, setLayerVisibility] = useState({
    plots: true,
    ndvi: true,
    alerts: true,
    incidents: true,
  });

  const [selectedPlot, setSelectedPlot] = useState("");
  const [kpiData, setKpiData] = useState({
    ndvi: "—",
    rain: "—",
    gdd: "—",
  });
  const [weatherData, setWeatherData] = useState([]);
  const [currentWeather, setCurrentWeather] = useState({});
  const [userData, setUserData] = useState({
    logs: [],
    incidents: [],
    costTotal: 0,
  });

  // Initialize data
  useEffect(() => {
    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const gpsText = `${longitude.toFixed(5)}, ${latitude.toFixed(5)}`;
        setLogForm((prev) => ({ ...prev, gps: gpsText }));
        setIncidentForm((prev) => ({ ...prev, gps: gpsText }));
      });
    }
  }, []);

  // Map initialization
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapDivRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [105.95, 20.25],
      zoom: 11,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "bottom-right"
    );
    map.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }),
      "bottom-left"
    );

    map.on("load", () => {
      const ndviGrid = generateNDVIGrid();

      // Add sources
      map.addSource("plots", { type: "geojson", data: plots });
      map.addSource("ndvi", { type: "geojson", data: ndviGrid });
      map.addSource("advisories", { type: "geojson", data: advisories });
      map.addSource("incidents", { type: "geojson", data: incidents });

      // Add layers
      map.addLayer({
        id: "plots-fill",
        type: "fill",
        source: "plots",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "ndvi"],
            0.3,
            "#fef3c7",
            0.5,
            "#a7f3d0",
            0.7,
            "#34d399",
          ],
          "fill-opacity": 0.6,
        },
      });

      map.addLayer({
        id: "plots-line",
        type: "line",
        source: "plots",
        paint: {
          "line-color": "#065f46",
          "line-width": 1.2,
        },
      });

      map.addLayer({
        id: "ndvi-fill",
        type: "fill",
        source: "ndvi",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "ndvi"],
            0.3,
            "#fee2e2",
            0.45,
            "#fde68a",
            0.6,
            "#86efac",
            0.75,
            "#22c55e",
          ],
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "advisories-sym",
        type: "symbol",
        source: "advisories",
        layout: {
          "icon-image": "marker-15",
          "icon-size": 1.2,
          "text-field": ["get", "title"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: { "text-color": "#1f2937" },
      });

      map.addLayer({
        id: "incidents-sym",
        type: "symbol",
        source: "incidents",
        layout: {
          "icon-image": "marker-15",
          "icon-size": 1.2,
          "text-field": ["get", "type"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: { "text-color": "#991b1b" },
      });

      // Plot click handler
      map.on("click", "plots-fill", (e) => {
        const f = e.features[0];
        const { id, name, area, ndvi } = f.properties;

        const html = `
          <strong>${name}</strong><br/>
          Mã: ${id} · Diện tích: ${area} ha<br/>
          NDVI hiện tại: <b>${ndvi}</b><br/>
          <button id="btn-log-${id}" class="map-popup-btn">Ghi nhật ký</button>
        `;

        new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);

        // Update KPI
        setKpiData((prev) => ({ ...prev, ndvi }));
        setSelectedPlot(id);
        setLogForm((prev) => ({ ...prev, plot: id }));
        setIncidentForm((prev) => ({ ...prev, plot: id }));

        // Add button handler
        setTimeout(() => {
          const btn = document.getElementById(`btn-log-${id}`);
          if (btn) {
            btn.onclick = () => {
              setActiveTab("log");
              document.getElementById("log-note")?.focus();
            };
          }
        }, 50);
      });

      // Fit bounds to plots
      const coordinates = plots.features.flatMap(
        (f) => f.geometry.coordinates[0]
      );
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.fitBounds(bounds, { padding: 60 });
    });

    return () => map.remove();
  }, []);

  // Update layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const visibility = (visible) => (visible ? "visible" : "none");

    map.setLayoutProperty(
      "plots-line",
      "visibility",
      visibility(layerVisibility.plots)
    );
    map.setLayoutProperty(
      "plots-fill",
      "visibility",
      visibility(layerVisibility.plots)
    );
    map.setLayoutProperty(
      "ndvi-fill",
      "visibility",
      visibility(layerVisibility.ndvi)
    );
    map.setLayoutProperty(
      "advisories-sym",
      "visibility",
      visibility(layerVisibility.alerts)
    );
    map.setLayoutProperty(
      "incidents-sym",
      "visibility",
      visibility(layerVisibility.incidents)
    );
  }, [layerVisibility]);

  // Handlers
  const handleLayerToggle = (layer) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  // Calculate statistics
  const totalArea = plots.features.reduce(
    (sum, plot) => sum + (plot.properties.area || 0),
    0
  );
  const costPerHa = totalArea ? Math.round(userData.costTotal / totalArea) : 0;

  // Advice data (giả lập)
  const adviceData = [
    {
      title: "Tưới nhẹ 5–7 mm",
      time: "3 ngày tới",
      plot: "P01",
      note: "Đảm bảo ẩm mặt đất, tránh úng",
    },
    {
      title: "Bón NPK 16-16-8",
      time: "Tuần này",
      plot: "P02",
      note: "Liều 150–200 kg/ha, sau mưa 1–2 ngày",
    },
  ];
  const [anh, setAnh] = useState("");

  const onGetWeather = async () => {
    try {
      const res = await fetch(
        "https://api.openweathermap.org/data/2.5/weather?q=Hanoi&appid=723262eea804eb2695383fc4d482da35"
        // KHÔNG cần headers với OpenWeatherMap API
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("data", data);
      setCurrentWeather(data);
    } catch (err) {
      console.log("Error:", err);
    }
  };

  useEffect(() => {
    onGetWeather();
  }, []);

  return (
    <div className="farmer-app">
      <header>
        <div className="brand">
          <div className="logo" aria-hidden="true"></div>
          <h1>Giám sát chè – Giao diện Nông hộ</h1>
        </div>
        <div className="actions">
          <span className="pill">
            ☁️ Thời tiết:{" "}
            <strong>{kelvinToCelsius(currentWeather?.main?.temp)}°C</strong>
          </span>
          <span className="pill">
            🔔 <span>{userData.incidents.length}</span>
          </span>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="logout"
                  icon={<LogoutOutlined />}
                  danger
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = "/login";
                  }}
                >
                  Đăng xuất
                </Menu.Item>
              </Menu>
            }
            placement="bottomRight"
            arrow
          >
            <span className="pill">
              {JSON.parse(sessionStorage.getItem("user"))?.data?.ten}
            </span>
          </Dropdown>
        </div>
      </header>

      <Row gutter={16} className="layout">
        <Col span={14} className="map-container">
          <div ref={mapDivRef} id="map"></div>
          <div className="controls">
            <div className="control">
              <h3>Lớp dữ liệu</h3>
              <label>
                <input
                  type="checkbox"
                  checked={layerVisibility.plots}
                  onChange={() => handleLayerToggle("plots")}
                />
                Lô chè của tôi
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layerVisibility.ndvi}
                  onChange={() => handleLayerToggle("ndvi")}
                />
                NDVI (giả lập)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layerVisibility.alerts}
                  onChange={() => handleLayerToggle("alerts")}
                />
                Khuyến cáo
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layerVisibility.incidents}
                  onChange={() => handleLayerToggle("incidents")}
                />
                Sự cố hiện trường
              </label>
            </div>
            <div className="control">
              <h3>Thông tin nhanh lô</h3>
              <div className="kpi">
                <div className="metric">
                  <h5>NDVI</h5>
                  <div className="val">{kpiData.ndvi}</div>
                </div>
                <div className="metric">
                  <h5>Mưa (mm)</h5>
                  <div className="val">{kpiData.rain}</div>
                </div>
                <div className="metric">
                  <h5>GDD</h5>
                  <div className="val">{kpiData.gdd}</div>
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col span={10} className="sidebar">
          <div className="card">
            <div className="tabs" role="tablist">
              {[
                { id: "log", label: "📝 Nhật ký" },
                { id: "advice", label: "📣 Khuyến cáo & Thời tiết" },
                { id: "report", label: "🚩 Báo cáo hiện trường" },
                { id: "stats", label: "💰 Chi phí & Thống kê" },
              ].map((tab) => (
                <div
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                >
                  {tab.label}
                </div>
              ))}
            </div>

            {/* Log Tab */}
            <div
              id="tab-log"
              className={`tab-content ${activeTab === "log" ? "active" : ""}`}
            >
              <Nhatky />
              <hr />
              <div className="list" id="log-list">
                {userData.logs.map((log) => (
                  <div key={log.id} className="item">
                    <h4>
                      {log.date} · {labelWork(log.type)} · Lô {log.plot}
                    </h4>
                    <p>{log.note || ""}</p>
                    <p>
                      Chi phí: {formatNumber(parseInt(log.cost) || 0)} · GPS:{" "}
                      {log.gps || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Advice Tab */}
            <KhuyenNghiThoiTiet activeTab={activeTab} />

            {/* Report Tab */}
            <Baocao activeTab={activeTab} />

            {/* Stats Tab */}
            <Thongkenhatky activeTab={activeTab} />
          </div>
          <footer>
            © 2025 – Nền tảng giám sát sinh trưởng chè (giao diện mẫu nông hộ)
          </footer>
        </Col>
      </Row>
    </div>
  );
}

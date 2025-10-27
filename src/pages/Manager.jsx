import React, { useEffect, useRef, useState } from "react";
import { Card, Table, Button, Slider, Checkbox, Space, Tag } from "antd";
import {
  DownloadOutlined,
  SendOutlined,
  EditOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import Chart from "chart.js/auto";
import "./Manager.css";
import { kelvinToCelsius } from "../helper/helper";
import { Dropdown, Menu } from "antd";
import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined as UserIcon,
} from "@ant-design/icons";

// Mapbox token
mapboxgl.accessToken =
  "pk.eyJ1IjoibmdvY3R0ZCIsImEiOiJjbWJibmlod3MwMmluMnFyMG1xMWt0dTdrIn0.ok5SgmXGrHFLeMPf-OG5_w";

// Utility functions
const fmt = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

// Sample data
const generateSampleData = () => {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  const ndvi = days.map(() => 0.55 + Math.random() * 0.35);
  const evi = ndvi.map((v) => Math.max(0, v - (0.08 + Math.random() * 0.05)));
  const ndwi = ndvi.map((v) =>
    Math.max(0, 0.35 + Math.random() * 0.15 - (v - 0.5) * 0.2)
  );

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const rain7 = last7.map(() => Math.round(Math.random() * 25));
  const sun7 = last7.map(() => 8 + Math.round(Math.random() * 4));

  return {
    days,
    ndvi,
    evi,
    ndwi,
    last7,
    rain7,
    sun7,
    yieldAvg: 1.8 + Math.random() * 0.8,
    weatherCaps: [
      "☀️ Nắng nhẹ",
      "⛅ Ít mây",
      "🌦️ Có mưa rào",
      "🌧️ Mưa vừa",
      "🌤️ Nắng gián đoạn",
    ],
    logs: [
      {
        key: "1",
        date: "-3",
        place: "Yên Mô",
        action: "Tưới nước",
        cost: 150000,
      },
      {
        key: "2",
        date: "-2",
        place: "Tam Điệp",
        action: "Phun thuốc sâu",
        cost: 200000,
      },
      {
        key: "3",
        date: "-1",
        place: "Nho Quan",
        action: "Bón phân",
        cost: 320000,
      },
      {
        key: "4",
        date: "Hôm nay",
        place: "Gia Viễn",
        action: "Thu hái",
        cost: 0,
      },
    ],
    audits: [
      {
        key: "1",
        ts: "-2h",
        user: "manager01",
        action: "DUYỆT KHUYẾN CÁO",
        detail: "AOI_2025_10_21_01",
      },
      {
        key: "2",
        ts: "-1h",
        user: "manager01",
        action: "TẠO AOI",
        detail: "AOI_2025_10_23_02",
      },
      {
        key: "3",
        ts: "-10m",
        user: "analyst",
        action: "CẬP NHẬT LỚP RỦI RO",
        detail: "risk-heat v0.2",
      },
    ],
  };
};

const Manager = () => {
  const mapContainer = useRef(null);
  const chartIndicesRef = useRef(null);
  const chartWeatherRef = useRef(null);

  const [data] = useState(generateSampleData());
  const [timeIndex, setTimeIndex] = useState(29);
  const [isDrawing, setIsDrawing] = useState(false);
  const [aoiItems, setAoiItems] = useState([]);
  const [layerVisibility, setLayerVisibility] = useState({
    "tea-regions": true,
    "tea-plots": true,
    "risk-heat": true,
    events: true,
  });

  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const indicesChartRef = useRef(null);
  const weatherChartRef = useRef(null);

  // Initialize charts
  useEffect(() => {
    // Indices Chart
    if (chartIndicesRef.current) {
      const ctx = chartIndicesRef.current.getContext("2d");
      indicesChartRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.days.map((d) => d.toLocaleDateString("vi-VN")),
          datasets: [
            {
              label: "NDVI",
              data: data.ndvi,
              borderColor: "#059669",
              tension: 0.3,
            },
            {
              label: "EVI",
              data: data.evi,
              borderColor: "#10b981",
              tension: 0.3,
            },
            {
              label: "NDWI",
              data: data.ndwi,
              borderColor: "#06b6d4",
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  `${ctx.dataset.label}: ${fmt.format(ctx.parsed.y)}`,
              },
            },
          },
          scales: {
            y: { beginAtZero: true, max: 1.2 },
          },
        },
      });
    }

    // Weather Chart
    return () => {
      indicesChartRef.current?.destroy();
      weatherChartRef.current?.destroy();
    };
  }, [data]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [106.0, 20.25],
      zoom: 10.5,
      pitch: 30,
      bearing: -20,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" })
    );

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: "simple_select",
    });
    map.addControl(draw, "top-left");
    drawRef.current = draw;

    // GeoJSON data
    const teaRegions = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Vùng chè A", risk: 0.3 },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [105.95, 20.25],
                [106.02, 20.25],
                [106.02, 20.3],
                [105.95, 20.3],
                [105.95, 20.25],
              ],
            ],
          },
        },
      ],
    };

    map.on("load", () => {
      // Add sources and layers
      map.addSource("tea-regions", { type: "geojson", data: teaRegions });
      map.addLayer({
        id: "tea-regions",
        type: "fill",
        source: "tea-regions",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "risk"],
            0,
            "#93c5fd",
            0.5,
            "#fbbf24",
            1,
            "#ef4444",
          ],
          "fill-opacity": 0.35,
        },
      });

      // Add other layers similarly...
    });

    return () => {
      map.remove();
    };
  }, []);

  const handleTimeSliderChange = (value) => {
    setTimeIndex(value);
    if (mapRef.current?.getLayer("risk-heat")) {
      const factor = 0.6 + (value / 29) * 0.8;
      mapRef.current.setPaintProperty("risk-heat", "heatmap-intensity", factor);
    }
  };

  const handleDrawAOI = () => {
    const drawing = !isDrawing;
    setIsDrawing(drawing);
    if (drawing) {
      drawRef.current?.changeMode("draw_polygon");
    } else {
      drawRef.current?.changeMode("simple_select");
    }
  };

  const handleSendFCM = () => {
    const feats = drawRef.current?.getAll();
    if (!feats?.features.length) {
      alert("Chưa có AOI nào được vẽ.");
      return;
    }

    const f = feats.features[feats.features.length - 1];
    const id =
      "AOI_" +
      new Date()
        .toISOString()
        .replace(/[-:.TZ]/g, "")
        .slice(0, 14);
    const newAoi = {
      id,
      date: new Date().toLocaleString("vi-VN"),
      status: "Đã gửi",
      coords: f.geometry.coordinates[0]
        .slice(0, 3)
        .map((c) => c.map((v) => v.toFixed(4)).join(",")),
    };

    setAoiItems((prev) => [newAoi, ...prev]);
    alert("Đã gửi khuyến cáo (FCM demo).");
  };

  const handleExportCSV = () => {
    const rows = [["Ngày", "Xã/Huyện", "Hoạt động", "Chi phí"]].concat(
      data.logs.map((l) => [l.date, l.place, l.action, l.cost])
    );
    const csv = rows
      .map((r) =>
        r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nhat-ky-nong-ho.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Báo cáo tổng hợp nhật ký nông hộ", 40, 40);
    doc.setFontSize(10);
    let y = 70;
    data.logs.forEach((l) => {
      doc.text(
        `${l.date} | ${l.place} | ${l.action} | ${fmt.format(l.cost)} đ`,
        40,
        y
      );
      y += 18;
      if (y > 780) {
        doc.addPage();
        y = 40;
      }
    });
    doc.save("bao-cao-nhat-ky.pdf");
  };

  const handleLayerToggle = (layer, checked) => {
    setLayerVisibility((prev) => ({ ...prev, [layer]: checked }));
    if (mapRef.current?.getLayer(layer)) {
      mapRef.current.setLayoutProperty(
        layer,
        "visibility",
        checked ? "visible" : "none"
      );
    }
  };

  // Calculate averages
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const ndviAvg = avg(data.ndvi);
  const ndwiAvg = avg(data.ndwi);
  const eviAvg = avg(data.evi);

  // Table columns

  const auditColumns = [
    { title: "Thời gian", dataIndex: "ts", key: "ts" },
    { title: "Người dùng", dataIndex: "user", key: "user" },
    { title: "Hành động", dataIndex: "action", key: "action" },
    { title: "Chi tiết", dataIndex: "detail", key: "detail" },
  ];
  const [weatherData, setWeatherData] = useState([]);
  const [currentWeather, setCurrentWeather] = useState({});
  const [mainWeather, setMainWeather] = useState("");
  const [rainTotal, setRainTotal] = useState(0);
  const [logColumns, setLogForm] = useState([]);

  const onGetWeather = async () => {
    try {
      const res = await fetch(
        "https://api.openweathermap.org/data/2.5/forecast?lat=21.0245&lon=105.8412&appid=723262eea804eb2695383fc4d482da35"
        // KHÔNG cần headers với OpenWeatherMap API
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("data", data);
      setWeatherData(data.list);
    } catch (err) {
      console.log("Error:", err);
    }
  };
  const onGetCurrentWeather = async () => {
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

  const onGetDataDiary = async () => {
    fetch("http://103.163.119.247:33612/nhatky")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then((data) => {
        if (data.success) {
          setLogForm(data.data);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });
  };

  useEffect(() => {
    onGetWeather();
    onGetCurrentWeather();
    onGetDataDiary();
  }, []);

  useEffect(() => {
    if (chartWeatherRef.current) {
      // Xóa chart cũ
      if (weatherChartRef.current) {
        weatherChartRef.current.destroy();
      }

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString("vi-VN");
      });
      const temp = weatherData.map((item) => kelvinToCelsius(item.main.temp));
      const rain = weatherData.map((item) => item?.rain?.["3h"] || 0);
      const ctx = chartWeatherRef.current.getContext("2d");
      weatherChartRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: last7Days,
          datasets: [
            {
              label: "Nhiệt độ (°C)",
              data: temp,
              backgroundColor: "#f59e0b",
            },
            {
              label: "Lượng mưa (mm)",
              data: rain,
              backgroundColor: "#3b82f6",
            },
          ],
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    const weather7Day = weatherData.slice(0, 7);
    const totalRin = weather7Day.reduce((acc, item) => {
      const date = acc + (item?.rain?.["3h"] || 0);
      return date;
    }, 0);
    setRainTotal(totalRin);
  }, [weatherData]);

  useEffect(() => {
    const current = currentWeather?.weather?.[0]?.main;
    if (!current) return;

    switch (current) {
      case "Clear":
        setMainWeather("☀️ Trời nắng");
        break;
      case "Clouds":
        setMainWeather("⛅ Nhiều mây");
        break;
      case "Rain":
        setMainWeather("🌧️ Mưa");
        break;
      case "Drizzle":
        setMainWeather("🌦️ Mưa phùn");
        break;
      case "Thunderstorm":
        setMainWeather("⛈️ Giông bão");
        break;
      case "Snow":
        setMainWeather("❄️ Tuyết");
        break;
      case "Mist":
        setMainWeather("🌫️ Sương mù");
        break;
      case "Smoke":
        setMainWeather("💨 Khói");
        break;
      case "Haze":
        setMainWeather("😶‍🌫️ Mù nhẹ");
        break;
      case "Dust":
        setMainWeather("💨 Bụi");
        break;
      case "Fog":
        setMainWeather("🌁 Sương mù dày");
        break;
      case "Sand":
        setMainWeather("🌪️ Bão cát");
        break;
      case "Ash":
        setMainWeather("🌋 Tro núi lửa");
        break;
      case "Squall":
        setMainWeather("💨 Gió giật");
        break;
      case "Tornado":
        setMainWeather("🌪️ Lốc xoáy");
        break;
      default:
        setMainWeather("🌈 Thời tiết bình thường");
    }
  }, [currentWeather]);

  return (
    <div className="manager-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">Tea</div>
            <div>
              <h1>Dashboard Nhà quản lý</h1>
              <span className="tagline">
                Giám sát vùng/lô chè • NDVI/EVI/NDWI • Khuyến cáo AOI • FCM
              </span>
            </div>
          </div>
          <div className="header-actions">
            <div className="weather-info">
              <span>{mainWeather}</span>
            </div>
            <div className="date-info">
              <span>Hôm nay:</span>
              <strong>{new Date().toLocaleDateString("vi-VN")}</strong>
            </div>
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
              <div className="user-avatar" style={{ cursor: "pointer" }}>
                👤
              </div>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <Card className="sidebar-card">
            <h3>Menu</h3>
            <nav className="sidebar-nav">
              <a href="#mapPanel">Tổng quan</a>
              <a href="#indicesPanel">Chỉ số GEE</a>
              <a href="#weatherPanel">Thời tiết</a>
              <a href="#logsPanel">Nhật ký nông hộ</a>
              <a href="#aoiPanel">Khuyến cáo (AOI)</a>
              <a href="#reportPanel">Báo cáo & Audit</a>
            </nav>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Info Cards */}
          <section className="info-cards">
            <Card className="info-card">
              <p className="card-label">NDVI TB</p>
              <h3 className="card-value text-green-700">
                {fmt.format(ndviAvg)}
              </h3>
              <p className="card-desc">—</p>
            </Card>
            <Card className="info-card">
              <p className="card-label">EVI TB</p>
              <h3 className="card-value text-emerald-700">
                {fmt.format(eviAvg)}
              </h3>
              <p className="card-desc">30 ngày</p>
            </Card>
            <Card className="info-card">
              <p className="card-label">NDWI TB</p>
              <h3 className="card-value text-cyan-700">
                {fmt.format(ndwiAvg)}
              </h3>
              <p className="card-desc">Độ ẩm tán</p>
            </Card>
            <Card className="info-card">
              <p className="card-label">Mưa 7 ngày</p>
              <h3 className="card-value text-blue-700">{rainTotal}</h3>
              <p className="card-desc">mm</p>
            </Card>
            <Card className="info-card">
              <p className="card-label">Năng suất dự báo</p>
              <h3 className="card-value text-amber-700">
                {fmt.format(data.yieldAvg)}
              </h3>
              <p className="card-desc">tấn/ha</p>
            </Card>
          </section>

          {/* Map Panel */}
          <section id="mapPanel" className="map-panel">
            <Card>
              <div className="card-header">
                <h3>Bản đồ vùng/lô chè & lớp rủi ro</h3>
                <Space>
                  <div className="time-slider">
                    <span>Thời gian</span>
                    <Slider
                      min={0}
                      max={29}
                      value={timeIndex}
                      onChange={handleTimeSliderChange}
                      style={{ width: 120 }}
                    />
                    <span className="time-label">
                      {data.days[timeIndex]?.toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleDrawAOI}
                    className={isDrawing ? "active-draw" : ""}
                  >
                    Vẽ AOI
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendFCM}
                    disabled={!isDrawing}
                  >
                    Gửi FCM
                  </Button>
                </Space>
              </div>
              <div ref={mapContainer} className="map-container" />
              <div className="layer-controls">
                <Checkbox
                  checked={layerVisibility["tea-regions"]}
                  onChange={(e) =>
                    handleLayerToggle("tea-regions", e.target.checked)
                  }
                >
                  Vùng chè
                </Checkbox>
                <Checkbox
                  checked={layerVisibility["tea-plots"]}
                  onChange={(e) =>
                    handleLayerToggle("tea-plots", e.target.checked)
                  }
                >
                  Lô chè
                </Checkbox>
                <Checkbox
                  checked={layerVisibility["risk-heat"]}
                  onChange={(e) =>
                    handleLayerToggle("risk-heat", e.target.checked)
                  }
                >
                  Rủi ro
                </Checkbox>
                <Checkbox
                  checked={layerVisibility["events"]}
                  onChange={(e) =>
                    handleLayerToggle("events", e.target.checked)
                  }
                >
                  Sự kiện
                </Checkbox>
              </div>
            </Card>
          </section>

          {/* Charts Section */}
          <section id="indicesPanel" className="charts-section">
            <div className="chart-main">
              <Card>
                <div className="card-header">
                  <h3>Chuỗi chỉ số NDVI / EVI / NDWI (30 ngày)</h3>
                  <span className="chart-source">
                    Nguồn: GEE (demo dữ liệu giả lập)
                  </span>
                </div>
                <canvas ref={chartIndicesRef} height="110" />
              </Card>
            </div>
            <div id="weatherPanel" className="chart-weather">
              <Card>
                <h3>Nhiệt độ – Lượng mưa (7 ngày)</h3>
                <canvas ref={chartWeatherRef} height="180" />
              </Card>
            </div>
          </section>

          {/* Logs & AOI Section */}
          <section id="logsPanel" className="logs-section">
            <div className="logs-table">
              <Card>
                <div className="card-header">
                  <h3>Nhật ký nông hộ gần đây</h3>
                  <Space>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExportCSV}
                    >
                      Xuất CSV
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExportPDF}
                    >
                      Xuất PDF
                    </Button>
                  </Space>
                </div>
                <Table
                  dataSource={data.logs}
                  columns={logColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </div>
            <div id="aoiPanel" className="aoi-list">
              <Card>
                <h3>Khuyến cáo vùng (AOI)</h3>
                <div className="aoi-items">
                  {aoiItems.map((aoi) => (
                    <div key={aoi.id} className="aoi-item">
                      <div className="aoi-info">
                        <div className="aoi-title">{aoi.id}</div>
                        <div className="aoi-meta">
                          {aoi.date} • <Tag color="green">{aoi.status}</Tag>
                        </div>
                        <div className="aoi-coords">
                          Mẫu tọa độ: {aoi.coords}
                        </div>
                      </div>
                      <Button size="small" icon={<EnvironmentOutlined />}>
                        Xem trên bản đồ
                      </Button>
                    </div>
                  ))}
                  {aoiItems.length === 0 && (
                    <div className="empty-aoi">Chưa có khuyến cáo nào</div>
                  )}
                </div>
              </Card>
            </div>
          </section>

          {/* Audit Section */}
          <section id="reportPanel" className="audit-section">
            <Card>
              <h3>Audit Log</h3>
              <Table
                dataSource={data.audits}
                columns={auditColumns}
                pagination={false}
                size="small"
              />
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Manager;

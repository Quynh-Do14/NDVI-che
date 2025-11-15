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
import { calculateBoundsAndCenter } from "../../common";

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
     vung: true,
     lo: true,
     diem: true,
     events: true
   })

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

  const fetchData = async () => {
    var center = [0, 0];

    const res = await fetch(
      "http://103.163.119.247:33612/dataGeoJson?tenbang=lo&where=userid=2",
      {
        method: "GET",
      }
    );
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    if (data) {
      const result = calculateBoundsAndCenter(data);

      center = result.center;
    }

    console.log("center", center);

    const map = new mapboxgl.Map({
      container: mapDivRef.current,
      style: "mapbox://styles/mapbox/standard-satellite",
      center: center,
      zoom: 12,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('lo', {
        type: 'geojson',
        data: 'http://103.163.119.247:33612/dataGeoJson?tenbang=lo&where=userid=2',
        promoteId: 'id'
      })
      map.addSource('diem', {
        type: 'geojson',
        data: 'http://103.163.119.247:33612/saubenhgeojson',
        cluster: true,
        clusterRadius: 40,
        clusterMaxZoom: 12,
        promoteId: 'id'
      })

      map.addLayer({
        id: 'lo-fill',
        type: 'fill',
        source: 'lo',
        paint: {
          "fill-color": [
            "match",
            ["get", "giong"],
            "Chè Tân Cương",
            "#A7F3D0",
            "Trà Shan Tuyết Cổ Thụ",
            "#FBCFE8",
            "Trà Mộc Châu",
            "#FDE68A",
            "Trà Cầu Đất",
            "#BFDBFE",
            "Trà Ô Long Lâm Đồng",
            "#DDD6FE",
            "Giống chè TRI777",
            "#FECACA",
            "Giống chè PH1",
            "#FCD34D",
            "Giống chè LDP1",
            "#F9A8D4",
            "Giống chè Shan",
            "#6EE7B7",
            "Giống chè Ô Long",
            "#C7D2FE",
            "Trà Xanh",
            "#86EFAC",
            "Trà Đen",
            "#A3A3A3",
            "Trà Ô Long chế biến",
            "#FBCFE8",
            "Trà Trắng",
            "#FAFAF5",
            "Trà Phổ Nhĩ",
            "#D6D3D1",
            "Trà ướp hương",
            "#FFE4E6",

            /* other */ "#E5E7EB",
          ],
          "fill-opacity": 0.9,
        },
      });
      // Viền lô (mảnh và hơi tối để nhìn ranh rõ khi zoom gần)
      map.addLayer({
        id: 'lo-outline',
        type: 'line',
        source: 'lo',
        paint: {
          'line-color': '#4A5568',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            0.3,
            14,
            0.8,
            18,
            1.4
          ],
          'line-opacity': 0.7
        }
      })

      // Nhãn lô: chỉ hiện khi zoom đủ gần
      map.addLayer({
        id: 'lo-label',
        type: 'symbol',
        source: 'lo',
        // minzoom: 13,
        layout: {
          'text-field': ['coalesce', ['get', 'tenlo'], 'Lô'],
          // 'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 17, 13],
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#2D3748',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        }
      })

      // Chấm tròn
      map.addLayer({
        id: 'diem-point',
        type: 'circle',
        source: 'diem',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            4,
            14,
            6,
            18,
            8
          ],
          'circle-color': '#3B82F6', // xanh lam
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1.2,
          'circle-opacity': 0.9
        }
      })

      // Nhãn tên điểm
      map.addLayer({
        id: 'diem-label',
        type: 'symbol',
        source: 'diem',
        layout: {
          'text-field': ['get', 'ngay'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 10, 11, 16, 14],
          'text-offset': [0, 1.2],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#1E3A8A',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1
        }
      })

      // Tạo 1 popup dùng lại
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '320px'
      })

      // Helper nhỏ
      const safe = (v, fallback = '—') =>
        v === null || v === undefined || v === '' ? fallback : v

      // ====== LÔ (polygon) ======
      map.on(
        'mouseenter',
        'lo-fill',
        () => (map.getCanvas().style.cursor = 'pointer')
      )
      map.on('mouseleave', 'lo-fill', () => (map.getCanvas().style.cursor = ''))

      map.on('click', 'lo-fill', e => {
        const f = e.features?.[0]
        if (!f) return
        const p = f.properties || {}
        const html = `
    <div style="font: 13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
      <div style="font-weight:600; margin-bottom:4px;padding-top: 20px;">${safe(
        p.tenlo,
        'Lô'
      )}</div>
      <div><b>Giống:</b> ${safe(p.giong)}</div>
      <div><b>Diện tích (ha):</b> ${safe(p.dientichlo)}</div>
      <div style="margin-top:6px; color:#64748B">ID: ${safe(p.idlo)}</div>
    </div>
  `
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map)
      })

      // ====== ĐIỂM (point) ======
      map.on(
        'mouseenter',
        'diem-point',
        () => (map.getCanvas().style.cursor = 'pointer')
      )
      map.on(
        'mouseleave',
        'diem-point',
        () => (map.getCanvas().style.cursor = '')
      )

      map.on('click', 'diem-point', e => {
        const f = e.features?.[0]
        if (!f) return
        const p = f.properties || {}

        // Nếu đây là 1 cluster: zoom nở cụm thay vì popup
        if (p && ('cluster' in p || 'point_count' in p || 'cluster_id' in p)) {
          const source = map.getSource('diem')
          const clusterId = p.cluster_id
          if (
            source &&
            typeof source.getClusterExpansionZoom === 'function' &&
            clusterId !== undefined
          ) {
            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return
              map.easeTo({ center: f.geometry.coordinates, zoom })
            })
            return
          }
        }

        // Điểm lẻ: hiển thị popup
        const html = `
    <div style="font: 13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
      <div style="font-weight:600;margin-bottom:4px;padding-top: 20px;">Báo cáo sâu bệnh</div>
      <div><b>Toạ độ:</b> ${f.geometry?.coordinates?.[1]?.toFixed?.(6)}, ${f.geometry?.coordinates?.[0]?.toFixed?.(6)}</div>
        <div><b>Ngày:</b> ${p.ngay}</div>
    <div><b>Mức độ:</b> ${p.mucdo}</div>
    <div><b>Trạng thái:</b> ${p.trangthai}</div>
    <div><b>Mô tả:</b> ${p.mota}</div>
      <div style="margin-top:6px; color:#64748B">ID: ${safe(p.idsaubenh)}</div>
    </div>
  `
        popup
          .setLngLat(e.lngLat) // hoặc dùng f.geometry.coordinates cho anchor tuyệt đối
          .setHTML(html)
          .addTo(map)
      })
    })


    return () => map.remove();
  };

  useEffect(() => {
    fetchData();
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
  const handleLayerToggle = (layer, checked) => {
    setLayerVisibility(prev => ({ ...prev, [layer]: checked }))

    if (!mapRef.current) return

    // Bật/tắt tất cả layer con tương ứng (fill, outline, label, extrude...)
    const layerGroups = {
      lo: ['lo-fill', 'lo-outline', 'lo-label'],
      diem: ['diem-point', 'diem-label']
    }

    const targetLayers = layerGroups[layer] || [layer]

    targetLayers.forEach(id => {
      if (mapRef.current.getLayer(id)) {
        mapRef.current.setLayoutProperty(
          id,
          'visibility',
          checked ? 'visible' : 'none'
        )
      }
    })
  }

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
          <h1>Giám sát chè</h1>
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
                  checked={layerVisibility['lo']}
                    onChange={e => handleLayerToggle('lo', e.target.checked)}
                />
                Lô chè của tôi
              </label>
              {/* <label>
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
              </label> */}
              <label>
                <input
                  type="checkbox"
                 checked={layerVisibility['diem']}
                    onChange={e => handleLayerToggle('diem', e.target.checked)}
                />
                Sự cố hiện trường
              </label>
            </div>
            {/* <div className="control">
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
            </div> */}
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

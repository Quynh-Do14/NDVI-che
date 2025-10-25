import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './Farmer.css';

// Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoibmdvY3R0ZCIsImEiOiJjbWJibmlod3MwMmluMnFyMG1xMWt0dTdrIn0.ok5SgmXGrHFLeMPf-OG5_w';

// Sample data (giả lập)
const plots = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'P01', name: 'Lô P01', area: 0.8, ndvi: 0.72 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [105.94, 20.26], [105.943, 20.26], [105.943, 20.258],
          [105.94, 20.258], [105.94, 20.26]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'P02', name: 'Lô P02', area: 1.1, ndvi: 0.61 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [105.952, 20.255], [105.956, 20.255], [105.956, 20.252],
          [105.952, 20.252], [105.952, 20.255]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'P03', name: 'Lô P03', area: 0.6, ndvi: 0.45 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [105.962, 20.262], [105.966, 20.262], [105.966, 20.259],
          [105.962, 20.259], [105.962, 20.262]
        ]]
      }
    }
  ]
};

// Generate NDVI grid
const generateNDVIGrid = () => {
  const ndviGrid = { type: 'FeatureCollection', features: [] };
  const x0 = 105.935, y0 = 20.248, cols = 8, rows = 7, dx = 0.0045, dy = 0.0045;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x1 = x0 + c * dx, y1 = y0 + r * dy, x2 = x1 + dx, y2 = y1 + dy;
      const ndvi = +(0.35 + Math.random() * 0.45).toFixed(2);
      ndviGrid.features.push({
        type: 'Feature',
        properties: { ndvi },
        geometry: {
          type: 'Polygon',
          coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]]
        }
      });
    }
  }
  return ndviGrid;
};

const advisories = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        title: 'Khuyến cáo tưới nhẹ',
        level: 'info',
        msg: 'Duy trì 5–7 mm/ngày trong 3 ngày tới.'
      },
      geometry: { type: 'Point', coordinates: [105.948, 20.256] }
    }
  ]
};

const incidents = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        type: 'sau-benh',
        desc: 'Phát hiện bọ xít nhỏ, lá chấm vàng',
        plot: 'P02'
      },
      geometry: { type: 'Point', coordinates: [105.954, 20.2535] }
    }
  ]
};

// Weather data generator
const generateWeatherData = () => {
  return Array.from({ length: 7 }).map((_, i) => ({
    day: new Date(Date.now() + i * 86400000).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    }),
    tmin: Math.round(18 + Math.random() * 3),
    tmax: Math.round(26 + Math.random() * 4),
    rain: +(Math.random() * 12).toFixed(1),
    rh: Math.round(70 + Math.random() * 15),
    gdd: Math.round(9 + Math.random() * 6),
    eto: +(3 + Math.random() * 1.2).toFixed(1)
  }));
};

// Utility functions
const labelWork = (k) => {
  const labels = {
    'tuoi': 'Tưới',
    'bon': 'Bón phân',
    'phun': 'Phun thuốc',
    'thu-hai': 'Thu hái'
  };
  return labels[k] || k;
};

const labelIncident = (k) => {
  const labels = {
    'sau-benh': 'Sâu bệnh',
    'ung': 'Úng',
    'han': 'Hạn',
    'suong-muoi': 'Sương muối',
    'khac': 'Khác'
  };
  return labels[k] || k;
};

const formatNumber = (n) => n.toLocaleString('vi-VN');

export default function Farmer() {
  const mapRef = useRef(null);
  const mapDivRef = useRef(null);

  // State
  const [activeTab, setActiveTab] = useState('log');
  const [layerVisibility, setLayerVisibility] = useState({
    plots: true,
    ndvi: true,
    alerts: true,
    incidents: true
  });
  const [selectedPlot, setSelectedPlot] = useState('');
  const [kpiData, setKpiData] = useState({
    ndvi: '—',
    rain: '—',
    gdd: '—'
  });
  const [weatherData, setWeatherData] = useState([]);
  const [currentWeather, setCurrentWeather] = useState('—');
  const [userData, setUserData] = useState({
    logs: [],
    incidents: [],
    costTotal: 0
  });

  // Form states
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'tuoi',
    cost: 0,
    plot: '',
    note: '',
    gps: ''
  });

  const [incidentForm, setIncidentForm] = useState({
    type: 'sau-benh',
    plot: '',
    desc: '',
    gps: ''
  });

  // Initialize data
  useEffect(() => {
    const weather = generateWeatherData();
    setWeatherData(weather);
    setCurrentWeather(`${weather[0].tmin}–${weather[0].tmax}°C, ${weather[0].rain}mm`);
    
    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const gpsText = `${longitude.toFixed(5)}, ${latitude.toFixed(5)}`;
        setLogForm(prev => ({ ...prev, gps: gpsText }));
        setIncidentForm(prev => ({ ...prev, gps: gpsText }));
      });
    }
  }, []);

  // Map initialization
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapDivRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [105.95, 20.25],
      zoom: 11
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      const ndviGrid = generateNDVIGrid();

      // Add sources
      map.addSource('plots', { type: 'geojson', data: plots });
      map.addSource('ndvi', { type: 'geojson', data: ndviGrid });
      map.addSource('advisories', { type: 'geojson', data: advisories });
      map.addSource('incidents', { type: 'geojson', data: incidents });

      // Add layers
      map.addLayer({
        id: 'plots-fill',
        type: 'fill',
        source: 'plots',
        paint: {
          'fill-color': ['interpolate', ['linear'], ['get', 'ndvi'], 0.3, '#fef3c7', 0.5, '#a7f3d0', 0.7, '#34d399'],
          'fill-opacity': 0.6
        }
      });

      map.addLayer({
        id: 'plots-line',
        type: 'line',
        source: 'plots',
        paint: {
          'line-color': '#065f46',
          'line-width': 1.2
        }
      });

      map.addLayer({
        id: 'ndvi-fill',
        type: 'fill',
        source: 'ndvi',
        paint: {
          'fill-color': ['interpolate', ['linear'], ['get', 'ndvi'], 0.3, '#fee2e2', 0.45, '#fde68a', 0.6, '#86efac', 0.75, '#22c55e'],
          'fill-opacity': 0.35
        }
      });

      map.addLayer({
        id: 'advisories-sym',
        type: 'symbol',
        source: 'advisories',
        layout: {
          'icon-image': 'marker-15',
          'icon-size': 1.2,
          'text-field': ['get', 'title'],
          'text-size': 12,
          'text-offset': [0, 1.2],
          'text-anchor': 'top'
        },
        paint: { 'text-color': '#1f2937' }
      });

      map.addLayer({
        id: 'incidents-sym',
        type: 'symbol',
        source: 'incidents',
        layout: {
          'icon-image': 'marker-15',
          'icon-size': 1.2,
          'text-field': ['get', 'type'],
          'text-size': 12,
          'text-offset': [0, 1.2],
          'text-anchor': 'top'
        },
        paint: { 'text-color': '#991b1b' }
      });

      // Plot click handler
      map.on('click', 'plots-fill', (e) => {
        const f = e.features[0];
        const { id, name, area, ndvi } = f.properties;
        
        const html = `
          <strong>${name}</strong><br/>
          Mã: ${id} · Diện tích: ${area} ha<br/>
          NDVI hiện tại: <b>${ndvi}</b><br/>
          <button id="btn-log-${id}" class="map-popup-btn">Ghi nhật ký</button>
        `;
        
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);

        // Update KPI
        setKpiData(prev => ({ ...prev, ndvi }));
        setSelectedPlot(id);
        setLogForm(prev => ({ ...prev, plot: id }));
        setIncidentForm(prev => ({ ...prev, plot: id }));

        // Add button handler
        setTimeout(() => {
          const btn = document.getElementById(`btn-log-${id}`);
          if (btn) {
            btn.onclick = () => {
              setActiveTab('log');
              document.getElementById('log-note')?.focus();
            };
          }
        }, 50);
      });

      // Fit bounds to plots
      const coordinates = plots.features.flatMap(f => f.geometry.coordinates[0]);
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

    const visibility = (visible) => visible ? 'visible' : 'none';

    map.setLayoutProperty('plots-line', 'visibility', visibility(layerVisibility.plots));
    map.setLayoutProperty('plots-fill', 'visibility', visibility(layerVisibility.plots));
    map.setLayoutProperty('ndvi-fill', 'visibility', visibility(layerVisibility.ndvi));
    map.setLayoutProperty('advisories-sym', 'visibility', visibility(layerVisibility.alerts));
    map.setLayoutProperty('incidents-sym', 'visibility', visibility(layerVisibility.incidents));
  }, [layerVisibility]);

  // Handlers
  const handleLayerToggle = (layer) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const handleLogSubmit = (e) => {
    e.preventDefault();
    const newLog = {
      ...logForm,
      id: Date.now(),
      timestamp: new Date().toLocaleString('vi-VN')
    };
    
    setUserData(prev => ({
      ...prev,
      logs: [newLog, ...prev.logs],
      costTotal: prev.costTotal + (parseInt(logForm.cost) || 0)
    }));

    setLogForm({
      date: new Date().toISOString().split('T')[0],
      type: 'tuoi',
      cost: 0,
      plot: selectedPlot || '',
      note: '',
      gps: logForm.gps
    });
  };

  const handleIncidentSubmit = (e) => {
    e.preventDefault();
    const newIncident = {
      ...incidentForm,
      id: Date.now(),
      timestamp: new Date().toLocaleString('vi-VN')
    };
    
    setUserData(prev => ({
      ...prev,
      incidents: [newIncident, ...prev.incidents]
    }));

    setIncidentForm({
      type: 'sau-benh',
      plot: selectedPlot || '',
      desc: '',
      gps: incidentForm.gps
    });
  };

  const handleInputChange = (form, setForm) => (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Calculate statistics
  const totalArea = plots.features.reduce((sum, plot) => sum + (plot.properties.area || 0), 0);
  const costPerHa = totalArea ? Math.round(userData.costTotal / totalArea) : 0;

  // Advice data (giả lập)
  const adviceData = [
    {
      title: 'Tưới nhẹ 5–7 mm',
      time: '3 ngày tới',
      plot: 'P01',
      note: 'Đảm bảo ẩm mặt đất, tránh úng'
    },
    {
      title: 'Bón NPK 16-16-8',
      time: 'Tuần này',
      plot: 'P02',
      note: 'Liều 150–200 kg/ha, sau mưa 1–2 ngày'
    }
  ];

  return (
    <div className="farmer-app">
      <header>
        <div className="brand">
          <div className="logo" aria-hidden="true"></div>
          <h1>Giám sát chè – Giao diện Nông hộ</h1>
        </div>
        <div className="actions">
          <span className="pill">
            ☁️ Thời tiết: <strong>{currentWeather}</strong>
          </span>
          <span className="pill">
            🔔 <span>{userData.incidents.length}</span>
          </span>
          <span className="pill">👩‍🌾 Nguyễn Thị A</span>
        </div>
      </header>

      <div className="layout">
        <div className="map-container">
          <div ref={mapDivRef} id="map"></div>
          <div className="controls">
            <div className="control">
              <h3>Lớp dữ liệu</h3>
              <label>
                <input
                  type="checkbox"
                  checked={layerVisibility.plots}
                  onChange={() => handleLayerToggle('plots')}
                />
                Lô chè của tôi
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layerVisibility.ndvi}
                  onChange={() => handleLayerToggle('ndvi')}
                />
                NDVI (giả lập)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layerVisibility.alerts}
                  onChange={() => handleLayerToggle('alerts')}
                />
                Khuyến cáo
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layerVisibility.incidents}
                  onChange={() => handleLayerToggle('incidents')}
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
        </div>

        <div className="sidebar">
          <div className="card">
            <div className="tabs" role="tablist">
              {[
                { id: 'log', label: '📝 Nhật ký' },
                { id: 'advice', label: '📣 Khuyến cáo & Thời tiết' },
                { id: 'report', label: '🚩 Báo cáo hiện trường' },
                { id: 'stats', label: '💰 Chi phí & Thống kê' }
              ].map(tab => (
                <div
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                >
                  {tab.label}
                </div>
              ))}
            </div>

            {/* Log Tab */}
            <div id="tab-log" className={`tab-content ${activeTab === 'log' ? 'active' : ''}`}>
              <form id="form-log" onSubmit={handleLogSubmit}>
                <div className="row">
                  <div>
                    <label>Ngày thực hiện</label>
                    <input
                      type="date"
                      name="date"
                      value={logForm.date}
                      onChange={handleInputChange(logForm, setLogForm)}
                      required
                    />
                  </div>
                  <div>
                    <label>Loại công việc</label>
                    <select
                      name="type"
                      value={logForm.type}
                      onChange={handleInputChange(logForm, setLogForm)}
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
                    <label>Chi phí (VNĐ)</label>
                    <input
                      type="number"
                      name="cost"
                      value={logForm.cost}
                      onChange={handleInputChange(logForm, setLogForm)}
                      min="0"
                      step="1000"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label>Lô chè</label>
                    <select
                      name="plot"
                      value={logForm.plot}
                      onChange={handleInputChange(logForm, setLogForm)}
                    >
                      <option value="">Chọn lô</option>
                      {plots.features.map(plot => (
                        <option key={plot.properties.id} value={plot.properties.id}>
                          {plot.properties.id} – {plot.properties.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <label>Ghi chú</label>
                <textarea
                  name="note"
                  value={logForm.note}
                  onChange={handleInputChange(logForm, setLogForm)}
                  placeholder="Mô tả chi tiết công việc..."
                  id="log-note"
                />
                <div className="row">
                  <div>
                    <label>Ảnh hiện trường</label>
                    <input type="file" accept="image/*" />
                  </div>
                  <div>
                    <label>Vị trí GPS (tự động)</label>
                    <input
                      type="text"
                      value={logForm.gps}
                      placeholder="—"
                      readOnly
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn" type="submit">Lưu nhật ký</button>
                  <button className="btn ghost" type="button"
                    onClick={() => setLogForm({
                      date: new Date().toISOString().split('T')[0],
                      type: 'tuoi',
                      cost: 0,
                      plot: selectedPlot || '',
                      note: '',
                      gps: logForm.gps
                    })}
                  >
                    Xóa
                  </button>
                </div>
              </form>
              <hr />
              <div className="list" id="log-list">
                {userData.logs.map(log => (
                  <div key={log.id} className="item">
                    <h4>{log.date} · {labelWork(log.type)} · Lô {log.plot}</h4>
                    <p>{log.note || ''}</p>
                    <p>Chi phí: {formatNumber(parseInt(log.cost) || 0)} · GPS: {log.gps || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Advice Tab */}
            <div id="tab-advice" className={`tab-content ${activeTab === 'advice' ? 'active' : ''}`}>
              <div className="list" id="advice-list">
                {adviceData.map((advice, index) => (
                  <div key={index} className="item">
                    <h4>📣 {advice.title} · {advice.time}</h4>
                    <p>Lô: {advice.plot} · {advice.note}</p>
                  </div>
                ))}
              </div>
              <hr />
              <div className="list" id="weather-list">
                {weatherData.map((weather, index) => (
                  <div key={index} className="item">
                    <h4>☁️ {weather.day}</h4>
                    <p>
                      Tmin/Tmax: {weather.tmin}–{weather.tmax}°C · Mưa: {weather.rain}mm · 
                      RH: {weather.rh}% · GDD: {weather.gdd} · ETo: {weather.eto}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Tab */}
            <div id="tab-report" className={`tab-content ${activeTab === 'report' ? 'active' : ''}`}>
              <form id="form-incident" onSubmit={handleIncidentSubmit}>
                <div className="row">
                  <div>
                    <label>Loại sự cố</label>
                    <select
                      name="type"
                      value={incidentForm.type}
                      onChange={handleInputChange(incidentForm, setIncidentForm)}
                      required
                    >
                      <option value="sau-benh">Sâu bệnh</option>
                      <option value="ung">Úng</option>
                      <option value="han">Hạn</option>
                      <option value="suong-muoi">Sương muối</option>
                      <option value="khac">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label>Lô chè</label>
                    <select
                      name="plot"
                      value={incidentForm.plot}
                      onChange={handleInputChange(incidentForm, setIncidentForm)}
                    >
                      <option value="">Chọn lô</option>
                      {plots.features.map(plot => (
                        <option key={plot.properties.id} value={plot.properties.id}>
                          {plot.properties.id} – {plot.properties.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <label>Mô tả</label>
                <textarea
                  name="desc"
                  value={incidentForm.desc}
                  onChange={handleInputChange(incidentForm, setIncidentForm)}
                  placeholder="Triệu chứng, mức độ..."
                />
                <div className="row">
                  <div>
                    <label>Ảnh hiện trường</label>
                    <input type="file" accept="image/*" />
                  </div>
                  <div>
                    <label>Tọa độ GPS</label>
                    <input
                      type="text"
                      value={incidentForm.gps}
                      placeholder="—"
                      readOnly
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn" type="submit">Gửi báo cáo</button>
                  <button className="btn ghost" type="button"
                    onClick={() => setIncidentForm({
                      type: 'sau-benh',
                      plot: selectedPlot || '',
                      desc: '',
                      gps: incidentForm.gps
                    })}
                  >
                    Xóa
                  </button>
                </div>
              </form>
              <hr />
              <div className="list" id="incident-list">
                {userData.incidents.map(incident => (
                  <div key={incident.id} className="item">
                    <h4>{incident.timestamp} · {labelIncident(incident.type)} · Lô {incident.plot}</h4>
                    <p>{incident.desc || ''}</p>
                    <p>GPS: {incident.gps || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Tab */}
            <div id="tab-stats" className={`tab-content ${activeTab === 'stats' ? 'active' : ''}`}>
              <div className="kpi">
                <div className="metric">
                  <h5>Tổng chi phí</h5>
                  <div className="val">{formatNumber(userData.costTotal)}</div>
                </div>
                <div className="metric">
                  <h5>Số nhật ký</h5>
                  <div className="val">{userData.logs.length}</div>
                </div>
                <div className="metric">
                  <h5>Chi phí/ha</h5>
                  <div className="val">{formatNumber(costPerHa)}</div>
                </div>
              </div>
              <div className="chart-note">
                (Biểu đồ chỉ minh họa, kết nối backend sẽ vẽ động)
              </div>
            </div>
          </div>
          <footer>
            © 2025 – Nền tảng giám sát sinh trưởng chè (giao diện mẫu nông hộ)
          </footer>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "./Researcher.css";

// Mapbox token
mapboxgl.accessToken =
  "pk.eyJ1IjoibmdvY3R0ZCIsImEiOiJjbWJibmlod3MwMmluMnFyMG1xMWt0dTdrIn0.ok5SgmXGrHFLeMPf-OG5_w";

// Dữ liệu giả lập
const regions = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "RG01", name: "Trại 1" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.7663, 21.6153],
            [105.792, 21.6153],
            [105.792, 21.6325],
            [105.7663, 21.6325],
            [105.7663, 21.6153],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "RG02", name: "Xóm Bãi" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.7925, 21.6153],
            [105.8155, 21.6153],
            [105.8155, 21.6325],
            [105.7925, 21.6325],
            [105.7925, 21.6153],
          ],
        ],
      },
    },
  ],
};

const plots = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { pid: "P-001", region: "RG01" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.769, 21.617],
            [105.775, 21.617],
            [105.775, 21.6215],
            [105.769, 21.6215],
            [105.769, 21.617],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { pid: "P-002", region: "RG01" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.776, 21.617],
            [105.782, 21.617],
            [105.782, 21.6215],
            [105.776, 21.6215],
            [105.776, 21.617],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { pid: "P-003", region: "RG01" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.769, 21.622],
            [105.775, 21.622],
            [105.775, 21.6265],
            [105.769, 21.6265],
            [105.769, 21.622],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { pid: "P-004", region: "RG02" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.795, 21.617],
            [105.8005, 21.617],
            [105.8005, 21.6215],
            [105.795, 21.6215],
            [105.795, 21.617],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { pid: "P-005", region: "RG02" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.8012, 21.617],
            [105.8067, 21.617],
            [105.8067, 21.6215],
            [105.8012, 21.6215],
            [105.8012, 21.617],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { pid: "P-006", region: "RG02" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [105.8072, 21.617],
            [105.8127, 21.617],
            [105.8127, 21.6215],
            [105.8072, 21.6215],
            [105.8072, 21.617],
          ],
        ],
      },
    },
  ],
};

const months = [
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
];
const idxNames = ["NDVI", "EVI", "NDWI", "LAI", "CIRE"];

// Utility functions
function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function synthIndex(ix, m, pid) {
  const seed = hashCode(ix + m + pid);
  const rand = mulberry32(seed)();
  if (ix === "LAI") return +(1 + rand * 4).toFixed(2);
  if (ix === "CIRE") return +(0.5 + rand * 1.5).toFixed(2);
  return +(0.2 + rand * 0.7).toFixed(2);
}

function turfBbox(fc) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  (fc.type === "FeatureCollection" ? fc.features : [fc]).forEach((f) => {
    const coords =
      f.geometry.type === "Polygon"
        ? f.geometry.coordinates[0]
        : f.geometry.type === "MultiPolygon"
        ? f.geometry.coordinates.flat(1)[0]
        : [f.geometry.coordinates];
    coords.forEach((c) => {
      const x = c[0],
        y = c[1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });
  });
  return [
    [minX, minY],
    [maxX, maxY],
  ];
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Researcher() {
  const mapRef = useRef(null);
  const mapDivRef = useRef(null);

  // State
  const [region, setRegion] = useState("all");
  const [plot, setPlot] = useState("all");
  const [indexName, setIndexName] = useState("NDVI");
  const [threshold, setThreshold] = useState(0.4);
  const [period, setPeriod] = useState("2025-06");
  const [anon, setAnon] = useState(true);
  const [dateFrom, setDateFrom] = useState("2025-05-01");
  const [dateTo, setDateTo] = useState("2025-10-01");
  const [copyMsg, setCopyMsg] = useState(false);
  const [plotOptions, setPlotOptions] = useState([]);

  // Time series data
  const timeSeries = useRef({});
  const centroids = useRef(null);

  // Initialize data
  useEffect(() => {
    // Calculate centroids
    centroids.current = {
      type: "FeatureCollection",
      features: plots.features.map((f) => {
        const xs = f.geometry.coordinates[0].map((c) => c[0]);
        const ys = f.geometry.coordinates[0].map((c) => c[1]);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        return {
          type: "Feature",
          properties: { pid: f.properties.pid, region: f.properties.region },
          geometry: { type: "Point", coordinates: [cx, cy] },
        };
      }),
    };

    // Generate time series
    const t = {};
    plots.features.forEach((f) => {
      const pid = f.properties.pid;
      t[pid] = {};
      idxNames.forEach((ix) => {
        t[pid][ix] = {};
        months.forEach((m) => {
          t[pid][ix][m] = synthIndex(ix, m, pid);
        });
      });
    });
    timeSeries.current = t;

    // Initialize plot options
    rebuildPlotOptions("all");
  }, []);

  // Map initialization
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapDivRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [105.79, 21.623],
      zoom: 12.6,
      pitch: 0,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );
    map.addControl(new mapboxgl.ScaleControl());

    map.on("load", () => {
      // Add sources
      map.addSource("regions", { type: "geojson", data: regions });
      map.addSource("plots", { type: "geojson", data: plots });
      map.addSource("centroids", { type: "geojson", data: centroids.current });

      // Add layers
      map.addLayer({
        id: "regions-fill",
        type: "fill",
        source: "regions",
        paint: { "fill-color": "#c7d2fe", "fill-opacity": 0.35 },
      });
      map.addLayer({
        id: "regions-line",
        type: "line",
        source: "regions",
        paint: { "line-color": "#6366f1", "line-width": 1.2 },
      });

      map.addLayer({
        id: "plots-fill",
        type: "fill",
        source: "plots",
        paint: { "fill-color": ["get", "_color"], "fill-opacity": 0.65 },
      });
      map.addLayer({
        id: "plots-line",
        type: "line",
        source: "plots",
        paint: { "line-color": "#334155", "line-width": 0.8 },
      });

      map.addLayer({
        id: "centroids",
        type: "circle",
        source: "centroids",
        paint: {
          "circle-radius": 4,
          "circle-color": "#2563eb",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1,
        },
      });

      map.addLayer({
        id: "plots-label",
        type: "symbol",
        source: "centroids",
        layout: {
          "text-field": ["get", "pid"],
          "text-size": 11,
          "text-offset": [0, 1.2],
        },
        paint: { "text-color": "#334155" },
      });

      // Click event for plots
      map.on("click", "plots-fill", (e) => {
        const f = e.features[0];
        const pid = f.properties.pid;
        const rg = f.properties.region;
        const val = timeSeries.current[pid][indexName][period];

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `
            <div style="font-weight:600">Lô: ${maskPID(pid)}</div>
            <div>Vùng: ${rg}</div>
            <div>${indexName} (${period}): <b>${val}</b></div>
          `
          )
          .addTo(map);
      });

      // Hover effects
      map.on(
        "mouseenter",
        "plots-fill",
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        "plots-fill",
        () => (map.getCanvas().style.cursor = "")
      );

      applyFiltersAndStyle();
    });

    return () => map.remove();
  }, []);

  // Update map when filters change
  useEffect(() => {
    applyFiltersAndStyle();
  }, [region, plot, indexName, threshold, period]);

  // Rebuild plot options when region changes
  const rebuildPlotOptions = (regionId) => {
    const list = plots.features.filter((f) =>
      regionId === "all" ? true : f.properties.region === regionId
    );
    setPlotOptions(list);
    setPlot("all");
  };

  const handleRegionChange = (e) => {
    const value = e.target.value;
    setRegion(value);
    rebuildPlotOptions(value);
    fitRegion(value);
  };

  const fitRegion = (regionId = region) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (regionId === "all") {
      const bbox = turfBbox(regions);
      map.fitBounds(bbox, { padding: 30, duration: 500 });
    } else {
      const feat = regions.features.find((r) => r.properties.id === regionId);
      const bbox = turfBbox(feat);
      map.fitBounds(bbox, { padding: 30, duration: 500 });
    }
  };

  const applyFiltersAndStyle = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const filtered = {
      type: "FeatureCollection",
      features: plots.features
        .filter((f) => {
          const okR = region === "all" ? true : f.properties.region === region;
          const okP = plot === "all" ? true : f.properties.pid === plot;
          return okR && okP;
        })
        .map((f) => {
          const pid = f.properties.pid;
          const v = normIndex(
            indexName,
            timeSeries.current[pid][indexName][period]
          );
          const color = v >= threshold ? "#dcfce7" : "#fee2e2";
          return {
            ...f,
            properties: { ...f.properties, _color: color, _value: v },
          };
        }),
    };

    map.getSource("plots")?.setData(filtered);

    // Show/hide labels
    const showLabel = plot === "all" ? "visible" : "none";
    map.setLayoutProperty("plots-label", "visibility", showLabel);
  };

  const normIndex = (ix, val) => {
    if (ix === "LAI") return Math.max(0, Math.min(1, (val - 1) / 4));
    if (ix === "CIRE") return Math.max(0, Math.min(1, (val - 0.5) / 1.5));
    return val;
  };

  const shiftPeriod = (step) => {
    const [y, m] = period.split("-").map((x) => +x);
    let newM = m + step;
    let newY = y;

    if (newM < 1) {
      newM = 12;
      newY--;
    } else if (newM > 12) {
      newM = 1;
      newY++;
    }

    const newPeriod = `${newY}-${String(newM).padStart(2, "0")}`;
    setPeriod(newPeriod);
  };

  const maskPID = (pid) => {
    return anon ? `ANON-${pid.slice(-3)}` : pid;
  };

  const toggleLayer = (key) => {
    const map = mapRef.current;
    if (!map) return;

    const visibility = {
      regions: ["regions-fill", "regions-line"],
      plots: ["plots-fill", "plots-line"],
      centroids: ["centroids"],
      labels: ["plots-label"],
    }[key];

    if (!visibility) return;

    visibility.forEach((id) => {
      const v = map.getLayoutProperty(id, "visibility");
      map.setLayoutProperty(
        id,
        "visibility",
        v === "none" ? "visible" : "none"
      );
    });
  };

  const exportCSV = () => {
    const rows = [
      [
        "plot_id_anonymous",
        "plot_id_real",
        "region",
        "index",
        "period",
        "value",
      ],
    ];

    plots.features
      .filter(
        (f) =>
          (region === "all" || f.properties.region === region) &&
          (plot === "all" || f.properties.pid === plot)
      )
      .forEach((f) => {
        const pid = f.properties.pid;
        const rg = f.properties.region;
        const val = timeSeries.current[pid][indexName][period];
        rows.push([`ANON-${pid.slice(-3)}`, pid, rg, indexName, period, val]);
      });

    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadFile(csv, `tea_${indexName}_${period}.csv`, "text/csv");
  };

  const exportGeoJSON = () => {
    const data = {
      type: "FeatureCollection",
      features: plots.features
        .filter(
          (f) =>
            (region === "all" || f.properties.region === region) &&
            (plot === "all" || f.properties.pid === plot)
        )
        .map((f) => {
          const pid = f.properties.pid;
          const rg = f.properties.region;
          const raw = timeSeries.current[pid][indexName][period];
          return {
            type: "Feature",
            properties: {
              plot_id: pid,
              plot_id_anonymous: `ANON-${pid.slice(-3)}`,
              region: rg,
              index: indexName,
              period: period,
              value: raw,
              meets_threshold: normIndex(indexName, raw) >= threshold,
            },
            geometry: f.geometry,
          };
        }),
    };

    downloadFile(
      JSON.stringify(data),
      `tea_${indexName}_${period}.geojson`,
      "application/geo+json"
    );
  };

  const copyAPI = () => {
    const url = `https://api.example.org/research/tea-index?index=${indexName}&period=${period}&region=${region}&plot=${plot}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyMsg(true);
      setTimeout(() => setCopyMsg(false), 1500);
    });
  };

  const analyzeData = () => {
    const feats = plots.features.filter((f) =>
      region === "all" ? true : f.properties.region === region
    );
    const vals = feats.map(
      (f) => timeSeries.current[f.properties.pid][indexName][period]
    );
    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
    alert(
      `Trung bình ${indexName} (${period})${
        region === "all" ? " toàn bộ" : " của " + region
      }: ${avg}`
    );
  };

  const filteredPlots = plots.features.filter(
    (f) =>
      (region === "all" || f.properties.region === region) &&
      (plot === "all" || f.properties.pid === plot)
  );

  return (
    <div className="app">
      <header>
        <div className="title">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" fill="#2563eb" />
            <path d="M21 12l-9 4.5-9-4.5" stroke="#60a5fa" stroke-width="1.2" />
            <path
              d="M21 16.5L12 21 3 16.5"
              stroke="#93c5fd"
              stroke-width="1.2"
            />
          </svg>
          <div>
            <div className="title-row">
              <h1>Giám sát sinh trưởng chè – Không gian nhà nghiên cứu</h1>
              {/* <span className='badge anonym' title='Dữ liệu đã ẩn danh'>
                Ẩn danh
              </span> */}
              {/* <span className="badge">Read‑only API</span> */}
            </div>
            <div className="hint">
              Truy cập dữ liệu ẩn danh, tải thống kê chỉ số GEE theo lô/vùng,
              xuất CSV/GeoJSON (demo, không gọi endpoint thật).
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={exportCSV}>
            Tải CSV
          </button>
          <button className="btn" onClick={exportGeoJSON}>
            Tải GeoJSON
          </button>
        </div>
      </header>

      <div className="container">
        <aside className="panel" id="filters">
          <h3>Bộ lọc & tham số</h3>

          <div className="group">
            <label>Vùng chè</label>
            <select
              id="selRegion"
              className="input"
              value={region}
              onChange={handleRegionChange}
            >
              <option value="all">Tất cả vùng</option>
              <option value="RG01">RG01 – Trại 1</option>
              <option value="RG02">RG02 – Xóm Bãi</option>
            </select>
          </div>

          <div className="group">
            <label>Lô chè</label>
            <select
              id="selPlot"
              className="input"
              value={plot}
              onChange={(e) => setPlot(e.target.value)}
            >
              <option value="all">Tất cả lô</option>
              {plotOptions.map((f) => (
                <option key={f.properties.pid} value={f.properties.pid}>
                  {f.properties.pid}
                </option>
              ))}
            </select>
          </div>

          <div className="group">
            <label>Chỉ số GEE</label>
            <select
              id="selIndex"
              className="input"
              value={indexName}
              onChange={(e) => setIndexName(e.target.value)}
            >
              {idxNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="group">
            <label>Khoảng thời gian</label>
            <input
              id="dateFrom"
              className="input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <div style={{ height: "6px" }}></div>
            <input
              id="dateTo"
              className="input"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="group">
            <label>
              Ngưỡng tô màu theo chỉ số (
              <span id="threshVal">{threshold.toFixed(2)}</span>)
            </label>
            <input
              id="threshold"
              className="range"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
          </div>

          {/* <div className="group checkbox">
            <div
              className={`switch ${anon ? "on" : ""}`}
              role="switch"
              aria-label="Chế độ ẩn danh"
              tabIndex="0"
              onClick={() => setAnon(!anon)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setAnon(!anon);
                }
              }}
            ></div>
            <div>
              <div style={{ fontWeight: "600" }}>Chế độ ẩn danh</div>
              <div className="hint">
                Ẩn tên hộ, mã lô thực; chỉ hiển thị ID giả lập.
              </div>
            </div>
          </div> */}

          <div className="group">
            <label>Tải dữ liệu</label>
            <div className="actions">
              <button className="btn" onClick={exportCSV}>
                Xuất CSV
              </button>
              <button className="btn" onClick={exportGeoJSON}>
                Xuất GeoJSON
              </button>
            </div>
            <div style={{ height: "8px" }}></div>
            <button
              className="btn ghost"
              onClick={copyAPI}
              title="Sao chép URL API chỉ‑đọc (demo)"
            >
              Copy API (read‑only)
            </button>
            <div
              id="copyMsg"
              className="hint"
              style={{ display: copyMsg ? "block" : "none", marginTop: "6px" }}
            >
              Đã sao chép URL ví dụ.
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border)",
              margin: "12px 0",
            }}
          />

          <div className="group">
            <label>Lớp hiển thị</label>
            <div className="layer-controls">
              <button
                className="btn tool"
                onClick={() => toggleLayer("regions")}
              >
                Vùng
              </button>
              <button className="btn tool" onClick={() => toggleLayer("plots")}>
                Lô
              </button>
              <button
                className="btn tool"
                onClick={() => toggleLayer("centroids")}
              >
                Tâm lô
              </button>
              <button
                className="btn tool"
                onClick={() => toggleLayer("labels")}
              >
                Nhãn
              </button>
            </div>
          </div>

          <div className="hint">
            Lưu ý: Raster chỉ số được mô phỏng bằng tô màu theo ngưỡng cho lô
            chè.
          </div>
        </aside>

        <section className="main">
          <div className="mapwrap">
            <div ref={mapDivRef} id="map"></div>
            <div className="toolbar">
              <button className="tool" onClick={() => fitRegion()}>
                Fit toàn vùng
              </button>
              <button className="tool" onClick={() => shiftPeriod(-1)}>
                ◀ Tháng trước
              </button>
              <div className="tool period-display">
                <span className="hint">Kỳ:</span>
                <strong>{period}</strong>
              </div>
              <button className="tool" onClick={() => shiftPeriod(1)}>
                Tháng sau ▶
              </button>
            </div>
            <div className="legend" id="legend">
              <div>
                <strong>Chú giải (theo ngưỡng)</strong>
              </div>
              <div className="row">
                <span
                  className="swatch"
                  style={{ background: "#dcfce7" }}
                ></span>
                Chỉ số ≥ ngưỡng
              </div>
              <div className="row">
                <span
                  className="swatch"
                  style={{ background: "#fee2e2" }}
                ></span>
                Chỉ số &lt; ngưỡng
              </div>
            </div>
          </div>

          <div className="tablewrap">
            <div className="tablehead">
              <div className="table-title">
                <strong>Kết quả thống kê</strong>
                <span className="hint">(ẩn danh)</span>
              </div>
              <div className="table-actions">
                <button
                  className="btn"
                  onClick={() => {
                    applyFiltersAndStyle();
                  }}
                >
                  Làm mới
                </button>
                <button className="btn primary" onClick={analyzeData}>
                  Tính tóm tắt
                </button>
              </div>
            </div>
            <table className="table" id="resultTable">
              <thead>
                <tr>
                  <th>ID lô (ẩn danh)</th>
                  <th>Vùng</th>
                  <th>Chỉ số</th>
                  <th>Kỳ</th>
                  <th>Giá trị TB</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlots.map((f) => {
                  const pid = f.properties.pid;
                  const rg = f.properties.region;
                  const raw =
                    timeSeries.current[pid]?.[indexName]?.[period] || 0;
                  const v = normIndex(indexName, raw);
                  const status =
                    v >= threshold
                      ? "Đạt"
                      : v >= threshold - 0.05
                      ? "Cần theo dõi"
                      : "Thấp";
                  const pillClass =
                    v >= threshold
                      ? "pill"
                      : v >= threshold - 0.05
                      ? "pill warn"
                      : "pill danger";

                  return (
                    <tr key={pid}>
                      <td>{maskPID(pid)}</td>
                      <td>{rg}</td>
                      <td>{indexName}</td>
                      <td>{period}</td>
                      <td>{raw}</td>
                      <td>
                        <span className={pillClass}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

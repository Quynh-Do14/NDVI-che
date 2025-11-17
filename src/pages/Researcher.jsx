import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "./Researcher.css";
import { Card, Dropdown, Form, Menu, Select } from "antd";
import { LogoutOutlined, UserOutlined as UserIcon } from "@ant-design/icons";
import Chart from "chart.js/auto";
import { onlyDate } from "../helper/helper";
import { calculateBoundsAndCenter } from "../common";
import * as turf from "@turf/turf";
import FullPageLoader from "../common/loading";

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
  const chartIndicesRef = useRef(null);
  const indicesChartRef = useRef(null);
  // State
  const [region, setRegion] = useState({});
  const [plot, setPlot] = useState("all");
  const [indexName, setIndexName] = useState("NDVI");
  const [indexType, setIndexType] = useState("Sentinel 2");
  const [resultMap, setResultMap] = useState({});
  const [selectImg, setSelectImg] = useState("{}");

  const [threshold, setThreshold] = useState(0.4);
  const [period, setPeriod] = useState("2025-06");
  const [anon, setAnon] = useState(true);
  const [dateFrom, setDateFrom] = useState("2025-05-01");
  const [dateTo, setDateTo] = useState("2025-10-01");
  const [copyMsg, setCopyMsg] = useState(false);
  const [plotOptions, setPlotOptions] = useState([]);
  const [selectVung, setSelectVung] = useState("");
  const [dsVung, setDsVung] = useState([]);
  const [dataChartNDVI, setDataChartNDVI] = useState([]);
  const [dsVungGEOOJSON, setDsVungGEOOJSON] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chuGiaiBanDo, setChuGiaiBanDo] = useState(0);

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
  const fetchData = async () => {
    var center = [0, 0];
    const res = await fetch(
      "http://103.163.119.247:33612/dataGeoJson?tenbang=vung",
      {
        method: "GET",
      }
    );
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    if (data) {
      const result = calculateBoundsAndCenter(data);
      console.log("result", result);

      center = result?.center;
    }

    const map = new mapboxgl.Map({
      container: mapDivRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: center,
      zoom: 11.5,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );
    map.addControl(new mapboxgl.ScaleControl());

    map.on("load", () => {
      map.addSource("vung", {
        type: "geojson",
        data: "http://103.163.119.247:33612/dataGeoJson?tenbang=vung",
        promoteId: "id",
      });
      map.addSource("lo", {
        type: "geojson",
        data: "http://103.163.119.247:33612/dataGeoJson?tenbang=lo",
        promoteId: "id",
      });
      map.addSource("diem", {
        type: "geojson",
        data: "http://103.163.119.247:33612/dataGeoJson?tenbang=diem",
        cluster: true,
        clusterRadius: 40,
        clusterMaxZoom: 12,
        promoteId: "id",
      });

      map.addLayer({
        id: "vung-fill",
        type: "fill",
        source: "vung",
        paint: {
          "fill-color": [
            "match",
            ["get", "tt"],
            "Đang canh tác",
            "#34D399", // xanh lục
            "Chưa canh tác",
            "#FBBF24", // vàng cam
            /* other */ "#CBD5E1", // xám nhẹ cho giá trị khác/rỗng
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.55,
            0.35,
          ],
        },
      });

      map.addLayer({
        id: "vung-outline",
        type: "line",
        source: "vung",
        paint: {
          "line-color": [
            "match",
            ["get", "tt"],
            "Đang canh tác",
            "#059669", // đậm hơn fill
            "Chưa canh tác",
            "#B45309",
            /* other */ "#64748B",
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            1,
            12,
            2,
            16,
            3,
          ],
          "line-opacity": 0.9,
        },
      });

      map.addLayer({
        id: "vung-label",
        type: "symbol",
        source: "vung",
        layout: {
          "text-field": [
            "coalesce",
            ["get", "ten_vung"],
            ["concat", "Trạng thái: ", ["coalesce", ["get", "tt"], "Không rõ"]],
          ],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 14, 14],
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#1F2937",
          "text-halo-color": "#FFFFFF",
          "text-halo-width": 1.5,
        },
      });

      map.addLayer({
        id: "vung-extrude",
        type: "fill-extrusion",
        source: "vung",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#9AE6B4",
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            2,
            18,
            8,
          ],
          "fill-extrusion-opacity": 0.25,
        },
      });

      map.addLayer({
        id: "lo-fill",
        type: "fill",
        source: "lo",
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
        id: "lo-outline",
        type: "line",
        source: "lo",
        paint: {
          "line-color": "#4A5568",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.3,
            14,
            0.8,
            18,
            1.4,
          ],
          "line-opacity": 0.7,
        },
      });

      // Nhãn lô: chỉ hiện khi zoom đủ gần
      map.addLayer({
        id: "lo-label",
        type: "symbol",
        source: "lo",
        // minzoom: 13,
        layout: {
          "text-field": ["coalesce", ["get", "tenlo"], "Lô"],
          // 'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 17, 13],
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#2D3748",
          "text-halo-color": "#FFFFFF",
          "text-halo-width": 1,
        },
      });

      // Chấm tròn
      map.addLayer({
        id: "diem-point",
        type: "circle",
        source: "diem",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,
            4,
            14,
            6,
            18,
            8,
          ],
          "circle-color": "#3B82F6", // xanh lam
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 1.2,
          "circle-opacity": 0.9,
        },
      });

      // Nhãn tên điểm
      map.addLayer({
        id: "diem-label",
        type: "symbol",
        source: "diem",
        layout: {
          "text-field": ["get", "tendiem"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 10, 11, 16, 14],
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#1E3A8A",
          "text-halo-color": "#FFFFFF",
          "text-halo-width": 1,
        },
      });

      // Tạo 1 popup dùng lại
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: "320px",
      });

      // Helper nhỏ
      const safe = (v, fallback = "—") =>
        v === null || v === undefined || v === "" ? fallback : v;

      // ====== VÙNG (polygon) ======
      map.on(
        "mouseenter",
        "vung-fill",
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        "vung-fill",
        () => (map.getCanvas().style.cursor = "")
      );

      map.on("click", "vung-fill", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties || {};
        const html = `
    <div style="font: 13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
      <div style="font-weight:600; margin-bottom:4px;padding-top: 20px;">${safe(
        p.tenvung,
        "Vùng chưa có tên"
      )}</div>
      <div><b>Trạng thái:</b> ${safe(p.tt)}</div>
      <div><b>Diện tích (ha):</b> ${safe(p.dientich)}</div>
      <div style="margin-top:6px; color:#64748B">ID: ${safe(p.idvung)}</div>
    </div>
  `;
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      });

      // ====== LÔ (polygon) ======
      map.on(
        "mouseenter",
        "lo-fill",
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        "lo-fill",
        () => (map.getCanvas().style.cursor = "")
      );

      map.on("click", "lo-fill", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties || {};
        const html = `
    <div style="font: 13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
      <div style="font-weight:600; margin-bottom:4px;padding-top: 20px;">${safe(
        p.tenlo,
        "Lô"
      )}</div>
      <div><b>Giống:</b> ${safe(p.giong)}</div>
      <div><b>Diện tích (ha):</b> ${safe(p.dientichlo)}</div>
      <div style="margin-top:6px; color:#64748B">ID: ${safe(p.idlo)}</div>
    </div>
  `;
        popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      });

      // ====== ĐIỂM (point) ======
      map.on(
        "mouseenter",
        "diem-point",
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        "diem-point",
        () => (map.getCanvas().style.cursor = "")
      );

      map.on("click", "diem-point", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties || {};

        // Nếu đây là 1 cluster: zoom nở cụm thay vì popup
        if (p && ("cluster" in p || "point_count" in p || "cluster_id" in p)) {
          const source = map.getSource("diem");
          const clusterId = p.cluster_id;
          if (
            source &&
            typeof source.getClusterExpansionZoom === "function" &&
            clusterId !== undefined
          ) {
            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              map.easeTo({ center: f.geometry.coordinates, zoom });
            });
            return;
          }
        }

        // Điểm lẻ: hiển thị popup
        const html = `
    <div style="font: 13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
      <div style="font-weight:600; margin-bottom:4px;padding-top: 20px;">${safe(
        p.tendiem,
        "Điểm quan trắc"
      )}</div>
      <div><b>Toạ độ:</b> ${f.geometry?.coordinates?.[1]?.toFixed?.(
        6
      )}, ${f.geometry?.coordinates?.[0]?.toFixed?.(6)}</div>
      <div style="margin-top:6px; color:#64748B">ID: ${safe(p.ma)}</div>
    </div>
  `;
        popup
          .setLngLat(e.lngLat) // hoặc dùng f.geometry.coordinates cho anchor tuyệt đối
          .setHTML(html)
          .addTo(map);
      });
    });

    return () => map.remove();
  };
  useEffect(() => {
    fetchData();
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
    const id = e.target.value;
    const found = dsVungGEOOJSON.find((x) => x.properties.idvung == id);
    setRegion(found); // LƯU OBJECT ĐẦY ĐỦ
  };
  useEffect(() => {
    if (dsVungGEOOJSON.length) {
      setRegion(dsVungGEOOJSON[0]);
    }
  }, [dsVungGEOOJSON]);

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
    console.log("key", key);

    const map = mapRef.current;
    if (!map) return;

    const visibility = {
      vung: ["vung-fill", "vung-outline", "vung-label", "vung-extrude"],
      lo: ["lo-fill", "lo-outline", "lo-label"],
      diem: ["diem-point", "diem-label"],
      anh: ["anhVeTinh"],
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

  const onGetDataChart = async () => {
    if (selectVung) {
      try {
        const res = await fetch(
          `http://103.163.119.247:33612/chiso?vungid=${selectVung}`
          // KHÔNG cần headers với OpenWeatherMap API
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setDataChartNDVI(data.data);
      } catch (err) {
        console.log("Error:", err);
      }
    }
  };

  useEffect(() => {
    if (dataChartNDVI.length) {
      const days = dataChartNDVI.map((item) => {
        const date = new Date(item.dt);
        return date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        });
      });

      const ndvi = dataChartNDVI.map((item) => item.ndvi);
      const evi = dataChartNDVI.map((item) => item.evi);
      const ndwi = dataChartNDVI.map((item) => item.ndwi);
      const lai = dataChartNDVI.map((item) => item.lai);
      const cire = dataChartNDVI.map((item) => item.cire);

      if (chartIndicesRef.current) {
        const ctx = chartIndicesRef.current.getContext("2d");

        // Hủy chart cũ trước khi vẽ lại
        if (indicesChartRef.current) indicesChartRef.current.destroy();

        indicesChartRef.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: days,
            datasets: [
              {
                label: "NDVI",
                data: ndvi,
                borderColor: "#22c55e", // xanh lá sáng
                backgroundColor: "#22c55e33",
                tension: 0.3,
              },
              {
                label: "EVI",
                data: evi,
                borderColor: "#3b82f6", // xanh dương
                backgroundColor: "#3b82f633",
                tension: 0.3,
              },
              {
                label: "NDWI",
                data: ndwi,
                borderColor: "#06b6d4", // cyan
                backgroundColor: "#06b6d433",
                tension: 0.3,
              },
              {
                label: "LAI",
                data: lai,
                borderColor: "#f59e0b", // vàng cam
                backgroundColor: "#f59e0b33",
                tension: 0.3,
              },
              {
                label: "CIRE",
                data: cire,
                borderColor: "#ef4444", // đỏ
                backgroundColor: "#ef444433",
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
              y: {
                beginAtZero: true,
                max: 4,
              },
            },
          },
        });
      }
    }

    return () => {
      indicesChartRef.current?.destroy();
    };
  }, [dataChartNDVI]);

  const fetchDataDSVung = async () => {
    fetch("http://103.163.119.247:33612/vung")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then((data) => {
        if (data.success) {
          setDsVung(data.data);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });
  };

  const onGetDataVungGEOJSON = async () => {
    try {
      const res = await fetch(
        `http://103.163.119.247:33612/dataGeoJson?tenbang=vung`
        // KHÔNG cần headers với OpenWeatherMap API
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setDsVungGEOOJSON(data.features);
    } catch (err) {
      console.log("Error:", err);
    }
  };

  useEffect(() => {
    fetchDataDSVung();
    onGetDataVungGEOJSON();
  }, []);

  useEffect(() => {
    onGetDataChart();
  }, [selectVung]);

  useEffect(() => {
    if (dsVung.length) {
      setSelectVung(dsVung[0].idvung);
    }
  }, [dsVung]);

  const handleGEOJSON = async () => {
    setIsLoading(true);
    const res = await fetch(`http://103.163.119.247:32511/ndvi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: dateFrom,
        endDate: dateTo,
        imageType: indexType,
        indexType: indexName,
        spatialType: "Vẽ thủ công",
        kmlFile: null,
        polygonDraw: region,
      }),
    });
    console.log("region", region);
    if (region) {
      const bbox = turf.bbox(region);

      // Fit bounds đến polygon
      mapRef.current.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        {
          padding: 40,
          duration: 1000,
        }
      );
    }

    const data = await res.json();
    if (data.success) {
      if (mapRef.current.getLayer("anhVeTinh")) {
        mapRef.current.removeLayer("anhVeTinh");
      }
      if (mapRef.current.getSource("anhVeTinh")) {
        mapRef.current.removeSource("anhVeTinh");
      }

      mapRef.current.addSource("anhVeTinh", {
        type: "raster",
        tiles: [data.image1],
      });
      mapRef.current.addLayer({
        id: "anhVeTinh",
        type: "raster",
        source: "anhVeTinh",
        minzoom: 0,
        maxzoom: 22,
      });

      var resdp = {
        valueOpacity: 100,
        image1: data.image1,
        image2: data.image2,
        image: data.image1,
        download1: data.download1,
        download2: data.download2,
        timeSeries: data.timeSeries,
      };
      setResultMap(resdp);

      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  const handleGEOJSONMapColor = async (imageColor, note, download) => {
    setChuGiaiBanDo(note);
    setSelectImg(download);
    if (mapRef.current.getLayer("anhVeTinh")) {
      mapRef.current.removeLayer("anhVeTinh");
    }
    if (mapRef.current.getSource("anhVeTinh")) {
      mapRef.current.removeSource("anhVeTinh");
    }

    mapRef.current.addSource("anhVeTinh", {
      type: "raster",
      tiles: [imageColor],
    });
    mapRef.current.addLayer({
      id: "anhVeTinh",
      type: "raster",
      source: "anhVeTinh",
      minzoom: 0,
      maxzoom: 22,
    });
    // Fit bounds đến polygon
    mapRef.current.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      {
        padding: 40,
        duration: 1000,
      }
    );
  };

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
          </div>
        </div>

        <div className="header-actions">
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
      </header>

      <div className="container-researcher">
        <aside className="panel" id="filters">
          <h3>Bộ lọc & tham số</h3>
          <div className="group">
            <label>Vùng chè</label>
            <select
              id="selRegion"
              className="input"
              value={region?.properties?.idvung || ""}
              onChange={handleRegionChange}
            >
              {dsVungGEOOJSON.map((item, index) => (
                <option key={index} value={item.properties.idvung}>
                  {item.properties.tenvung}
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
            <label>Loại ảnh</label>
            <select
              id="selType"
              className="input"
              value={indexType}
              onChange={(e) => setIndexType(e.target.value)}
            >
              <option key={"Sentinel 2"}>Sentinel 2</option>
              <option key={"Landsat 8"}>Landsat 8</option>
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
          <button className="btn" onClick={handleGEOJSON}>
            Xem ảnh
          </button>
          {Object.keys(resultMap).length ? (
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 6,
                  marginTop: 12,
                  marginLeft: 4,
                  color: "#292929ff",
                }}
              >
                Chọn bản đồ màu
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: 8,
                  marginBottom: 8,
                  paddingLeft: 8,
                  paddingRight: 8,
                  justifyContent: "center",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                {/* Bản đồ 1 */}
                <div
                  onClick={() => {
                    const dp = { ...resultMap };
                    dp.image = dp.image1;
                    dp.anh = 1;
                    handleGEOJSONMapColor(dp.image1, 1, dp.download1);
                  }}
                  style={{
                    backgroundColor: "#444556",
                    padding: 8,
                    borderRadius: 12,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {[
                    { h: 25, c: "#004e00", t: "- 1" },
                    { h: 12.5, c: "#11530b", t: "- 0.6" },
                    { h: 12.5, c: "#226111" },
                    { h: 12.5, c: "#377820" },
                    { h: 12.5, c: "#49872b" },
                    { h: 12.5, c: "#569135" },
                    { h: 12.5, c: "#6a9f3c" },
                    { h: 12.5, c: "#76a847" },
                    { h: 12.5, c: "#88b850" },
                    { h: 12.5, c: "#9ac358", t: "- 0.2" },
                    { h: 12.5, c: "#a9cd63" },
                    { h: 12.5, c: "#b9c569" },
                    { h: 12.5, c: "#c2bc75" },
                    { h: 12.5, c: "#d0cb8f" },
                    { h: 12.5, c: "#ded8a3" },
                    { h: 12.5, c: "#ece6bc" },
                    { h: 12.5, c: "#faf6cf", t: "- 0" },
                    { h: 25, c: "#ebebeb", t: "- -0.1" },
                    { h: 25, c: "#dddddd", t: "- -0.2" },
                    { h: 25, c: "#c3c3c3", t: "- -0.5" },
                    { h: 25, c: "#0a0a0a", t: "- -1" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 50,
                          height: item.h,
                          backgroundColor: item.c,
                          marginRight: 4,
                          borderRadius: 2,
                        }}
                      />
                      {item.t && (
                        <span style={{ fontSize: 9, color: "#fff" }}>
                          {item.t}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bản đồ 2 */}
                <div
                  style={{
                    backgroundColor: "#444556",
                    padding: 8,
                    borderRadius: 12,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onClick={() => {
                    const dp = { ...resultMap };
                    dp.image = dp.image2;
                    dp.anh = 2;
                    handleGEOJSONMapColor(dp.image2, 2, dp.download2);
                  }}
                >
                  {[
                    { c: "#017147", t: "- 1" },
                    { c: "#11b16b", t: "- 0.9" },
                    { c: "#8dc777", t: "- 0.8" },
                    { c: "#c2e78f", t: "- 0.7" },
                    { c: "#e9f4b0", t: "- 0.6" },
                    { c: "#fff2bd", t: "- 0.5" },
                    { c: "#fdc888", t: "- 0.4" },
                    { c: "#f89365", t: "- 0.3" },
                    { c: "#ed5945", t: "- 0.2" },
                    { c: "#b4033d", t: "- 0.1" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 50,
                          height: 25,
                          backgroundColor: item.c,
                          marginRight: 4,
                          borderRadius: 2,
                        }}
                      />
                      <span style={{ fontSize: 9, color: "#fff" }}>
                        {item.t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <a href={selectImg} target="_blank">
                <button className="btn" onClick={exportGeoJSON}>
                  Tải dữ liệu
                </button>
              </a>
            </div>
          ) : null}

          {/* <div className="group">
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
          </div> */}
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
          {/* <div className="group">
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
              title="Sao chép URL API"
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
          </div> */}

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
              <button className="btn tool" onClick={() => toggleLayer("vung")}>
                Vùng chè
              </button>
              <button className="btn tool" onClick={() => toggleLayer("lo")}>
                Lô chè
              </button>
              <button className="btn tool" onClick={() => toggleLayer("diem")}>
                Điểm quan trắc
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

            <div className="legend" id="legend">
              {chuGiaiBanDo == 1 && Object.keys(resultMap).length ? (
                <div
                  style={{
                    backgroundColor: "#444556",
                    padding: 6,
                    borderRadius: 10,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    transformOrigin: "top left",
                  }}
                >
                  {[
                    { h: 18, c: "#004e00", t: "- 1" },
                    { h: 10, c: "#11530b", t: "- 0.6" },
                    { h: 10, c: "#226111" },
                    { h: 10, c: "#377820" },
                    { h: 10, c: "#49872b" },
                    { h: 10, c: "#569135" },
                    { h: 10, c: "#6a9f3c" },
                    { h: 10, c: "#76a847" },
                    { h: 10, c: "#88b850" },
                    { h: 10, c: "#9ac358", t: "- 0.2" },
                    { h: 10, c: "#a9cd63" },
                    { h: 10, c: "#b9c569" },
                    { h: 10, c: "#c2bc75" },
                    { h: 10, c: "#d0cb8f" },
                    { h: 10, c: "#ded8a3" },
                    { h: 10, c: "#ece6bc" },
                    { h: 10, c: "#faf6cf", t: "- 0" },
                    { h: 18, c: "#ebebeb", t: "- -0.1" },
                    { h: 18, c: "#dddddd", t: "- -0.2" },
                    { h: 18, c: "#c3c3c3", t: "- -0.5" },
                    { h: 18, c: "#0a0a0a", t: "- -1" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: item.h,
                          backgroundColor: item.c,
                          marginRight: 4,
                          borderRadius: 2,
                        }}
                      />
                      {item.t && (
                        <span style={{ fontSize: 8, color: "#fff" }}>
                          {item.t}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : chuGiaiBanDo == 2 && Object.keys(resultMap).length ? (
                <div
                  style={{
                    backgroundColor: "#444556",
                    padding: 6,
                    borderRadius: 10,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    transformOrigin: "top left",
                  }}
                >
                  {[
                    { c: "#017147", t: "- 1" },
                    { c: "#11b16b", t: "- 0.9" },
                    { c: "#8dc777", t: "- 0.8" },
                    { c: "#c2e78f", t: "- 0.7" },
                    { c: "#e9f4b0", t: "- 0.6" },
                    { c: "#fff2bd", t: "- 0.5" },
                    { c: "#fdc888", t: "- 0.4" },
                    { c: "#f89365", t: "- 0.3" },
                    { c: "#ed5945", t: "- 0.2" },
                    { c: "#b4033d", t: "- 0.1" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 18,
                          backgroundColor: item.c,
                          marginRight: 4,
                          borderRadius: 2,
                        }}
                      />
                      <span style={{ fontSize: 8, color: "#fff" }}>
                        {item.t}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="tablewrap">
            <div className="tablehead">
              <div className="table-title">
                <strong>Kết quả thống kê</strong>
                <span className="hint">(ẩn danh)</span>
              </div>
              <div className="table-actions">
                <Form.Item label="Chọn vùng">
                  <Select
                    placeholder="Chọn vùng"
                    value={selectVung}
                    onChange={(val) => setSelectVung(val)}
                    showSearch
                    optionFilterProp="children"
                  >
                    {dsVung.map((v, i) => (
                      <Option key={i} value={v.idvung}>
                        {v.tenvung}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </div>
            <table className="table" id="resultTable">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>CIRE</th>
                  <th>EVI</th>
                  <th>LAI</th>
                  <th>NDVI</th>
                  <th>NDWI</th>
                </tr>
              </thead>
              <tbody>
                {dataChartNDVI.map((item, index) => {
                  return (
                    <tr key={index}>
                      <td>{onlyDate(item.dt)}</td>
                      <td>{item.cire}</td>
                      <td>{item.evi}</td>
                      <td>{item.lai}</td>
                      <td>{item.ndvi}</td>
                      <td>{item.ndwi}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* <section id="indicesPanel" className="charts-section">
              <div className="chart-main" style={{ width: "100%" }}>
                <Card>
                  <div className="card-header">
                    <h3>Chuỗi chỉ số NDVI / EVI / NDWI (30 ngày)</h3>
                    <Form.Item label="Chọn vùng">
                      <Select
                        placeholder="Chọn vùng"
                        value={selectVung}
                        onChange={(val) => setSelectVung(val)}
                        showSearch
                        optionFilterProp="children"
                      >
                        {dsVung.map((v, i) => (
                          <Option key={i} value={v.idvung}>
                            {v.tenvung}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>
                  <canvas ref={chartIndicesRef} height="150" />
                </Card>
              </div>
            </section> */}
          </div>
        </section>
      </div>
      {isLoading && <FullPageLoader />}
    </div>
  );
}

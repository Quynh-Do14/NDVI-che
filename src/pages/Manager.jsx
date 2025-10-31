import React, { useEffect, useRef, useState } from "react";
import { Card, Table, Button, Slider, Checkbox, Space, Tag } from "antd";
import {
  DownloadOutlined,
  SendOutlined,
  EditOutlined,
  UserOutlined,
  EnvironmentOutlined,
  RadiusSettingOutlined,
  BorderOutlined,
  BlockOutlined,
  PushpinOutlined,
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
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { Modal, Form, Input, Select, Alert } from "antd";

const { TextArea } = Input;
const { Option } = Select;

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

const dsVung = [
  {
    idvung: 1,
    tenvung: "Vùng chè A1",
    dientich: 2.5,
    trangthai: "Đang canh tác",
  },
  {
    idvung: "V002",
    tenvung: "Vùng chè A2",
    dientich: 3.1,
    trangthai: "Chưa canh tác",
  },
  {
    idvung: "V003",
    tenvung: "Vùng chè B1",
    dientich: 1.8,
    trangthai: "Đang canh tác",
  },
  {
    idvung: "V004",
    tenvung: "Vùng chè B2",
    dientich: 4.2,
    trangthai: "Đang canh tác",
  },
  {
    idvung: "V005",
    tenvung: "Vùng chè C1",
    dientich: 2.0,
    trangthai: "Chưa canh tác",
  },
];

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
  const [modalKhuyenCao, setModalKhuyenCao] = useState(false);
  const [modalThemVung, setModalThemVung] = useState(false);
  const [modalThemLo, setModalThemLo] = useState(false);
  const [modalThemDiemQuanTrac, setModalThemDiemQuanTrac] = useState(false);

  const [noiDungKhuyenCao, setNoiDungKhuyenCao] = useState("");
  const [lichLamViec, setLichLamViec] = useState("");
  const [dsNguoiDung, setDsNguoiDung] = useState([]);
  const [tenVung, setTenVung] = useState("");
  const [dienTich, setDienTich] = useState("");
  const [trangThai, setTrangThai] = useState("Đang canh tác");
  const [vungid, setVungId] = useState("V001");
  const [trangthaitrong, setTrangThaiTrong] = useState("Đang trồng");
  const [nam, setNam] = useState("");
  const [giong, setGiong] = useState("");
  const [dientichlo, setDienTichLo] = useState("");
  const [tenlo, setTenLo] = useState("");
  const [tendiem, setTenDiem] = useState("");
  const [ma, setMa] = useState("");

  const [user, setUser] = useState("");
  const [error, setError] = useState("");
  const [polygonDraw, setPolygonDraw] = useState({
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [],
    },
  });

  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const indicesChartRef = useRef(null);
  const weatherChartRef = useRef(null);

  const toggleKhuyenCao = () => setModalKhuyenCao(!modalKhuyenCao);
  const toggleThemVung = () => setModalThemVung(!modalThemVung);
  const toggleThemLo = () => setModalThemLo(!modalThemLo);
  const toggleThemDiemQuanTrac = () =>
    setModalThemDiemQuanTrac(!modalThemDiemQuanTrac);

  function handleDrawEvent(e) {
    const features = e.features;
    if (features.length > 0) {
      setPolygonDraw(features[0]);
    }
  }

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

  const calculateBoundsAndCenter = (geojson) => {
    if (!geojson || geojson.type !== "FeatureCollection") {
      throw new Error("Input must be a GeoJSON FeatureCollection");
    }

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;
    let sumX = 0,
      sumY = 0;
    let count = 0;

    geojson.features.forEach((feature) => {
      if (feature.geometry.type === "Point") {
        const [x, y] = feature.geometry.coordinates;

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;

        sumX += x;
        sumY += y;
        count++;
      }
    });

    const center = [sumX / count, sumY / count]; // [lng, lat]

    return {
      minLng: minX,
      minLat: minY,
      maxLng: maxX,
      maxLat: maxY,
      boundsArray: [
        [minX, minY],
        [maxX, maxY],
      ],
      center: center, // [lng, lat]
    };
  };

  const fetchData = async () => {
    if (!mapContainer.current) return;
    var center = [0, 0];

    const res = await fetch(
      "http://103.163.119.247:33612/dataGeoJson?tenbang=diem",
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

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: center,
      zoom: 8.5,
    });

    mapRef.current = map;

    var Draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        point: true,
        polygon: true,
        trash: true,
      },
    });

    drawRef.current = Draw;
    map.addControl(Draw, "top-left");
    map.on("draw.create", handleDrawEvent);
    map.on("draw.update", handleDrawEvent);
    map.on("draw.selectionchange", handleDrawEvent);

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
            "Shan",
            "#B2F5EA",
            "LDP1",
            "#FEEBC8",
            "KimTuyen",
            "#E9D8FD",
            /* other */ "#E6FFFA",
          ],
          "fill-opacity": 0.28,
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
        minzoom: 13,
        layout: {
          "text-field": ["coalesce", ["get", "tenlo"], "Lô"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 13, 10, 17, 13],
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
      <div style="font-weight:600; margin-bottom:4px;">${safe(
        p.ten_vung,
        "Vùng chưa có tên"
      )}</div>
      <div><b>Trạng thái:</b> ${safe(p.tt)}</div>
      <div><b>Diện tích (ha):</b> ${safe(p.dientich)}</div>
      <div style="margin-top:6px; color:#64748B">ID: ${safe(p.id)}</div>
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
      <div style="font-weight:600; margin-bottom:4px;">${safe(
        p.tenlo,
        "Lô"
      )}</div>
      <div><b>Giống:</b> ${safe(p.giong)}</div>
      <div><b>Diện tích (ha):</b> ${safe(p.dientich)}</div>
      <div style="margin-top:6px; color:#64748B">ID: ${safe(p.id)}</div>
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
      <div style="font-weight:600; margin-bottom:4px;">${safe(
        p.tendiem,
        "Điểm quan trắc"
      )}</div>
      <div><b>Toạ độ:</b> ${f.geometry?.coordinates?.[1]?.toFixed?.(
        6
      )}, ${f.geometry?.coordinates?.[0]?.toFixed?.(6)}</div>
      <div style="margin-top:6px; color:#64748B">ID: ${safe(p.id)}</div>
    </div>
  `;
        popup
          .setLngLat(e.lngLat) // hoặc dùng f.geometry.coordinates cho anchor tuyệt đối
          .setHTML(html)
          .addTo(map);
      });
    });

    return () => {
      map.remove();
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const genMa8 = () => Math.floor(100000 + Math.random() * 900000).toString();

  useEffect(() => {
    if (modalThemDiemQuanTrac && (!ma || ma.length !== 8)) {
      setMa(genMa8());
    }
  }, [modalThemDiemQuanTrac]);

  const taoLaiMa = () => setMa(genMa8());

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

  const taoKhuyenCao = async () => {
    toggleKhuyenCao();
    try {
      const res = await fetch("http://103.163.119.247:33612/khuyencao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noidung: noiDungKhuyenCao,
          lich: lichLamViec,
          geo: polygonDraw, // Đã bỏ JSON.stringify vì polygonDraw có thể là object
          userid: user,
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.success) {
        // fetchData()
      }
    } catch (err) {
      console.log("Error:", err);
    }
  };

  const taoVung = async () => {
    if (polygonDraw.geometry.coordinates.length == 0) {
      setError("Vui lòng vẽ vùng muốn thêm");
      // setIsLoading(false);
      return;
    }
    toggleThemVung();
    const res = await fetch("http://103.163.119.247:33612/vung", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenvung: tenVung,
        dientich: parseFloat(dienTich),
        tt: trangThai,
        geom: JSON.stringify(polygonDraw.geometry),
      }),
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    if (data.success) {
      // fetchData()
    }
  };

  const taoLo = async () => {
    if (polygonDraw.geometry.coordinates.length == 0) {
      setError("Vui lòng vẽ vùng muốn thêm");
      // setIsLoading(false);
      return;
    }
    toggleThemLo();
    const res = await fetch("http://103.163.119.247:33612/lo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenlo: tenlo,
        dientichlo: parseFloat(dientichlo),
        giong: giong,
        nam: nam,
        trangthaitrong: trangthaitrong,
        userid: user,
        vungid: 1,
        geom: JSON.stringify(polygonDraw.geometry),
      }),
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    if (data.success) {
      // fetchData()
    }
  };

  const taoDiemQuanTrac = async () => {
    if (polygonDraw.geometry.coordinates.length == 0) {
      setError("Vui lòng vẽ điểm muốn thêm");
      // setIsLoading(false);
      return;
    }
    toggleThemDiemQuanTrac();
    const res = await fetch("http://103.163.119.247:33612/diem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tendiem: tendiem,
        ma: ma,
        lat: JSON.stringify(polygonDraw.geometry.coordinates[1]),
        long: JSON.stringify(polygonDraw.geometry.coordinates[0]),
      }),
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    if (data.success) {
      // fetchData()
    }
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

  const nhaKiColumns = [
    { title: "Thời gian", dataIndex: "ngaythem", key: "ngaythem" },
    { title: "Tên lô", dataIndex: "tenlo", key: "tenlo" },
    { title: "Chi phí", dataIndex: "chiphi", key: "chiphi" },
    { title: "Hành động", dataIndex: "hanhdong", key: "hanhdong" },
  ];

  const sauBenhColumns = [
    { title: "Thời gian", dataIndex: "ngay", key: "ngay" },
    { title: "Tên lô", dataIndex: "tenlo", key: "tenlo" },
    { title: "Trạng thái", dataIndex: "trangthai", key: "trangthai" },
    { title: "Mức độ", dataIndex: "mucdo", key: "mucdo" },
    { title: "Mô tả", dataIndex: "mota", key: "mota" },
  ];
  const [weatherData, setWeatherData] = useState([]);
  const [currentWeather, setCurrentWeather] = useState({});
  const [mainWeather, setMainWeather] = useState("");
  const [rainTotal, setRainTotal] = useState(0);
  const [nhatKy, setNhatKy] = useState([]);
  const [dataSauBenh, setDataSauBenh] = useState([]);

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
          setNhatKy(data.data);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });
  };

  const fetchDataSauBenh = async () => {
    fetch("http://103.163.119.247:33612/saubenh")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then((data) => {
        if (data.success) {
          setDataSauBenh(data.data);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });
  };

  const fetchDataDSNguoiDung = async () => {
    fetch("http://103.163.119.247:33612/users")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then((data) => {
        if (data.success) {
          setDsNguoiDung(data.data);
          setUser(data.data[0].iduser);
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
    fetchDataSauBenh();
    fetchDataDSNguoiDung();
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
    setRainTotal(totalRin.toFixed(2));
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
    <React.Fragment>
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
                <a href="#reportPanel">Báo cáo sâu bệnh</a>
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
                    {/*<div className="time-slider">
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
                  */}
                    {/* <Button
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
                  </Button> */}
                    <Button
                      type="primary"
                      icon={<RadiusSettingOutlined />}
                      onClick={toggleThemVung}
                      className={isDrawing ? "active-draw" : ""}
                    >
                      Thêm vùng
                    </Button>
                    <Button
                      type="primary"
                      icon={<BlockOutlined />}
                      onClick={toggleThemLo}
                      className={isDrawing ? "active-draw" : ""}
                    >
                      Thêm lô
                    </Button>
                    <Button
                      type="primary"
                      icon={<PushpinOutlined />}
                      onClick={toggleThemDiemQuanTrac}
                      className={isDrawing ? "active-draw" : ""}
                    >
                      Thêm ĐQT
                    </Button>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={toggleKhuyenCao}
                    >
                      Khuyến cáo
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
                <Modal
                  title="Tạo khuyến cáo vùng (AOI)"
                  open={modalKhuyenCao}
                  onCancel={toggleKhuyenCao}
                  footer={null} // dùng custom footer bên dưới
                  centered
                >
                  {/* Hiển thị lỗi nếu có */}
                  {error && (
                    <Alert
                      message={error}
                      type="error"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  {/* Form nội dung */}
                  <Form layout="vertical">
                    <Form.Item
                      label="Nội dung khuyến cáo"
                      tooltip="Nhập chi tiết nội dung khuyến cáo"
                    >
                      <TextArea
                        rows={3}
                        placeholder="Nhập nội dung khuyến cáo..."
                        value={noiDungKhuyenCao}
                        onChange={(e) => setNoiDungKhuyenCao(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Lịch làm việc"
                      tooltip="Ví dụ: tuần 45, ngày 2/11/2025,..."
                    >
                      <TextArea
                        rows={3}
                        placeholder="Nhập lịch làm việc..."
                        value={lichLamViec}
                        onChange={(e) => setLichLamViec(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item label="Chọn nông hộ" required>
                      <Select
                        placeholder="Chọn nông hộ"
                        value={user}
                        onChange={(val) => setUser(val)}
                      >
                        {dsNguoiDung.map((v, i) => (
                          <Option key={i} value={v.iduser}>
                            {v.ten}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {/* Footer nút hành động */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 8,
                        marginTop: 16,
                        borderTop: "1px solid #f0f0f0",
                        paddingTop: 16,
                      }}
                    >
                      <Button
                        onClick={toggleKhuyenCao}
                        style={{
                          borderRadius: 6,
                          height: 38,
                          paddingInline: 20,
                        }}
                      >
                        Huỷ
                      </Button>

                      <Button
                        type="primary"
                        onClick={taoKhuyenCao}
                        style={{
                          borderRadius: 6,
                          height: 38,
                          paddingInline: 20,
                          fontWeight: 500,
                        }}
                      >
                        Tạo khuyến cáo
                      </Button>
                    </div>
                  </Form>
                </Modal>
                <Modal
                  title="Tạo vùng mới"
                  open={modalThemVung}
                  onCancel={toggleThemVung}
                  footer={null}
                  centered
                  width={480}
                >
                  {error && (
                    <Alert
                      message={error}
                      type="error"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  <Form layout="vertical">
                    <Form.Item
                      label="Tên vùng"
                      required
                      tooltip="Nhập tên khu vực hoặc lô canh tác"
                    >
                      <Input
                        placeholder="Ví dụ: Vùng chè A1"
                        value={tenVung}
                        onChange={(e) => setTenVung(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Diện tích (ha)"
                      required
                      tooltip="Nhập diện tích vùng (tính bằng hecta)"
                    >
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ví dụ: 2.5"
                        value={dienTich}
                        onChange={(e) => setDienTich(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item label="Trạng thái vùng" required>
                      <Select
                        placeholder="Chọn trạng thái"
                        value={trangThai}
                        onChange={(val) => setTrangThai(val)}
                      >
                        <Option value="Đang canh tác">Đang canh tác</Option>
                        <Option value="Chưa canh tác">Chưa canh tác</Option>
                      </Select>
                    </Form.Item>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 8,
                        marginTop: 16,
                        borderTop: "1px solid #f0f0f0",
                        paddingTop: 16,
                      }}
                    >
                      <Button
                        onClick={toggleThemVung}
                        style={{
                          borderRadius: 6,
                          height: 38,
                          paddingInline: 20,
                        }}
                      >
                        Huỷ
                      </Button>

                      <Button
                        type="primary"
                        onClick={taoVung}
                        style={{
                          borderRadius: 6,
                          height: 38,
                          paddingInline: 20,
                          fontWeight: 500,
                        }}
                      >
                        Tạo vùng
                      </Button>
                    </div>
                  </Form>
                </Modal>
                <Modal
                  title="Tạo lô mới"
                  open={modalThemLo}
                  onCancel={toggleThemLo}
                  footer={null}
                  centered
                  width={520}
                >
                  {error && (
                    <div
                      style={{
                        background: "#fff1f0",
                        border: "1px solid #ffa39e",
                        color: "#a8071a",
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 16,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <Form layout="vertical">
                    <Form.Item
                      label="Tên lô"
                      required
                      tooltip="Nhập tên/định danh lô"
                    >
                      <Input
                        placeholder="Ví dụ: Lô A1-1"
                        value={tenlo}
                        onChange={(e) => setTenLo(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item label="Diện tích lô (ha)" required>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ví dụ: 1.25"
                        value={dientichlo}
                        onChange={(e) => setDienTichLo(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item label="Giống">
                      <Input
                        placeholder="Ví dụ: Shan, LDP1..."
                        value={giong}
                        onChange={(e) => setGiong(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item label="Năm trồng">
                      <Input
                        type="number"
                        min="1900"
                        max="2100"
                        placeholder="Ví dụ: 2021"
                        value={nam}
                        onChange={(e) => setNam(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item label="Trạng thái trồng" required>
                      <Select
                        placeholder="Chọn trạng thái"
                        value={trangthaitrong}
                        onChange={(val) => setTrangThaiTrong(val)}
                      >
                        <Option value="Đang trồng">Đang trồng</Option>
                        <Option value="Chưa trồng">Chưa trồng</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Người dùng phụ trách" required>
                      <Select
                        placeholder="Chọn người dùng"
                        value={user}
                        onChange={(val) => setUser(val)}
                        showSearch
                        optionFilterProp="children"
                      >
                        {dsNguoiDung.map((u, i) => (
                          <Option key={i} value={u.iduser}>
                            {u.ten}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item label="Thuộc vùng" required>
                      <Select
                        placeholder="Chọn vùng"
                        value={vungid}
                        onChange={(val) => setVungId(val)}
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

                    {/* Footer */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 8,
                        marginTop: 16,
                        borderTop: "1px solid #f0f0f0",
                        paddingTop: 16,
                      }}
                    >
                      <Button
                        onClick={toggleThemLo}
                        style={{
                          borderRadius: 6,
                          height: 38,
                          paddingInline: 20,
                        }}
                      >
                        Huỷ
                      </Button>
                      <Button
                        type="primary"
                        onClick={taoLo}
                        style={{
                          borderRadius: 6,
                          height: 38,
                          paddingInline: 20,
                          fontWeight: 500,
                        }}
                      >
                        Tạo lô
                      </Button>
                    </div>
                  </Form>
                </Modal>

                <Modal
                  title="Tạo điểm quan trắc"
                  open={modalThemDiemQuanTrac}
                  onCancel={toggleThemDiemQuanTrac}
                  footer={null}
                  centered
                  width={480}
                >
                  {error && (
                    <div
                      style={{
                        background: "#fff1f0",
                        border: "1px solid #ffa39e",
                        color: "#a8071a",
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 16,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <Form layout="vertical">
                    <Form.Item label="Tên điểm" required>
                      <Input
                        placeholder="Ví dụ: Điểm Q1 - bìa rừng"
                        value={tendiem}
                        onChange={(e) => setTenDiem(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Mã điểm (6 số)"
                      required
                      tooltip="Hệ thống tự sinh; bạn có thể tạo lại nếu muốn"
                    >
                      <div style={{ display: "flex", gap: 8 }}>
                        <Input
                          value={ma}
                          onChange={(e) =>
                            setMa(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          placeholder="XXXXXX"
                          maxLength={8}
                        />
                        <Button onClick={taoLaiMa}>Tạo lại</Button>
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#8c8c8c", marginTop: 6 }}
                      >
                        Chỉ gồm chữ số (0–9), dài 6 ký tự.
                      </div>
                    </Form.Item>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 8,
                        marginTop: 16,
                        borderTop: "1px solid #f0f0f0",
                        paddingTop: 16,
                      }}
                    >
                      <Button
                        onClick={toggleThemDiemQuanTrac}
                        style={{
                          borderRadius: 6,
                          height: 38,
                          paddingInline: 20,
                        }}
                      >
                        Huỷ
                      </Button>
                      <Button
                        type="primary"
                        onClick={taoDiemQuanTrac}
                        style={{
                          borderRadius: 6,
                          height: 38,
                          paddingInline: 20,
                          fontWeight: 500,
                        }}
                      >
                        Tạo điểm
                      </Button>
                    </div>
                  </Form>
                </Modal>
              </Card>
            </section>

            {/* Charts Section */}
            <section id="indicesPanel" className="charts-section">
              <div className="chart-main">
                <Card>
                  <div className="card-header">
                    <h3>Chuỗi chỉ số NDVI / EVI / NDWI (30 ngày)</h3>
                    <span className="chart-source">Nguồn: GEE</span>
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
                    <h3>Nhật ký nông hộ</h3>
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
                    dataSource={nhatKy}
                    columns={nhaKiColumns}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </div>
              <div id="aoiPanel" className="aoi-list">
                <Card>
                  <div className="card-header">
                    <h3>Khuyến cáo vùng (AOI)</h3>
                  </div>
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
                <div className="card-header">
                  <h3>Báo cáo sâu bệnh</h3>
                </div>
                <Table
                  dataSource={dataSauBenh}
                  columns={sauBenhColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </section>
          </main>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Manager;

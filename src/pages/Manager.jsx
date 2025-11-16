import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  Table,
  Button,
  Slider,
  Checkbox,
  Space,
  Tag,
  message,
  Tooltip,
} from "antd";
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
  DeleteOutlined,
  PlusCircleFilled,
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
import { calculateBoundsAndCenter } from "../common";
import * as turf from "@turf/turf";
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

const Manager = () => {
  const mapContainer = useRef(null);
  const chartIndicesRef = useRef(null);
  const chartWeatherRef = useRef(null);

  const [data] = useState(generateSampleData());
  const [timeIndex, setTimeIndex] = useState(29);
  const [isDrawing, setIsDrawing] = useState(false);
  const [aoiItems, setAoiItems] = useState([]);
  const [layerVisibility, setLayerVisibility] = useState({
    vung: true,
    lo: true,
    diem: true,
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
  const [vungid, setVungId] = useState("");
  const [loCheId, setLoCheId] = useState("");
  const [isEditLo, setIsEditLo] = useState(false);
  const [isEditVung, setIsEditVung] = useState(false);

  const [trangthaitrong, setTrangThaiTrong] = useState("Đang trồng");
  const [nam, setNam] = useState("");
  const [giong, setGiong] = useState("");
  const [dientichlo, setDienTichLo] = useState("");
  const [tenlo, setTenLo] = useState("");
  const [tendiem, setTenDiem] = useState("");
  const [ma, setMa] = useState("");
  const [dsLoChe, setDsLoChe] = useState([]);
  const [dsVung, setDsVung] = useState([]);
  const [dataChartNDVI, setDataChartNDVI] = useState([]);
  const [selectVung, setSelectVung] = useState("");
  const [dsGiong, setDsGiong] = useState([]);

  //user
  const [modalThemUser, setModalThemUser] = useState(false);
  const [idUser, setIdUser] = useState("");
  const [userEdit, setUserEdit] = useState(null); // null khi tạo mới, có giá trị khi sửa
  const [tenUser, setTenUser] = useState("");
  const [taiKhoan, setTaiKhoan] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [email, setEmail] = useState("");
  const [sdt, setSdt] = useState("");
  const [vaiTro, setVaiTro] = useState("NGUOIDUNG");

  //Giống
  const [modalThemGiong, setModalThemGiong] = useState(false);
  const [giongEdit, setGiongEdit] = useState("");
  const [idGiong, setIdGiong] = useState("");
  const [tenGiong, setTenGiong] = useState("");

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
  const [areaM2, setAreaM2] = useState("");

  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const indicesChartRef = useRef(null);
  const weatherChartRef = useRef(null);

  const toggleKhuyenCao = () => setModalKhuyenCao(!modalKhuyenCao);
  const toggleThemVung = () => {
    setModalThemVung(!modalThemVung);
    setIsEditVung(false);
  };
  const toggleThemLo = () => {
    setModalThemLo(!modalThemLo);
    setIsEditLo(false);
  };
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
      weatherChartRef.current?.destroy();
    };
  }, [dataChartNDVI]);

  const fetchData = async () => {
    if (!mapContainer.current) return;
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

      center = result.center;
    }

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: center,
      zoom: 11.5,
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

    return () => {
      map.remove();
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (dsVung.length) {
      setVungId(dsVung[0].idvung);
      setSelectVung(dsVung[0].idvung);
    }
    if (dsLoChe.length) {
      setLoCheId(dsLoChe[0].idlo);
    }
    if (dsGiong.length) {
      setGiong(dsGiong[0].tengiong);
    }
  }, [dsVung, dsLoChe]);

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
          vungid: vungid,
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.success) {
        // fetchData()
      }
    } catch (err) {
      console.log("Error:", err);
      message.success("Tạo thành công!");
    }
  };

  const handleEditVung = (item) => {
    toggleThemVung();
    setTenVung(item.tenvung);
    setDienTich(item.dientich);
    setTrangThai(item.tt);
    setVungId(item.idvung);
    setIsEditVung(true);
  };

  useEffect(() => {
    if (polygonDraw.geometry.coordinates.length) {
      const area = turf.area(polygonDraw);
      setAreaM2((area / 10000).toFixed(2));
    }
  }, [polygonDraw]);

  const taoVung = async () => {
    toggleThemVung();
    if (vungid) {
      const res = await fetch("http://103.163.119.247:33612/vung-u", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idvung: vungid,
          tenvung: tenVung,
          dientich: parseFloat(areaM2),
          tt: trangThai,
          geom: JSON.stringify(polygonDraw.geometry),
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setTenVung("");
      setDienTich("");
      setTrangThai("");
      setVungId("");
      if (data.success) {
        setTenVung("");
        setDienTich("");
        setTrangThai("");
        setVungId("");
        fetchDataDSVung();
        message.success("Tạo vùng thành công!");
      }
    } else {
      if (polygonDraw.geometry.coordinates.length == 0) {
        setError("Vui lòng vẽ vùng muốn thêm");
        // setIsLoading(false);
        message.error("Lỗi khi gửi khuyến cáo!");
        return;
      }
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
      setTenVung("");
      setDienTich("");
      setTrangThai("");
      setVungId("");
      if (data.success) {
        setTenVung("");
        setDienTich("");
        setTrangThai("");
        setVungId("");
        fetchDataDSVung();
        message.success("Tạo vùng thành công!");
      }
    }
  };

  const handleEditLo = (item) => {
    toggleThemLo();
    setTenLo(item.tenlo);
    setDienTichLo(item.dientichlo);
    setGiong(item.giong);
    setNam(item.nam);
    setTrangThaiTrong(item.trangthaitrong);
    setLoCheId(item.idlo);
    setIsEditLo(true);
  };

  const taoLo = async () => {
    if (loCheId) {
      toggleThemLo();
      const res = await fetch("http://103.163.119.247:33612/lo-u", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenlo: tenlo,
          dientichlo: parseFloat(areaM2),
          giong: giong,
          nam: nam,
          trangthaitrong: trangthaitrong,
          userid: user,
          vungid: vungid,
          // vungid: 1,
          idlo: loCheId,
          geom: JSON.stringify(polygonDraw.geometry),
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setTenLo("");
      setDienTichLo("");
      setGiong("");
      setNam("");
      setTrangThaiTrong("");
      setLoCheId("");
      if (data.success) {
        setTenLo("");
        setDienTichLo("");
        setGiong("");
        setNam("");
        setTrangThaiTrong("");
        setLoCheId("");
        fetchDataDSLoChe();
        message.success("Tạo lô thành công!");
      }
    } else {
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
          vungid: vungid,
          // vungid: 1,
          geom: JSON.stringify(polygonDraw.geometry),
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setTenLo("");
      setDienTichLo("");
      setGiong("");
      setNam("");
      setTrangThaiTrong("");
      setLoCheId("");
      if (data.success) {
        setTenLo("");
        setDienTichLo("");
        setGiong("");
        setNam("");
        setTrangThaiTrong("");
        setLoCheId("");
        fetchDataDSLoChe();
        message.success("Tạo lô thành công!");
      }
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
        loid: loCheId,
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

    if (!mapRef.current) return;

    // Bật/tắt tất cả layer con tương ứng (fill, outline, label, extrude...)
    const layerGroups = {
      vung: ["vung-fill", "vung-outline", "vung-label", "vung-extrude"],
      lo: ["lo-fill", "lo-outline", "lo-label"],
      diem: ["diem-point", "diem-label"],
    };

    const targetLayers = layerGroups[layer] || [layer];

    targetLayers.forEach((id) => {
      if (mapRef.current.getLayer(id)) {
        mapRef.current.setLayoutProperty(
          id,
          "visibility",
          checked ? "visible" : "none"
        );
      }
    });
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

  const vungColumns = [
    { title: "Tên vùng", dataIndex: "tenvung", key: "tenvung" },
    {
      title: "Diện tích",
      dataIndex: "dientich",
      key: "dientich",
    },
    { title: "Trạng thái", dataIndex: "tt", key: "tt" },
    {
      title: "Hành động",
      key: "hanhdong",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditVung(record)}
            title="Sửa"
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteVung(record)}
            title="Xóa"
          />
        </Space>
      ),
    },
  ];

  const nguoiDungColumns = [
    { title: "Tên", dataIndex: "ten", key: "ten" },
    { title: "Tài khoản", dataIndex: "us", key: "us" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Số điện thoại", dataIndex: "sdt", key: "sdt" },
    {
      title: "Hành động",
      key: "hanhdong",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            title="Sửa"
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record)}
            title="Xóa"
          />
        </Space>
      ),
    },
  ];

  const giongColumns = [
    { title: "Tên", dataIndex: "tengiong", key: "tengiong" },
    {
      title: "Hành động",
      key: "hanhdong",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditGiong(record)}
            title="Sửa"
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteGiong(record)}
            title="Xóa"
          />
        </Space>
      ),
    },
  ];
  const loColumns = [
    { title: "Tên lô", dataIndex: "tenlo", key: "tenlo" },
    {
      title: "Diện tích",
      dataIndex: "dientichlo",
      key: "dientichlo",
    },
    { title: "Giống", dataIndex: "giong", key: "giong" },
    { title: "Năm", dataIndex: "nam", key: "nam" },
    {
      title: "Trạng thái trồng",
      dataIndex: "trangthaitrong",
      key: "trangthaitrong",
    },
    {
      title: "Hành động",
      key: "hanhdong",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditLo(record)}
            title="Sửa"
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteLo(record)}
            title="Xóa"
          />
        </Space>
      ),
    },
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

  const fetchDataDSKhuyenCao = async () => {
    try {
      const user = sessionStorage.getItem("user");
      var us = JSON.parse(user);
      console.log("us.data.iduser", us.data.iduser);

      fetch("http://103.163.119.247:33612/khuyencaoquantri")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json(); // Chuyển đổi dữ liệu trả về thành JSON
        })
        .then((data) => {
          if (data.success) {
            setAoiItems(data.data);
          }
        })
        .catch((error) => {
          console.log("error", error);
        });
    } catch (error) {}
  };

  const fetchDataDSGiong = async () => {
    fetch("http://103.163.119.247:33612/giong")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then((data) => {
        if (data.success) {
          setDsGiong(data.data);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });
  };

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
    onGetCurrentWeather();
    onGetDataDiary();
    fetchDataSauBenh();
    fetchDataDSNguoiDung();
    fetchDataDSLoChe();
    fetchDataDSVung();
    fetchDataDSKhuyenCao();
    fetchDataDSGiong();
  }, []);

  useEffect(() => {
    onGetWeather();
    onGetDataChart();
  }, [selectVung]);
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
      const temp =
        weatherData.length &&
        weatherData.map((item) => kelvinToCelsius(item.main.temp));
      const rain =
        weatherData.length &&
        weatherData.map((item) => item?.rain?.["3h"] || 0);
      const ctx = chartWeatherRef.current.getContext("2d");
      console.log("temp", temp);

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

  console.log("weatherData", weatherData);

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

  const toggleThemUser = () => {
    setModalThemUser(!modalThemUser);
    if (!modalThemUser) {
      // Reset form khi mở modal
      setUserEdit(null);
      setIdUser("");
      setTenUser("");
      setTaiKhoan("");
      setMatKhau("");
      setEmail("");
      setSdt("");
      setVaiTro("NGUOIDUNG");
    }
  };

  const handleEditUser = (record) => {
    setUserEdit(record);
    setIdUser(record.iduser);
    setTenUser(record.ten);
    setTaiKhoan(record.us);
    setEmail(record.email);
    setSdt(record.sdt);
    setVaiTro(record.role);
    setModalThemUser(true);
  };

  const taoUser = async () => {
    try {
      setModalThemUser(false);
      const res = await fetch("http://103.163.119.247:33612/dangki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ten: tenUser,
          us: taiKhoan,
          pa: matKhau,
          email: email,
          sdt: sdt,
          role: "NGUOIDUNG",
        }),
      });
      if (res) {
        setUserEdit({});
        setIdUser("");
        setTenUser("");
        setTaiKhoan("");
        setEmail("");
        setSdt("");
        setMatKhau("");
        setVaiTro("");
        setModalThemUser(false);
        message.success("Tạo người dùng thành công!");
        fetchDataDSNguoiDung();
      }
    } catch (err) {
      console.log("Error:", err);
    }
  };

  const suaUser = async () => {
    try {
      setModalThemUser(false);
      const res = await fetch(`http://103.163.119.247:33612/users-u`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iduser: idUser,
          ten: tenUser,
          us: taiKhoan,
          email: email,
          pa: matKhau,
          sdt: sdt,
          role: "NGUOIDUNG",
        }),
      });
      if (res) {
        setUserEdit({});
        setIdUser("");
        setTenUser("");
        setTaiKhoan("");
        setEmail("");
        setSdt("");
        setMatKhau("");
        setVaiTro("");
        setModalThemUser(false);
        message.success("Sửa người dùng thành công!");
        fetchDataDSNguoiDung();
      }
    } catch (err) {
      console.log("Error:", err);
    }
  };

  //Giống
  const toggleThemGiong = () => {
    setModalThemGiong(!modalThemGiong);
    if (!modalThemGiong) {
      // Reset form khi mở modal
      setGiongEdit(null);
      setIdGiong("");
      setTenGiong("");
    }
  };

  const handleEditGiong = (record) => {
    setGiongEdit(record);
    setIdGiong(record.idgiong);
    setTenGiong(record.tengiong);
    setModalThemGiong(true);
  };

  const taoGiong = async () => {
    try {
      setModalThemGiong(false);
      const res = await fetch("http://103.163.119.247:33612/giong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tengiong: tenGiong,
        }),
      });

      if (res.ok) {
        setGiongEdit({});
        setIdGiong("");
        setTenGiong("");
        setModalThemGiong(false);
        fetchDataDSGiong();
        message.success("Tạo giống thành công!");
      }
    } catch (err) {
      console.log("Error:", err);
    }
  };

  const suaGiong = async () => {
    try {
      setModalThemGiong(false);
      const res = await fetch("http://103.163.119.247:33612/giong-u", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idgiong: idGiong,
          tengiong: tenGiong,
        }),
      });

      if (res.ok) {
        setGiongEdit({});
        setIdGiong("");
        setTenGiong("");
        setModalThemGiong(false);
        fetchDataDSGiong();
        message.success("Sửa giống thành công!");
      }
    } catch (err) {
      console.log("Error:", err);
    }
  };

  const handleDeleteLo = async (item) => {
    try {
      const res = await fetch("http://103.163.119.247:33612/lo-d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': 'Bearer your_token_here' nếu cần
        },
        body: JSON.stringify({
          idlo: item.idlo,
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.success) {
        fetchData();
        message.success("Xóa lô thành công!");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleDeleteVung = async (item) => {
    try {
      const res = await fetch("http://103.163.119.247:33612/vung-d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': 'Bearer your_token_here' nếu cần
        },
        body: JSON.stringify({
          idvung: item.idvung,
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.success) {
        fetchData();
        message.success("Xóa vùng thành công!");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleDeleteUser = async (item) => {
    try {
      const res = await fetch("http://103.163.119.247:33612/users-d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': 'Bearer your_token_here' nếu cần
        },
        body: JSON.stringify({
          iduser: item.iduser,
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.success) {
        fetchDataDSNguoiDung();
        message.success("Xóa người dùng thành công!");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleDeleteGiong = async (item) => {
    try {
      const res = await fetch("http://103.163.119.247:33612/giong-d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': 'Bearer your_token_here' nếu cần
        },
        body: JSON.stringify({
          idgiong: item.idgiong,
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.success) {
        fetchDataDSGiong();
        message.success("Xóa giống thành công!");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

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
                <a href="#nonghoPanel">Quản trị nông hộ</a>
                <a href="#vungPanel">Quản trị vùng</a>
                <a href="#giongPanel">Quản trị giống</a>
                <a href="#loPanel">Quản trị lô</a>
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
                <a target="_blank" href="https://thangnn.shinyapps.io/vietao/">
                  <p className="card-label">Năng suất dự báo</p>
                  <h3 className="card-value text-amber-700">
                    {fmt.format(data.yieldAvg)}
                  </h3>
                  <p className="card-desc">tấn/ha</p>
                </a>
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

                    <Tooltip
                      title={
                        !polygonDraw.geometry.coordinates.length ||
                        polygonDraw.geometry.type !== "Polygon"
                          ? "Vui lòng vẽ vùng để tiếp tục"
                          : ""
                      }
                    >
                      <Button
                        type="primary"
                        icon={<RadiusSettingOutlined />}
                        onClick={toggleThemVung}
                        className={isDrawing ? "active-draw" : ""}
                        disabled={
                          !polygonDraw.geometry.coordinates.length ||
                          polygonDraw.geometry.type !== "Polygon"
                        }
                      >
                        Thêm vùng
                      </Button>
                    </Tooltip>
                    <Tooltip
                      title={
                        !polygonDraw.geometry.coordinates.length ||
                        polygonDraw.geometry.type !== "Polygon"
                          ? "Vui lòng vẽ vùng để tiếp tục"
                          : ""
                      }
                    >
                      <Button
                        type="primary"
                        icon={<BlockOutlined />}
                        onClick={toggleThemLo}
                        className={isDrawing ? "active-draw" : ""}
                        disabled={
                          !polygonDraw.geometry.coordinates.length ||
                          polygonDraw.geometry.type !== "Polygon"
                        }
                      >
                        Thêm lô
                      </Button>
                    </Tooltip>
                    <Tooltip
                      title={
                        !polygonDraw.geometry.coordinates.length ||
                        polygonDraw.geometry.type !== "Point"
                          ? "Vui lòng chọn điểm để tiếp tục"
                          : ""
                      }
                    >
                      <Button
                        type="primary"
                        icon={<PushpinOutlined />}
                        onClick={toggleThemDiemQuanTrac}
                        className={isDrawing ? "active-draw" : ""}
                        disabled={
                          !polygonDraw.geometry.coordinates.length ||
                          polygonDraw.geometry.type !== "Point"
                        }
                      >
                        Thêm ĐQT
                      </Button>
                    </Tooltip>
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
                    checked={layerVisibility["vung"]}
                    onChange={(e) =>
                      handleLayerToggle("vung", e.target.checked)
                    }
                  >
                    Vùng chè
                  </Checkbox>
                  <Checkbox
                    checked={layerVisibility["lo"]}
                    onChange={(e) => handleLayerToggle("lo", e.target.checked)}
                  >
                    Lô chè
                  </Checkbox>
                  <Checkbox
                    checked={layerVisibility["diem"]}
                    onChange={(e) =>
                      handleLayerToggle("diem", e.target.checked)
                    }
                  >
                    Điểm quan trắc
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
                  title={isEditVung ? "Sửa vùng" : "Thêm vùng mới"}
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
                        value={areaM2}
                        onChange={(e) => setDienTich(e.target.value)}
                        disabled
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
                  title={isEditLo ? "Sửa lô" : "Thêm lô mới"}
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
                        disabled
                        value={areaM2}
                        onChange={(e) => setDienTichLo(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item label="Giống">
                      <Select
                        placeholder="Ví dụ: Shan, LDP1..."
                        value={giong}
                        onChange={(value) => setGiong(value)}
                      >
                        {dsGiong.map((item, index) => {
                          return (
                            <Option value={item.tengiong} key={index}>
                              {item.tengiong}
                            </Option>
                          );
                        })}
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

                <Modal
                  title={userEdit ? "Sửa nông hộ" : "Tạo nông hộ mới"}
                  open={modalThemUser}
                  onCancel={toggleThemUser}
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
                      label="Họ và tên"
                      required
                      tooltip="Nhập họ và tên đầy đủ"
                    >
                      <Input
                        placeholder="Ví dụ: Nguyễn Văn A"
                        value={tenUser}
                        onChange={(e) => setTenUser(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Tài khoản"
                      required
                      tooltip="Tên đăng nhập của người dùng"
                    >
                      <Input
                        placeholder="Ví dụ: nguyenvana"
                        value={taiKhoan}
                        onChange={(e) => setTaiKhoan(e.target.value)}
                        disabled={userEdit} // Không cho sửa tài khoản khi edit
                      />
                    </Form.Item>

                    <Form.Item
                      label="Mật khẩu"
                      required={!userEdit} // Bắt buộc khi tạo mới, không bắt buộc khi sửa
                      tooltip="Nhập mật khẩu đăng nhập"
                    >
                      <Input.Password
                        placeholder={
                          userEdit
                            ? "Để trống nếu không đổi mật khẩu"
                            : "Nhập mật khẩu"
                        }
                        value={matKhau}
                        onChange={(e) => setMatKhau(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Email"
                      required
                      tooltip="Địa chỉ email liên hệ"
                    >
                      <Input
                        type="email"
                        placeholder="Ví dụ: nguyenvana@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Số điện thoại"
                      required
                      tooltip="Số điện thoại liên hệ"
                    >
                      <Input
                        placeholder="Ví dụ: 0987654321"
                        value={sdt}
                        onChange={(e) => setSdt(e.target.value)}
                      />
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
                        onClick={toggleThemUser}
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
                        onClick={userEdit ? suaUser : taoUser}
                        style={{
                          borderRadius: 6,
                          height: 38,
                          paddingInline: 20,
                          fontWeight: 500,
                        }}
                      >
                        {userEdit ? "Cập nhật" : "Tạo người dùng"}
                      </Button>
                    </div>
                  </Form>
                </Modal>

                <Modal
                  title={giongEdit ? "Sửa giống" : "Tạo giống mới"}
                  open={modalThemGiong}
                  onCancel={toggleThemGiong}
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
                      label="Tên giống"
                      required
                      tooltip="Nhập tên giống chè"
                    >
                      <Input
                        placeholder="Ví dụ: Trà Shan Tuyết Cổ Thụ"
                        value={tenGiong}
                        onChange={(e) => setTenGiong(e.target.value)}
                      />
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
                        onClick={toggleThemGiong}
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
                        onClick={giongEdit ? suaGiong : taoGiong}
                        style={{
                          borderRadius: 6,
                          height: 38,
                          paddingInline: 20,
                          fontWeight: 500,
                        }}
                      >
                        {giongEdit ? "Cập nhật" : "Tạo giống"}
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
              <div id="weatherPanel" className="chart-weather">
                <Card style={{ height: "100%" }}>
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
            </section>
            <section id="aoiPanel">
              <div className="aoi-list">
                <Card>
                  <div className="card-header">
                    <h3>Khuyến cáo vùng (AOI)</h3>
                  </div>
                  <div className="table-container">
                    <table className="aoi-table">
                      <thead>
                        <tr>
                          <th>Nội dung</th>
                          <th>Lịch</th>
                          <th>Thời gian</th>
                          <th>Tên vùng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aoiItems.map((aoi) => (
                          <tr key={aoi.id} className="aoi-row">
                            <td className="aoi-content">{aoi.noidung}</td>
                            <td className="aoi-schedule">{aoi.lich}</td>
                            <td className="aoi-schedule">{aoi.time}</td>
                            <td className="aoi-region">{aoi.tenvung}</td>
                          </tr>
                        ))}
                        {aoiItems.length === 0 && (
                          <tr>
                            <td colSpan="4" className="empty-message">
                              Chưa có khuyến cáo nào
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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

            <section id="nonghoPanel" className="audit-section">
              <Card>
                <div
                  className="card-header"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <h3>Quản trị nông hộ</h3>
                  <Button
                    type="primary"
                    icon={<PlusCircleFilled />}
                    onClick={toggleThemUser}
                    style={{ width: 200 }}
                  >
                    Thêm nông hộ
                  </Button>
                </div>
                <Table
                  dataSource={dsNguoiDung.filter(
                    (user) => user.role === "NGUOIDUNG"
                  )}
                  columns={nguoiDungColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </section>

            <section id="vungPanel" className="audit-section">
              <Card>
                <div className="card-header">
                  <h3>Quản trị vùng</h3>
                </div>
                <Table
                  dataSource={dsVung}
                  columns={vungColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </section>

            <section id="giongPanel" className="audit-section">
              <Card>
                <div
                  className="card-header"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <h3>Quản trị giống</h3>
                  <Button
                    type="primary"
                    icon={<PlusCircleFilled />}
                    onClick={toggleThemGiong}
                    style={{ width: 200 }}
                  >
                    Thêm giống
                  </Button>
                </div>
                <Table
                  dataSource={dsGiong}
                  columns={giongColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </section>

            <section id="loPanel" className="audit-section">
              <Card>
                <div className="card-header">
                  <h3>Quản trị lô</h3>
                </div>
                <Table
                  dataSource={dsLoChe}
                  columns={loColumns}
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

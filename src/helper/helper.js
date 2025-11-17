export const kelvinToCelsius = (kelvin) => {
  return Number(kelvin - 273.15).toFixed(2);
};

export const formatDay = (dateString) => {
  const date = new Date(dateString);
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dayName = days[date.getDay()];
  const formattedDate = date.toLocaleDateString("vi-VN");
  return `${dayName}, ${formattedDate}`;
};

export const formatWeather = (current) => {
  const weatherStr = String(current);
  console.log("current", current);

  if (weatherStr.includes("Clear")) {
    return "☀️ Trời nắng";
  } else if (weatherStr.toLowerCase().includes("clouds")) {
    return "⛅ Nhiều mây";
  } else if (weatherStr.toLowerCase().includes("rain")) {
    return "🌧️ Mưa";
  } else if (weatherStr.toLowerCase().includes("drizzle")) {
    return "🌦️ Mưa phùn";
  } else if (weatherStr.toLowerCase().includes("thunderstorm")) {
    return "⛈️ Giông bão";
  } else if (weatherStr.toLowerCase().includes("snow")) {
    return "❄️ Tuyết";
  } else if (weatherStr.toLowerCase().includes("mist")) {
    return "🌫️ Sương mù";
  } else if (weatherStr.toLowerCase().includes("smoke")) {
    return "💨 Khói";
  } else if (weatherStr.toLowerCase().includes("haze")) {
    return "😶‍🌫️ Mù nhẹ";
  } else if (weatherStr.toLowerCase().includes("dust")) {
    return "💨 Bụi";
  } else if (weatherStr.toLowerCase().includes("fog")) {
    return "🌁 Sương mù dày";
  } else if (weatherStr.toLowerCase().includes("sand")) {
    return "🌪️ Bão cát";
  } else if (weatherStr.toLowerCase().includes("ash")) {
    return "🌋 Tro núi lửa";
  } else if (weatherStr.toLowerCase().includes("squall")) {
    return "💨 Gió giật";
  } else if (weatherStr.toLowerCase().includes("tornado")) {
    return "🌪️ Lốc xoáy";
  } else {
    return "🌈 Thời tiết bình thường";
  }
};

export function onlyDate(dt) {
  return new Date(dt).toLocaleDateString("vi-VN");
}

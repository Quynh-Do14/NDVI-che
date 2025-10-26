import React, { useState } from 'react'

const KhuyenNghiThoiTiet = ({ activeTab }) => {
  const [adviceData, setAdviceData] = useState([])
  const [weatherData, setWeatherData] = useState([])

  return (
    <div
      id='tab-advice'
      className={`tab-content ${activeTab === 'advice' ? 'active' : ''}`}
    >
      <div className='list' id='advice-list'>
        {adviceData.map((advice, index) => (
          <div key={index} className='item'>
            <h4>
              📣 {advice.title} · {advice.time}
            </h4>
            <p>
              Lô: {advice.plot} · {advice.note}
            </p>
          </div>
        ))}
      </div>
      <hr />
      <div className='list' id='weather-list'>
        {weatherData.map((weather, index) => (
          <div key={index} className='item'>
            <h4>☁️ {weather.day}</h4>
            <p>
              Tmin/Tmax: {weather.tmin}–{weather.tmax}°C · Mưa: {weather.rain}mm
              · RH: {weather.rh}% · GDD: {weather.gdd} · ETo: {weather.eto}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KhuyenNghiThoiTiet

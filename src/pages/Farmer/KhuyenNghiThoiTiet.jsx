import React, { useState, useEffect } from 'react'
import { formatWeather } from '../../helper/helper'

const KhuyenNghiThoiTiet = ({ activeTab }) => {
  const [weatherData, setWeatherData] = useState([])
  const [loading, setLoading] = useState(true)
  const [recommend, setRecommend] = useState([])

  const formatDay = dateString => {
    const date = new Date(dateString)
    const days = [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy'
    ]
    return `${days[date.getDay()]}, ${date.toLocaleDateString('vi-VN')}`
  }

  // Nhóm dữ liệu theo ngày để lấy 7 ngày
  const groupByDay = list => {
    const grouped = {}
    list.forEach(item => {
      const date = item.dt_txt.split(' ')[0] // Lấy phần YYYY-MM-DD
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(item)
    })
    return Object.values(grouped).slice(0, 7) // Lấy 7 ngày đầu
  }

  const getDailyData = dayData => {
    const temps = dayData.map(item => item.main.temp)
    const humidity = dayData[0].main.humidity // Lấy độ ẩm đầu ngày
    const rain = dayData.reduce(
      (sum, item) => sum + (item.rain?.['3h'] || 0),
      0
    )

    return {
      date: dayData[0].dt_txt,
      temp_min: Math.min(...temps),
      temp_max: Math.max(...temps),
      humidity: humidity,
      rain: rain,
      description: dayData[0].weather[0].description
    }
  }

  const onGetDataRecommend = async () => {
    const user = localStorage.getItem('user')
    var us = JSON.parse(user)
    fetch('http://103.163.119.247:33612/khuyencao?userid=' + us.data.iduser)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json() // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then(data => {
        if (data.success) {
          setRecommend(data.data)
        }
      })
      .catch(error => {
        console.log('error', error)
      })
  }

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.openweathermap.org/data/2.5/forecast?lat=21.0245&lon=105.8412&appid=723262eea804eb2695383fc4d482da35&units=metric'
        )
        const data = await res.json()

        const dailyData = groupByDay(data.list).map(getDailyData)
        setWeatherData(dailyData)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    onGetDataRecommend()
  }, [])

  if (loading) return <div>Đang tải...</div>

  return (
    <div
      id='tab-advice'
      className={`tab-content ${activeTab === 'advice' ? 'active' : ''}`}
    >
      <div className='list' id='advice-list'>
        {recommend.map((advice, index) => (
          <div key={index} className='item'>
            <h4>
              📣 {advice.tenvung} · {advice.lich}
            </h4>
            <p>{advice.noidung}</p>
          </div>
        ))}
      </div>
      <hr />
      <div className='list' id='weather-list'>
        <h3>Dự báo thời tiết 7 ngày</h3>
        {weatherData.map((day, index) => {
          return (
            <div key={index} className='item'>
              <h4>
                {formatWeather(day.description)} {formatDay(day.date)}
              </h4>
              <p>
                Nhiệt độ: {Math.round(day.temp_min)}–{Math.round(day.temp_max)}
                °C · Mưa: {day.rain.toFixed(1)}mm · Độ ẩm: {day.humidity}%
              </p>
              <p>Mô tả: {day.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default KhuyenNghiThoiTiet

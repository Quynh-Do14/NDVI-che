import { formatNumber } from 'chart.js/helpers'
import React, { useEffect, useState } from 'react'

const Thongkenhatky = ({ activeTab }) => {
  const [dataStatic, setDataStatic] = useState({})
  const onGetDataStatic = async () => {
    fetch('http://103.163.119.247:33612/thongkenhatky')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json() // Chuyển đổi dữ liệu trả về thành JSON
      })
      .then(data => {
        if (data.success) {
          setDataStatic(data.data[0])
        }
      })
      .catch(error => {
        console.log('error', error)
      })
  }

  useEffect(() => {
    onGetDataStatic()
  }, [])

  return (
    <div
      id='tab-stats'
      className={`tab-content ${activeTab === 'stats' ? 'active' : ''}`}
    >
      <div className='kpi'>
        <div className='metric'>
          <h5>Tổng chi phí</h5>
          <div className='val'>{formatNumber(dataStatic.tong_chi_phi)}</div>
        </div>
        <div className='metric'>
          <h5>Số nhật ký</h5>
          <div className='val'>{dataStatic.so_luong_nhat_ky}</div>
        </div>
        <div className='metric'>
          <h5>Chi phí trung bình</h5>
          <div className='val'>
            {formatNumber(dataStatic.chi_phi_trung_binh)}
          </div>
        </div>
      </div>
      <div className='chart-note'>
        (Biểu đồ chỉ minh họa, kết nối backend sẽ vẽ động)
      </div>
    </div>
  )
}

export default Thongkenhatky

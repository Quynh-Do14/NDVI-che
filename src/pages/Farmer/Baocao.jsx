import React, { useState } from 'react'

const Baocao = ({ activeTab }) => {
  const [incidentForm, setIncidentForm] = useState({
    type: 'sau-benh',
    plot: '',
    desc: '',
    lat: '',
    long: '',
    status: '',
    level: ''
  })
  const [anh, setAnh] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setIncidentForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = e => {
    if (e.target.files && e.target.files[0]) {
      setAnh(e.target.files[0])
    }
  }

  const handleIncidentSubmit = async e => {
    e.preventDefault()
    
    try {
      const formData = new FormData()
      formData.append('ngay', new Date().toISOString().split('T')[0])
      formData.append('lo', incidentForm.plot)
      formData.append('long', incidentForm.long)
      formData.append('lat', incidentForm.lat)
      formData.append('mucdo', incidentForm.level)
      formData.append('trangthai', incidentForm.status)
      formData.append('mota', incidentForm.desc)
      
      if (anh) {
        formData.append('saubenh', anh)
      }

      const res = await fetch('http://103.163.119.247:33612/saubenh', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error('Upload failed')
      
      const data = await res.json()
      console.log('Response:', data)
      
      if (data.success) {
        // Reset form sau khi thành công
        setIncidentForm({
          type: 'sau-benh',
          plot: '',
          desc: '',
          lat: '',
          long: '',
          status: '',
          level: ''
        })
        setAnh(null)
        
        const fileInput = document.querySelector('input[type="file"]')
        if (fileInput) fileInput.value = ''
        
        alert('Gửi báo cáo thành công!')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Lỗi khi gửi báo cáo!')
    }
  }

  const handleReset = () => {
    setIncidentForm({
      type: 'sau-benh',
      plot: '',
      desc: '',
      lat: '',
      long: '',
      status: '',
      level: ''
    })
    setAnh(null)
    
    const fileInput = document.querySelector('input[type="file"]')
    if (fileInput) fileInput.value = ''
  }

  const plots = [
    {
      id: 1,
      name: 'PO1 - Lô PO1'
    },
    {
      id: 2,
      name: 'PO2 - Lô PO2'
    },
    {
      id: 3,
      name: 'PO3 - Lô PO3'
    },
    {
      id: 4,
      name: 'PO4 - Lô PO4'
    },
    {
      id: 5,
      name: 'PO5 - Lô PO5'
    },
    {
      id: 6,
      name: 'PO6 - Lô PO6'
    }
  ]

  return (
    <div
      id='tab-report'
      className={`tab-content ${activeTab === 'report' ? 'active' : ''}`}
    >
      <form id='form-incident' onSubmit={handleIncidentSubmit}>
        <div className='row'>
          <div>
            <label>Loại sự cố</label>
            <select
              name='type'
              value={incidentForm.type}
              onChange={handleInputChange}
              required
            >
              <option value='sau-benh'>Sâu bệnh</option>
              <option value='ung'>Úng</option>
              <option value='han'>Hạn</option>
              <option value='suong-muoi'>Sương muối</option>
              <option value='khac'>Khác</option>
            </select>
          </div>
          <div>
            <label>Lô chè</label>
            <select
              name='plot'
              value={incidentForm.plot}
              onChange={handleInputChange}
            >
              <option value=''>Chọn lô</option>
              {plots.map(plot => (
                <option key={plot.id} value={plot.id}>
                  {plot.id} – {plot.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='row'>
          <div>
            <label>Trạng thái</label>
            <select
              name='status'
              value={incidentForm.status}
              onChange={handleInputChange}
            >
              <option value=''>Chọn trạng thái</option>
              <option value='moi-phat-hien'>Mới phát hiện</option>
              <option value='dang-xu-ly'>Đang xử lý</option>
              <option value='da-xu-ly'>Đã xử lý</option>
            </select>
          </div>
          <div>
            <label>Mức độ</label>
            <select
              name='level'
              value={incidentForm.level}
              onChange={handleInputChange}
            >
              <option value=''>Chọn mức độ</option>
              <option value='nhe'>Nhẹ</option>
              <option value='trung-binh'>Trung bình</option>
              <option value='nang'>Nặng</option>
            </select>
          </div>
        </div>

        <label>Mô tả</label>
        <textarea
          name='desc'
          value={incidentForm.desc}
          onChange={handleInputChange}
          placeholder='Triệu chứng, mức độ...'
          rows={3}
        />

        <div className='row'>
          <div>
            <label>Vĩ độ</label>
            <input
              type='text'
              name='lat'
              value={incidentForm.lat}
              placeholder='Nhập vĩ độ'
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Kinh độ</label>
            <input
              type='text'
              name='long'
              value={incidentForm.long}
              placeholder='Nhập kinh độ'
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Ảnh hiện trường</label>
            <input type='file' accept='image/*' onChange={handleFileChange} />
            {anh && (
              <span style={{ fontSize: '12px', color: '#666' }}>
                Đã chọn: {anh.name}
              </span>
            )}
          </div>
        </div>

        <div className='form-actions'>
          <button className='btn' type='submit'>
            Gửi báo cáo
          </button>
          <button
            className='btn ghost'
            type='button'
            onClick={handleReset}
          >
            Xóa
          </button>
        </div>
      </form>
    </div>
  )
}

export default Baocao
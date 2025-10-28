import React, { useState } from 'react'

const Nhatky = () => {
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'tuoi',
    cost: null,
    plot: '',
    note: '',
    lat: '',
    long: ''
  })
  const [anh, setAnh] = useState(null)

  // Sửa hàm handleInputChange - bỏ currying
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setLogForm(prev => ({ 
      ...prev, 
      [name]: name === 'cost' ? Number(value) : value 
    }))
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAnh(e.target.files[0])
    }
  }

  const handleLogSubmit = async (e) => {
    e.preventDefault()

    try {
      const formData = new FormData()

      // Thêm các trường dữ liệu vào formData
      formData.append('date', logForm.date)
      formData.append('hanhdong', logForm.type)
      formData.append('chiphi', logForm.cost.toString())
      formData.append('noidung', logForm.note)
      formData.append('lat', logForm.lat)
      formData.append('long', logForm.long)
      formData.append('loid', logForm.plot)

      // Chỉ thêm ảnh nếu có
      if (anh) {
        formData.append('nhatky', anh)
      }

      const res = await fetch('http://103.163.119.247:33612/nhatky', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)

      const data = await res.json()
      console.log('Response:', data)

      if (data.success) {
        // Reset form sau khi thành công
        handleReset()
        alert('Lưu nhật ký thành công!')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Lỗi khi lưu nhật ký!')
    }
  }

  const handleReset = () => {
    setLogForm({
      date: new Date().toISOString().split('T')[0],
      type: 'tuoi',
      cost: null,
      plot: '',
      note: '',
      lat: '',
      long: ''
    })
    setAnh(null)

    // Reset file input
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
    <form id='form-log' onSubmit={handleLogSubmit}>
      <div className='row'>
        <div>
          <label>Ngày thực hiện</label>
          <input
            type='date'
            name='date'
            value={logForm.date}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Loại công việc</label>
          <select
            name='type'
            value={logForm.type}
            onChange={handleInputChange}
            required
          >
            <option value='tuoi'>Tưới</option>
            <option value='bon'>Bón phân</option>
            <option value='phun'>Phun thuốc</option>
            <option value='thu-hai'>Thu hái</option>
          </select>
        </div>
      </div>

      <div className='row'>
        <div>
          <label>Chi phí (VNĐ)</label>
          <input
            type='number'
            name='cost'
            value={logForm.cost}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Lô chè</label>
          <select
            name='plot'
            value={logForm.plot}
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

      <label>Ghi chú</label>
      <textarea
        name='note'
        value={logForm.note}
        onChange={handleInputChange}
        placeholder='Mô tả chi tiết công việc...'
        id='log-note'
        rows={3}
      />

      <div className='row'>
        <div>
          <label>Vĩ độ</label>
          <input
            type='text'
            name='lat'
            value={logForm.lat}
            placeholder='Nhập vĩ độ'
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Kinh độ</label>
          <input
            type='text'
            name='long'
            value={logForm.long}
            placeholder='Nhập kinh độ'
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Ảnh hiện trường</label>
          <input 
            type='file' 
            accept='image/*' 
            onChange={handleFileChange} 
          />
          {anh && (
            <span style={{ fontSize: '12px', color: '#666' }}>
              Đã chọn: {anh.name}
            </span>
          )}
        </div>
      </div>

      <div className='form-actions'>
        <button className='btn' type='submit'>
          Lưu nhật ký
        </button>
        <button className='btn ghost' type='button' onClick={handleReset}>
          Xóa
        </button>
      </div>
    </form>
  )
}

export default Nhatky
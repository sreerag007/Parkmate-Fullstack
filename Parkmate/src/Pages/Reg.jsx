import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Reg.scss'

// ✅ Updated to match backend VEHICLE_CHOICES
const vehicleTypes = ['Hatchback', 'Sedan', 'Multi-Axle', 'Three-Wheeler', 'Two-Wheeler']

export default function Reg() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', vehicleNum: '', vehicleType: 'Sedan'
  })
  const [error, setError] = useState('')

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validate = () => {
    if (!form.firstName || !form.lastName) return 'Please enter your full name'
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Enter a valid email'
    if (!form.phone || form.phone.length < 7) return 'Enter a valid phone number'
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters'
    if (!form.vehicleNum) return 'Enter your vehicle number'
    return ''
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const err = validate()
    if (err) return setError(err)

    const user = { ...form, createdAt: Date.now() }
    try {
      localStorage.setItem('parkmate_user', JSON.stringify(user))
      localStorage.setItem('parkmate_logged_in', user.email)
      // link client id to email for bookings convenience
      localStorage.setItem('parkmate_client_id', user.email)
      navigate('/profile')
    } catch {
      setError('Could not save user in browser storage')
    }
  }

  return (
    <div className="reg-page container">
      <form className="form card" onSubmit={onSubmit}>
        <h2>Create account</h2>
        {error && <div className="form-error">{error}</div>}

        <div className="row">
          <label>
            <span>First name</span>
            <input name="firstName" value={form.firstName} onChange={onChange} />
          </label>
          <label>
            <span>Last name</span>
            <input name="lastName" value={form.lastName} onChange={onChange} />
          </label>
        </div>

        <label>
          <span>Email</span>
          <input name="email" value={form.email} onChange={onChange} />
        </label>

        <label>
          <span>Phone</span>
          <input name="phone" value={form.phone} onChange={onChange} />
        </label>

        <label>
          <span>Password</span>
          <input type="password" name="password" value={form.password} onChange={onChange} />
        </label>

        <label>
          <span>Vehicle number</span>
          <input name="vehicleNum" value={form.vehicleNum} onChange={onChange} />
        </label>

        <label>
          <span>Vehicle type</span>
          <select name="vehicleType" value={form.vehicleType} onChange={onChange}>
            {vehicleTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <div className="form-actions">
          <button className="btn primary" type="submit">Create account</button>
        </div>
      </form>
    </div>
  )
}

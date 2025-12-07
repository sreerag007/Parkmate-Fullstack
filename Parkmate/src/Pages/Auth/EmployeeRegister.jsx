import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import parkingService from '../../services/parkingService'
import './EmployeeRegister.scss'

const EmployeeRegister = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        phone: '',
        latitude: '',
        longitude: '',
        driving_license: '',
        driving_license_image: null
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [fileName, setFileName] = useState('')

    const handleChange = (e) => {
        const { name, value, files } = e.target
        if (name === 'driving_license_image') {
            const file = files[0]
            setFormData(prev => ({ ...prev, [name]: file }))
            setFileName(file ? file.name : '')
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const _result = await parkingService.createEmployee(formData)
            setSuccess(true)
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data || 'Registration failed. Please try again.'
            setError(typeof errorMsg === 'object' 
                ? Object.entries(errorMsg).map(([key, val]) => `${key}: ${val}`).join(', ')
                : errorMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="employee-register-container">
            <div className="register-background">
                <div className="circle circle-1"></div>
                <div className="circle circle-2"></div>
                <div className="circle circle-3"></div>
            </div>

            <div className="employee-register-card">
                <div className="register-header">
                    <div className="icon-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <h1>Employee Registration</h1>
                    <p className="subtitle">Join the Parkmate team as a parking attendant</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <svg className="alert-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <svg className="alert-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>Registration successful! Contact an Owner/Admin for lot assignment. Redirecting...</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="employee-register-form">
                    <div className="form-section">
                        <h3 className="section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Personal Information
                        </h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstname">
                                    First Name <span className="required">*</span>
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        id="firstname"
                                        type="text"
                                        name="firstname"
                                        value={formData.firstname}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                        placeholder="John"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastname">
                                    Last Name <span className="required">*</span>
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        id="lastname"
                                        type="text"
                                        name="lastname"
                                        value={formData.lastname}
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                Phone Number <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder="9876543210"
                                    pattern="[0-9]{10}"
                                />
                            </div>
                            <span className="input-hint">Enter 10-digit mobile number</span>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            Location (Optional)
                        </h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="latitude">Latitude</label>
                                <div className="input-wrapper">
                                    <input
                                        id="latitude"
                                        type="text"
                                        name="latitude"
                                        value={formData.latitude}
                                        onChange={handleChange}
                                        disabled={loading}
                                        placeholder="9.931233"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="longitude">Longitude</label>
                                <div className="input-wrapper">
                                    <input
                                        id="longitude"
                                        type="text"
                                        name="longitude"
                                        value={formData.longitude}
                                        onChange={handleChange}
                                        disabled={loading}
                                        placeholder="76.267303"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                <line x1="2" y1="10" x2="22" y2="10"></line>
                            </svg>
                            Driving License
                        </h3>

                        <div className="form-group">
                            <label htmlFor="driving_license">
                                License Number <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <input
                                    id="driving_license"
                                    type="text"
                                    name="driving_license"
                                    value={formData.driving_license}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder="KL0820190012345"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="driving_license_image">
                                Upload License Image <span className="required">*</span>
                            </label>
                            <div className="file-upload-wrapper">
                                <input
                                    id="driving_license_image"
                                    type="file"
                                    name="driving_license_image"
                                    onChange={handleChange}
                                    accept="image/*"
                                    required
                                    disabled={loading}
                                    className="file-input-hidden"
                                />
                                <label htmlFor="driving_license_image" className="file-upload-label">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    <span>{fileName || 'Choose file or drag here'}</span>
                                </label>
                            </div>
                            <span className="input-hint">Accepted formats: JPG, PNG, PDF (Max 5MB)</span>
                        </div>
                    </div>

                    <button type="submit" className="btn-register" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                <span>Registering...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <polyline points="16 11 18 13 22 9"></polyline>
                                </svg>
                                <span>Register as Employee</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="register-footer">
                    <div className="divider">
                        <span>Already have an account?</span>
                    </div>
                    <Link to="/login" className="link-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                        Sign In
                    </Link>
                    <Link to="/register" className="link-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Register as User
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default EmployeeRegister

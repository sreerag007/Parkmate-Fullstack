import React, { useState, useEffect } from 'react'
import parkingService from '../../services/parkingService'
import api from '../../services/api'
import './Owner.scss'

const OwnerEmployees = () => {
    const [employees, setEmployees] = useState([])
    const [allEmployees, setAllEmployees] = useState([]) // All unassigned employees
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [showUnassignModal, setShowUnassignModal] = useState(false)
    const [unassigningEmployeeId, setUnassigningEmployeeId] = useState(null)
    const [showLicenseModal, setShowLicenseModal] = useState(false)
    const [viewingLicense, setViewingLicense] = useState(null)
    const [showAssignmentsModal, setShowAssignmentsModal] = useState(false)
    const [viewingAssignments, setViewingAssignments] = useState(null)
    const [employeeBookings, setEmployeeBookings] = useState([])
    const [loadingBookings, setLoadingBookings] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            // Fetch all employees to get the owner's employees and unassigned ones
            const employeesData = await parkingService.getEmployees()
            
            console.log('📊 All employees data:', employeesData)
            
            // Get owner ID
            const ownerId = parseInt(localStorage.getItem('ownerId'))
            console.log('👤 Current owner ID:', ownerId)
            
            // Filter employees assigned to this owner
            const myEmployees = employeesData.filter(emp => emp.owner === ownerId)
            console.log('✅ My employees:', myEmployees)
            
            // Filter unassigned employees (owner is null or undefined)
            const unassignedEmployees = employeesData.filter(emp => emp.owner === null || emp.owner === undefined)
            console.log('📋 Unassigned employees:', unassignedEmployees)
            
            setEmployees(myEmployees || [])
            setAllEmployees(unassignedEmployees || [])
            setError(null)
        } catch (err) {
            console.error('Error fetching employees:', err)
            setError('Failed to load employees')
        } finally {
            setLoading(false)
        }
    }

    const handleAssignEmployee = async (employeeId) => {
        try {
            setActionLoading(true)
            const ownerId = parseInt(localStorage.getItem('ownerId'))
            
            await api.patch(`/employees/${employeeId}/`, {
                owner: ownerId
            })

            // Refresh data
            await fetchData()
            
            setShowAddModal(false)
            setSelectedEmployee(null)
            setSuccessMessage('Employee assigned successfully!')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error('Error assigning employee:', err)
            setError('Failed to assign employee. Make sure you have permission.')
            setTimeout(() => setError(null), 3000)
        } finally {
            setActionLoading(false)
        }
    }

    const handleUnassignEmployee = async () => {
        try {
            setActionLoading(true)
            
            await api.patch(`/employees/${unassigningEmployeeId}/`, {
                owner: null
            })

            // Refresh data
            await fetchData()
            
            setShowUnassignModal(false)
            setUnassigningEmployeeId(null)
            setSuccessMessage('Employee unassigned successfully!')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error('Error unassigning employee:', err)
            setError('Failed to unassign employee')
            setTimeout(() => setError(null), 3000)
        } finally {
            setActionLoading(false)
        }
    }

    const fetchEmployeeBookings = async (employeeId, employeeName) => {
        try {
            setLoadingBookings(true)
            setViewingAssignments({ id: employeeId, name: employeeName })
            setShowAssignmentsModal(true)
            
            // Fetch BOTH standalone car wash bookings AND add-on car wash services
            const [standaloneResponse, addonResponse] = await Promise.all([
                api.get('/owner/carwash-bookings/'),  // Standalone bookings
                api.get('/carwashes/owner_services/')  // Add-on services
            ])
            
            console.log('📊 Standalone car wash bookings:', standaloneResponse.data)
            console.log('📊 Add-on car wash services:', addonResponse.data)
            
            // Filter standalone bookings for this employee - ONLY ACTIVE STATUSES
            const standaloneBookings = standaloneResponse.data.filter(booking => {
                // Only show active bookings: pending, confirmed, in_progress
                const isActive = ['pending', 'confirmed', 'in_progress'].includes(booking.status)
                const isAssignedToEmployee = booking.employee_detail && booking.employee_detail.employee_id === employeeId
                return isActive && isAssignedToEmployee
            }).map(booking => ({
                ...booking,
                type: 'standalone',
                booking_id: booking.carwash_booking_id,
                customer_name: `${booking.user_detail.firstname} ${booking.user_detail.lastname}`,
                service: booking.service_type,
                time: booking.scheduled_time,
                status: booking.status,
                price: booking.price
            }))
            
            // Filter add-on services for this employee - ONLY ACTIVE BOOKINGS
            const addonServices = (addonResponse.data.carwashes || addonResponse.data).filter(service => {
                // Only show add-on services where parent booking is active
                const bookingStatus = service.booking_read?.status
                const isActive = ['booked', 'active'].includes(bookingStatus)
                const isAssignedToEmployee = service.employee_read && service.employee_read.employee_id === employeeId
                return isActive && isAssignedToEmployee
            }).map(service => ({
                ...service,
                type: 'addon',
                booking_id: service.carwash_id,
                customer_name: service.user_read ? `${service.user_read.firstname} ${service.user_read.lastname}` : 'N/A',
                service: service.carwash_type_read?.name || 'Car Wash',
                time: service.booking_read?.booking_time,
                status: service.booking_read?.status || 'unknown',
                price: service.price
            }))
            
            // Combine both types
            const allBookings = [...standaloneBookings, ...addonServices]
            console.log('✅ ACTIVE employee assignments:', allBookings.length, '(Standalone:', standaloneBookings.length, ', Add-on:', addonServices.length, ')')
            
            setEmployeeBookings(allBookings)
        } catch (err) {
            console.error('Error fetching employee bookings:', err)
            setError('Failed to load employee assignments')
            setTimeout(() => setError(null), 3000)
        } finally {
            setLoadingBookings(false)
        }
    }

    const filteredEmployees = employees.filter(emp =>
        (emp.firstname?.toLowerCase() + ' ' + emp.lastname?.toLowerCase()).includes(searchTerm.toLowerCase()) ||
        emp.phone?.includes(searchTerm)
    )

    return (
        <>
        <div className="owner-page">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '24px', flexWrap: 'wrap' }}>
                    <div>
                        <h1>👥 Manage Employees</h1>
                        <p>My Employees: {employees.length} | Available to Assign: {allEmployees.length}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Search my employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                width: '250px',
                                maxWidth: '100%'
                            }}
                        />
                        <button
                            className="btn-primary"
                            onClick={() => setShowAddModal(true)}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            + Assign Employee
                        </button>
                    </div>
                </div>
            </div>

            {successMessage && (
                <div style={{
                    padding: '16px',
                    background: '#d1fae5',
                    border: '1px solid #6ee7b7',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: '#065f46',
                    fontWeight: '600'
                }}>
                    ✅ {successMessage}
                </div>
            )}

            {error && (
                <div style={{
                    padding: '16px',
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: '#991b1b',
                    fontWeight: '600'
                }}>
                    ❌ {error}
                </div>
            )}

            {/* Add Employee Modal */}
            {showAddModal && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => !actionLoading && setShowAddModal(false)}
                >
                    <div 
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>Assign Employee to Your Team</h2>
                            <button 
                                onClick={() => !actionLoading && setShowAddModal(false)}
                                disabled={actionLoading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <p style={{ color: '#64748b', marginBottom: '16px' }}>
                            Select from available unassigned employees:
                        </p>

                        {allEmployees.length === 0 ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '40px', 
                                background: '#f8fafc', 
                                borderRadius: '8px',
                                color: '#64748b'
                            }}>
                                <p style={{ fontSize: '2rem', margin: '0 0 12px 0' }}>👥</p>
                                <p style={{ margin: 0 }}>No unassigned employees available</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                                {allEmployees.map(emp => (
                                    <div 
                                        key={emp.employee_id}
                                        style={{
                                            padding: '16px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: selectedEmployee === emp.employee_id ? '#f0f9ff' : '#fff',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setSelectedEmployee(emp.employee_id)}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                                {emp.firstname} {emp.lastname}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px' }}>
                                                📱 {emp.phone}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                🪪 {emp.driving_license}
                                                {emp.driving_license_image && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setViewingLicense(emp)
                                                            setShowLicenseModal(true)
                                                        }}
                                                        style={{
                                                            padding: '4px 12px',
                                                            background: '#3b82f6',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        View License
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleAssignEmployee(emp.employee_id)
                                            }}
                                            disabled={actionLoading}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#10b981',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontWeight: '600',
                                                cursor: actionLoading ? 'wait' : 'pointer'
                                            }}
                                        >
                                            {actionLoading ? 'Assigning...' : 'Assign'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowAddModal(false)}
                                disabled={actionLoading}
                                style={{
                                    padding: '12px 24px',
                                    background: '#e2e8f0',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unassign Confirmation Modal */}
            {showUnassignModal && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => !actionLoading && setShowUnassignModal(false)}
                >
                    <div 
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '400px',
                            width: '90%'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ marginTop: 0 }}>Confirm Unassignment</h2>
                        <p style={{ color: '#64748b' }}>
                            Are you sure you want to remove this employee from your team? They will become available for other owners to assign.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                onClick={() => setShowUnassignModal(false)}
                                disabled={actionLoading}
                                style={{
                                    padding: '12px 24px',
                                    background: '#e2e8f0',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUnassignEmployee}
                                disabled={actionLoading}
                                style={{
                                    padding: '12px 24px',
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: actionLoading ? 'wait' : 'pointer'
                                }}
                            >
                                {actionLoading ? 'Removing...' : 'Remove Employee'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
                    <p>Loading employees...</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Name</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Phone</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>License</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Workload</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp, index) => (
                                    <tr key={emp.employee_id} style={{ borderTop: index > 0 ? '1px solid #e2e8f0' : 'none' }}>
                                        <td style={{ padding: '16px', fontWeight: '600' }}>
                                            {emp.firstname} {emp.lastname}
                                        </td>
                                        <td style={{ padding: '16px', color: '#64748b' }}>{emp.phone || 'N/A'}</td>
                                        <td style={{ padding: '16px', color: '#64748b' }}>{emp.driving_license || 'N/A'}</td>
                                        <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: emp.availability_status === 'available' ? '#dcfce7' : 
                                                           emp.availability_status === 'busy' ? '#fef3c7' : '#fee2e2',
                                                color: emp.availability_status === 'available' ? '#166534' : 
                                                       emp.availability_status === 'busy' ? '#854d0e' : '#991b1b',
                                                display: 'inline-block'
                                            }}>
                                                {emp.availability_status === 'available' ? '✅ Available' :
                                                 emp.availability_status === 'busy' ? '⏳ Busy' : '🔴 Offline'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#64748b' }}>
                                            {emp.current_assignments || 0} active
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => fetchEmployeeBookings(emp.employee_id, `${emp.firstname} ${emp.lastname}`)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: '#dbeafe',
                                                        color: '#1e40af',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    📋 Assignments
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setUnassigningEmployeeId(emp.employee_id)
                                                        setShowUnassignModal(true)
                                                    }}
                                                    disabled={actionLoading}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: '#fee2e2',
                                                        color: '#dc2626',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👥</div>
                                        <p style={{ margin: 0 }}>
                                            {searchTerm ? 'No employees match your search' : 'No employees assigned yet. Click "Assign Employee" to add one.'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}
        </div>

        {/* License Viewing Modal */}
        {showLicenseModal && viewingLicense && (
            <div 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}
                onClick={() => setShowLicenseModal(false)}
            >
                <div 
                    style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ margin: '0 0 8px 0' }}>Driving License Verification</h2>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                                {viewingLicense.firstname} {viewingLicense.lastname}
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowLicenseModal(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: '#64748b'
                            }}
                        >
                            &times;
                        </button>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>
                            License Number
                        </label>
                        <div style={{ 
                            padding: '12px 16px', 
                            background: '#f8fafc', 
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '1.1rem',
                            letterSpacing: '0.05em'
                        }}>
                            {viewingLicense.driving_license}
                        </div>
                    </div>

                    {viewingLicense.driving_license_image ? (
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>
                                License Image
                            </label>
                            <div style={{ 
                                border: '2px solid #e2e8f0', 
                                borderRadius: '8px', 
                                overflow: 'hidden',
                                background: '#f8fafc'
                            }}>
                                <img 
                                    src={viewingLicense.driving_license_image.startsWith('http') 
                                        ? viewingLicense.driving_license_image 
                                        : `http://127.0.0.1:8000${viewingLicense.driving_license_image}`}
                                    alt="Driving License"
                                    style={{ 
                                        width: '100%', 
                                        height: 'auto',
                                        display: 'block'
                                    }}
                                    onError={(e) => {
                                        console.error('Failed to load license image:', viewingLicense.driving_license_image)
                                        e.target.style.display = 'none'
                                        e.target.nextSibling.style.display = 'block'
                                    }}
                                />
                                <div style={{ 
                                    display: 'none', 
                                    padding: '40px', 
                                    textAlign: 'center',
                                    color: '#64748b'
                                }}>
                                    ⚠️ Unable to load license image
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ 
                            padding: '40px', 
                            textAlign: 'center',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            color: '#64748b'
                        }}>
                            <p style={{ fontSize: '2rem', margin: '0 0 12px 0' }}>📄</p>
                            <p style={{ margin: 0 }}>No license image uploaded</p>
                        </div>
                    )}

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setShowLicenseModal(false)}
                            style={{
                                padding: '12px 24px',
                                background: '#e2e8f0',
                                color: '#475569',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Employee Car Wash Assignments Modal */}
        {showAssignmentsModal && viewingAssignments && (
            <div 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}
                onClick={() => setShowAssignmentsModal(false)}
            >
                <div 
                    style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '900px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ margin: '0 0 8px 0' }}>🚗 Car Wash Assignments</h2>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                                {viewingAssignments.name}
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowAssignmentsModal(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: '#64748b'
                            }}
                        >
                            &times;
                        </button>
                    </div>

                    {loadingBookings ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            <p>Loading assignments...</p>
                        </div>
                    ) : employeeBookings.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '40px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            color: '#64748b'
                        }}>
                            <p style={{ fontSize: '2rem', margin: '0 0 12px 0' }}>📋</p>
                            <p style={{ margin: 0 }}>No car wash assignments yet</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Type</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Booking ID</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Customer</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Service</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>Time</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '0.875rem' }}>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employeeBookings.map((booking, index) => (
                                        <tr key={`${booking.type}-${booking.booking_id}`} style={{ borderTop: index > 0 ? '1px solid #e2e8f0' : 'none' }}>
                                            <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    background: booking.type === 'standalone' ? '#ede9fe' : '#e0f2fe',
                                                    color: booking.type === 'standalone' ? '#6b21a8' : '#0369a1',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {booking.type === 'standalone' ? '🚗 Standalone' : '🅿️ Add-on'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                                                #{booking.booking_id}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                                                {booking.customer_name}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                                                {booking.service}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '0.875rem' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    whiteSpace: 'nowrap',
                                                    background: booking.status === 'completed' ? '#dcfce7' : 
                                                               booking.status === 'in_progress' ? '#fef3c7' : 
                                                               booking.status === 'confirmed' ? '#dbeafe' : 
                                                               booking.status === 'active' ? '#fef3c7' :
                                                               booking.status === 'booked' ? '#dbeafe' : '#fee2e2',
                                                    color: booking.status === 'completed' ? '#166534' : 
                                                           booking.status === 'in_progress' ? '#854d0e' : 
                                                           booking.status === 'confirmed' ? '#1e40af' : 
                                                           booking.status === 'active' ? '#854d0e' :
                                                           booking.status === 'booked' ? '#1e40af' : '#991b1b'
                                                }}>
                                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '0.875rem', color: '#64748b' }}>
                                                {booking.time ? new Date(booking.time).toLocaleString() : 'N/A'}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600' }}>
                                                ₹{booking.price}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <div style={{ 
                                marginTop: '20px', 
                                padding: '16px', 
                                background: '#f8fafc', 
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: '600', color: '#475569' }}>
                                    Total Assignments: {employeeBookings.length}
                                </span>
                                <span style={{ fontWeight: '600', color: '#475569' }}>
                                    Total Revenue: ₹{employeeBookings.reduce((sum, b) => sum + parseFloat(b.price || 0), 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setShowAssignmentsModal(false)}
                            style={{
                                padding: '12px 24px',
                                background: '#e2e8f0',
                                color: '#475569',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}

export default OwnerEmployees

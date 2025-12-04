import React, { useState, useEffect } from 'react'
import parkingService from '../../services/parkingService'
import api from '../../services/api'
import './Admin.scss'

const AdminEmployees = () => {
    const [employees, setEmployees] = useState([])
    const [owners, setOwners] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [employeesData, ownersData] = await Promise.all([
                parkingService.getEmployees(),
                api.get('/owner-profiles/').then(res => res.data)
            ])
            setEmployees(employeesData || [])
            setOwners(ownersData || [])
            setError(null)
        } catch (err) {
            console.error('Error fetching data:', err)
            setError('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const getOwnerName = (ownerId) => {
        if (!ownerId) return 'Unassigned'
        const owner = owners.find(o => o.id === ownerId)
        return owner ? `${owner.firstname} ${owner.lastname}` : 'Unknown Owner'
    }

    const filteredEmployees = employees.filter(emp =>
        (emp.firstname?.toLowerCase() + ' ' + emp.lastname?.toLowerCase()).includes(searchTerm.toLowerCase()) ||
        emp.phone?.includes(searchTerm)
    )

    return (
        <div className="admin-page">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '24px' }}>
                    <div>
                        <h1>👁️ View Employees (Read-Only)</h1>
                        <p style={{ color: '#64748b', marginTop: '8px' }}>
                            Total: {employees.length} | Assigned: {employees.filter(e => e.owner).length} | Unassigned: {employees.filter(e => !e.owner).length}
                        </p>
                        <div style={{ 
                            marginTop: '12px',
                            padding: '12px 16px', 
                            background: '#fef3c7', 
                            borderRadius: '8px',
                            border: '1px solid #fbbf24',
                            display: 'inline-block'
                        }}>
                            <span style={{ color: '#92400e', fontWeight: '600' }}>
                                ℹ️ Employee assignment is now managed by owners
                            </span>
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            width: '300px',
                            maxWidth: '100%'
                        }}
                    />
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">Error</span>
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading employees...</p>
                </div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>License</th>
                                <th>Location</th>
                                <th>Assigned Owner</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map(emp => (
                                    <tr key={emp.employee_id}>
                                        <td style={{ fontWeight: '600' }}>
                                            {emp.firstname} {emp.lastname}
                                        </td>
                                        <td>{emp.phone || 'N/A'}</td>
                                        <td>{emp.driving_license || 'N/A'}</td>
                                        <td>
                                            {emp.latitude && emp.longitude
                                                ? `${emp.latitude}, ${emp.longitude}`
                                                : 'N/A'
                                            }
                                        </td>
                                        <td>
                                            <span className={`status-badge ${emp.owner ? 'active' : 'inactive'}`}>
                                                {getOwnerName(emp.owner)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${emp.owner ? 'active' : 'pending'}`}>
                                                {emp.owner ? '✅ Assigned' : '⏳ Available'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                                        No employees found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default AdminEmployees

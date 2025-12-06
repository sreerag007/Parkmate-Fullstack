import React, { useState, useEffect } from 'react'
import { UserCheck, UserX, Search, Info, Users } from 'lucide-react'
import api from '../../services/api'
import './Admin.scss'

const AdminEmployees = () => {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [stats, setStats] = useState({
        total: 0,
        assigned: 0,
        unassigned: 0
    })

    useEffect(() => {
        fetchEmployees()
    }, [filterStatus])

    const fetchEmployees = async () => {
        try {
            setLoading(true)
            const params = {
                status: filterStatus
            }
            if (searchTerm) {
                params.search = searchTerm
            }
            
            const response = await api.get('/employees/admin-list/', { params })
            setEmployees(response.data.employees || [])
            setStats(response.data.stats || { total: 0, assigned: 0, unassigned: 0 })
            setError(null)
        } catch (err) {
            console.error('Error fetching employees:', err)
            setError('Failed to load employees')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        fetchEmployees()
    }

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value)
        if (e.target.value === '') {
            fetchEmployees()
        }
    }

    const filteredEmployees = employees.filter(employee => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        return (
            employee.name?.toLowerCase().includes(search) ||
            employee.phone?.toLowerCase().includes(search) ||
            employee.driving_license?.toLowerCase().includes(search) ||
            employee.assigned_owner?.toLowerCase().includes(search)
        )
    })

    const getStatusBadge = (employee) => {
        const isAssigned = employee.status === 'Assigned'
        return (
            <span className={`status-badge ${isAssigned ? 'status-assigned' : 'status-unassigned'}`}>
                {isAssigned ? <UserCheck size={14} /> : <UserX size={14} />}
                {employee.status}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="admin-section">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading employees...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-section">
            <div className="admin-header">
                <div className="header-top">
                    <div className="header-title">
                        <Users size={28} />
                        <h1>Employees</h1>
                    </div>
                </div>

                {/* Informational Banner */}
                <div className="info-banner">
                    <Info size={18} />
                    <span>Employee assignment is now managed by owners. This is a read-only monitoring view.</span>
                </div>

                {/* Statistics Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
                            <Users size={24} color="#1976d2" />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">Total Employees</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
                            <UserCheck size={24} color="#388e3c" />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.assigned}</div>
                            <div className="stat-label">Assigned</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: '#ffebee' }}>
                            <UserX size={24} color="#d32f2f" />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.unassigned}</div>
                            <div className="stat-label">Unassigned</div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="controls-row">
                    <form onSubmit={handleSearch} className="search-container">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, license, or owner..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                    </form>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="assigned">Assigned</option>
                        <option value="unassigned">Unassigned</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="error-alert">
                    <span>⚠️ {error}</span>
                </div>
            )}

            {/* Employees Table */}
            <div className="table-container">
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
                        {filteredEmployees.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="no-data">
                                    No employees found matching your criteria
                                </td>
                            </tr>
                        ) : (
                            filteredEmployees.map((employee) => (
                                <tr key={employee.employee_id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {employee.name?.charAt(0) || 'E'}
                                            </div>
                                            <span className="user-name">{employee.name}</span>
                                        </div>
                                    </td>
                                    <td>{employee.phone}</td>
                                    <td>
                                        <span className="license-badge">
                                            {employee.driving_license}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="location-text">
                                            {employee.location}
                                        </span>
                                    </td>
                                    <td>
                                        {employee.assigned_owner ? (
                                            <span className="owner-badge">
                                                {employee.assigned_owner}
                                            </span>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                    <td>{getStatusBadge(employee)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary Footer */}
            <div className="table-footer">
                <p>
                    Showing <strong>{filteredEmployees.length}</strong> of <strong>{stats.total}</strong> employees
                    {filterStatus !== 'all' && ` (${filterStatus})`}
                </p>
            </div>
        </div>
    )
}

export default AdminEmployees

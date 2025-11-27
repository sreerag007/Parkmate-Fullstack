import React, { useState, useEffect } from 'react'
import parkingService from '../../services/parkingService'
import api from '../../services/api'
import './Admin.scss'

const AdminEmployees = () => {
    const [employees, setEmployees] = useState([])
    const [owners, setOwners] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [assigningEmployeeId, setAssigningEmployeeId] = useState(null)
    const [selectedOwner, setSelectedOwner] = useState({})
    const [actionLoading, setActionLoading] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)

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

    const handleAssignClick = (employee) => {
        setAssigningEmployeeId(employee.employee_id)
        setSelectedOwner({ [employee.employee_id]: employee.owner })
        setShowAssignModal(true)
    }

    const handleOwnerSelect = (employeeId, ownerId) => {
        setSelectedOwner(prev => ({
            ...prev,
            [employeeId]: ownerId
        }))
    }

    const handleConfirmAssignment = async () => {
        try {
            setActionLoading(true)
            const ownerId = selectedOwner[assigningEmployeeId]
            
            await api.patch(`/employees/${assigningEmployeeId}/`, {
                owner: ownerId
            })

            setEmployees(employees.map(emp => 
                emp.employee_id === assigningEmployeeId 
                    ? { ...emp, owner: ownerId }
                    : emp
            ))

            setShowAssignModal(false)
            setAssigningEmployeeId(null)
            setSuccessMessage('Employee assigned successfully!')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            console.error('Error assigning employee:', err)
            setError('Failed to assign employee')
            setTimeout(() => setError(null), 3000)
        } finally {
            setActionLoading(false)
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
                        <h1>Manage Employees</h1>
                        <p>Total: {employees.length} | Assigned: {employees.filter(e => e.owner).length} | Unassigned: {employees.filter(e => !e.owner).length}</p>
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

            {successMessage && (
                <div className="alert alert-success">
                    <span className="alert-icon">Success</span>
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span className="alert-icon">Error</span>
                    <span>{error}</span>
                </div>
            )}

            {showAssignModal && assigningEmployeeId && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowAssignModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Assign Employee to Owner</h2>
                            <button 
                                className="close-btn" 
                                onClick={() => !actionLoading && setShowAssignModal(false)}
                                disabled={actionLoading}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Select Owner</label>
                                <select
                                    value={selectedOwner[assigningEmployeeId] || ''}
                                    onChange={(e) => handleOwnerSelect(assigningEmployeeId, e.target.value ? parseInt(e.target.value) : null)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <option value="">-- Unassigned --</option>
                                    {owners.map(owner => (
                                        <option key={owner.id} value={owner.id}>
                                            {owner.firstname} {owner.lastname} - {owner.city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={() => setShowAssignModal(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={handleConfirmAssignment}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                            </button>
                        </div>
                    </div>
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
                                <th>Actions</th>
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
                                            <button
                                                className="btn-edit"
                                                onClick={() => handleAssignClick(emp)}
                                                disabled={actionLoading}
                                                title={emp.owner ? "Reassign to another owner" : "Assign to an owner"}
                                            >
                                                {emp.owner ? 'Reassign' : 'Assign'}
                                            </button>
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

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../../Context/AuthContext'
import parkingService from '../../services/parkingService'
import { notify } from '../../utils/notify.jsx'
import './Owner.scss'

const fontStyles = {
    headingXL: {
        fontSize: '32px',
        fontWeight: '700',
        letterSpacing: '-0.5px',
        color: '#0f172a',
        fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
    },
    headingLG: {
        fontSize: '20px',
        fontWeight: '600',
        letterSpacing: '-0.3px',
        color: '#0f172a',
        fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
    },
    bodyMD: {
        fontSize: '14px',
        fontWeight: '400',
        letterSpacing: '0px',
        color: '#475569',
        fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
        lineHeight: '1.5'
    },
    bodySM: {
        fontSize: '13px',
        fontWeight: '400',
        letterSpacing: '0px',
        color: '#64748b',
        fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
        lineHeight: '1.5'
    },
    labelSM: {
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        color: '#64748b',
        fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
        textTransform: 'uppercase'
    },
    buttonText: {
        fontSize: '14px',
        fontWeight: '600',
        letterSpacing: '0px',
        fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
    },
    numberLG: {
        fontSize: '28px',
        fontWeight: '800',
        letterSpacing: '-1px',
        fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
    }
}

const OwnerPayments = () => {
    const { owner } = useAuth()
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [statusFilter, setStatusFilter] = useState('all')
    const [methodFilter, setMethodFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const refreshIntervalRef = useRef(null)

    // Calculate summary statistics from filtered payments
    const calculateSummary = (data) => {
        const successPayments = data.filter(p => p.status === 'SUCCESS')
        const pendingPayments = data.filter(p => p.status === 'PENDING')
        
        const totalRevenue = successPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
        const pendingCount = pendingPayments.length
        const totalTransactions = data.length

        return {
            totalRevenue: totalRevenue.toFixed(2),
            pendingCount,
            totalTransactions
        }
    }

    // Load payments from backend
    const loadPayments = async () => {
        try {
            setLoading(true)
            setError(null)

            console.log('💳 Loading owner payments...')
            const filters = {}
            if (statusFilter !== 'all') filters.status = statusFilter
            if (methodFilter !== 'all') filters.payment_method = methodFilter

            const response = await parkingService.getOwnerPayments(filters)
            console.log('✅ Payments loaded:', response)

            setPayments(response.results || [])
        } catch (err) {
            console.error('❌ Error loading payments:', err)
            setError('Failed to load payments')
            notify.error('Unable to load payment data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (owner?.role === 'Owner') {
            loadPayments()

            // Set up auto-refresh every 15 seconds
            refreshIntervalRef.current = setInterval(() => {
                console.log('🔄 Auto-refreshing payments...')
                loadPayments()
            }, 15000)
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current)
            }
        }
    }, [owner, statusFilter, methodFilter])

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'SUCCESS':
                return '#10b981'
            case 'PENDING':
                return '#f59e0b'
            case 'FAILED':
                return '#ef4444'
            default:
                return '#64748b'
        }
    }

    const getStatusBgColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'SUCCESS':
                return '#dcfce7'
            case 'PENDING':
                return '#fef3c7'
            case 'FAILED':
                return '#fee2e2'
            default:
                return '#f1f5f9'
        }
    }

    // Calculate filtered payments - MUST be before any conditional returns
    const filteredPayments = useMemo(() => {
        let filtered = payments.filter(p => {
            if (statusFilter !== 'all' && p.status !== statusFilter) return false
            if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false
            return true
        })

        // Apply date filter (robust parsing of input `YYYY-MM-DD` to local dates)
        if (dateFrom || dateTo) {
            const parseDateInput = (s) => {
                if (!s) return null
                const parts = s.split('-')
                if (parts.length !== 3) return null
                const y = parseInt(parts[0], 10)
                const m = parseInt(parts[1], 10) - 1
                const d = parseInt(parts[2], 10)
                return new Date(y, m, d)
            }

            const fromDate = dateFrom ? parseDateInput(dateFrom) : null
            const toDate = dateTo ? parseDateInput(dateTo) : null
            if (fromDate) fromDate.setHours(0, 0, 0, 0)
            if (toDate) toDate.setHours(23, 59, 59, 999)

            filtered = filtered.filter(p => {
                const paymentDate = new Date(p.created_at)
                if (fromDate && paymentDate < fromDate) return false
                if (toDate && paymentDate > toDate) return false
                return true
            })
        }

        // Apply search filter
        const query = searchQuery.trim().toLowerCase()
        if (query) {
            filtered = filtered.filter(p => {
                const userName = (p.user_name || '').toLowerCase()
                const lotName = (p.lot_name || '').toLowerCase()
                const slotNumber = (p.slot_number || '').toString().toLowerCase()
                const paymentMethod = (p.payment_method || '').toLowerCase()
                const amount = (p.amount || '').toString().toLowerCase()
                const transactionId = (p.transaction_id || '').toString().toLowerCase()
                const status = (p.status || '').toLowerCase()
                const paymentType = (p.payment_type || '').toLowerCase()
                
                return (
                    userName.includes(query) ||
                    lotName.includes(query) ||
                    slotNumber.includes(query) ||
                    paymentMethod.includes(query) ||
                    amount.includes(query) ||
                    transactionId.includes(query) ||
                    status.includes(query) ||
                    paymentType.includes(query)
                )
            })
        }

        return filtered
    }, [payments, statusFilter, methodFilter, searchQuery, dateFrom, dateTo])

    const summary = calculateSummary(filteredPayments)

    if (loading) {
        return (
            <div className="owner-payments">
                <h1>💳 Payments</h1>
                <p style={{ textAlign: 'center', padding: '40px' }}>Loading payments...</p>
            </div>
        )
    }

    if (error && payments.length === 0) {
        return (
            <div className="owner-payments">
                <h1>💳 Payments</h1>
                <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
                    {error}
                </div>
            </div>
        )
    }

    return (
        <div className="owner-payments">
            <header className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={fontStyles.headingXL}>💳 Payments Dashboard</h1>
                        <p style={{ ...fontStyles.bodySM, margin: '8px 0 0 0' }}>View all payment receipts for your parking lots</p>
                    </div>
                    <button
                        onClick={loadPayments}
                        style={{
                            padding: '10px 16px',
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#2563eb'}
                        onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '28px'
            }}>
                {/* Total Revenue Card */}
                <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <p style={{ ...fontStyles.labelSM, margin: 0, color: '#059669' }}>
                        💰 Total Revenue
                    </p>
                    <p style={{ ...fontStyles.numberLG, margin: 0, color: '#166534' }}>
                        ₹{summary.totalRevenue}
                    </p>
                    <p style={{ ...fontStyles.bodySM, margin: 0, color: '#4b5563' }}>
                        From successful payments
                    </p>
                </div>

                {/* Pending Payments Card */}
                <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fcd34d',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <p style={{ ...fontStyles.labelSM, margin: 0, color: '#b45309' }}>
                        ⏳ Pending Payments
                    </p>
                    <p style={{ ...fontStyles.numberLG, margin: 0, color: '#92400e' }}>
                        {summary.pendingCount}
                    </p>
                    <p style={{ ...fontStyles.bodySM, margin: 0, color: '#4b5563' }}>
                        Awaiting verification
                    </p>
                </div>

                {/* Total Transactions Card */}
                <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <p style={{ ...fontStyles.labelSM, margin: 0, color: '#0369a1' }}>
                        📊 Total Transactions
                    </p>
                    <p style={{ ...fontStyles.numberLG, margin: 0, color: '#1e40af' }}>
                        {summary.totalTransactions}
                    </p>
                    <p style={{ ...fontStyles.bodySM, margin: 0, color: '#4b5563' }}>
                        Payment records
                    </p>
                </div>
            </div>

            {/* Search Bar & Date Filters */}
            <div style={{ marginBottom: '24px' }}>
                <input
                    type="text"
                    placeholder="🔍 Search by customer name, lot, slot, payment method, amount, or transaction ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        outline: 'none',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                        marginBottom: '12px',
                        boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1', minWidth: '150px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>📅 From Date</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                outline: 'none',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>
                    <div style={{ flex: '1', minWidth: '150px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>📅 To Date</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                outline: 'none',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>
                    {(dateFrom || dateTo) && (
                        <button
                            onClick={() => {
                                setDateFrom('')
                                setDateTo('')
                            }}
                            style={{
                                padding: '10px 14px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#dc2626'}
                            onMouseOut={(e) => e.target.style.background = '#ef4444'}
                        >
                            ✕ Clear Dates
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="filters" style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ ...fontStyles.bodySM, fontWeight: '600', alignSelf: 'center', color: '#0f172a' }}>Status:</span>
                    {['all', 'SUCCESS', 'PENDING', 'FAILED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: statusFilter === status ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                background: statusFilter === status ? '#eff6ff' : '#fff',
                                color: statusFilter === status ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                fontWeight: statusFilter === status ? '600' : '500',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
                            }}
                        >
                            {status === 'all' ? 'All' : status}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ ...fontStyles.bodySM, fontWeight: '600', alignSelf: 'center', color: '#0f172a' }}>Method:</span>
                    {['all', 'Cash', 'UPI', 'CC'].map(method => (
                        <button
                            key={method}
                            onClick={() => setMethodFilter(method)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: methodFilter === method ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                background: methodFilter === method ? '#eff6ff' : '#fff',
                                color: methodFilter === method ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                fontWeight: methodFilter === method ? '600' : '500',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
                            }}
                        >
                            {method === 'all' ? 'All' : method}
                        </button>
                    ))}
                </div>
            </div>

            {/* Payments Table */}
            <div style={{
                overflowX: 'auto',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#fff'
            }}>
                {filteredPayments.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <p style={{ ...fontStyles.headingLG, color: '#64748b', margin: 0 }}>
                            No payments found.
                        </p>
                    </div>
                ) : (
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse'
                    }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                                <th style={{ ...fontStyles.labelSM, padding: '16px', textAlign: 'left', color: '#0f172a' }}>User</th>
                                <th style={{ ...fontStyles.labelSM, padding: '16px', textAlign: 'left', color: '#0f172a' }}>Lot</th>
                                <th style={{ ...fontStyles.labelSM, padding: '16px', textAlign: 'left', color: '#0f172a' }}>Slot</th>
                                <th style={{ ...fontStyles.labelSM, padding: '16px', textAlign: 'left', color: '#0f172a' }}>Type</th>
                                <th style={{ ...fontStyles.labelSM, padding: '16px', textAlign: 'left', color: '#0f172a' }}>Method</th>
                                <th style={{ ...fontStyles.labelSM, padding: '16px', textAlign: 'left', color: '#0f172a' }}>Amount</th>
                                <th style={{ ...fontStyles.labelSM, padding: '16px', textAlign: 'left', color: '#0f172a' }}>Status</th>
                                <th style={{ ...fontStyles.labelSM, padding: '16px', textAlign: 'left', color: '#0f172a' }}>Date</th>
                                <th style={{ ...fontStyles.labelSM, padding: '16px', textAlign: 'left', color: '#0f172a' }}>Transaction ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map((payment) => (
                                <tr
                                    key={payment.pay_id}
                                    style={{
                                        borderBottom: '1px solid #e2e8f0',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                                >
                                    <td style={{ ...fontStyles.bodyMD, padding: '16px', color: '#0f172a' }}>
                                        <div style={{ fontWeight: '600' }}>{payment.user_name || 'N/A'}</div>
                                    </td>
                                    <td style={{ ...fontStyles.bodyMD, padding: '16px', color: '#0f172a' }}>
                                        {payment.lot_name || 'N/A'}
                                    </td>
                                    <td style={{ ...fontStyles.bodyMD, padding: '16px', color: '#0f172a' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: '600', color: '#1e40af' }}>#{payment.slot_number || 'N/A'}</span>
                                            <span style={{
                                                padding: '2px 6px',
                                                background: '#f3e8ff',
                                                color: '#6d28d9',
                                                borderRadius: '3px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
                                            }}>
                                                {payment.slot_type || 'Standard'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ ...fontStyles.bodyMD, padding: '16px', color: '#0f172a' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            background: payment.payment_type?.includes('Slot') ? '#dbeafe' : '#fce7f3',
                                            color: payment.payment_type?.includes('Slot') ? '#1e40af' : '#831843',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
                                        }}>
                                            {payment.payment_type || 'Unknown'}
                                        </span>
                                    </td>
                                    <td style={{ ...fontStyles.bodyMD, padding: '16px', color: '#0f172a' }}>
                                        {payment.payment_method || 'N/A'}
                                    </td>
                                    <td style={{ ...fontStyles.bodyMD, padding: '16px', color: '#0f172a', fontWeight: '700' }}>
                                        ₹{parseFloat(payment.amount).toFixed(2)}
                                        {payment.is_renewal && (
                                            <span style={{
                                                marginLeft: '8px',
                                                padding: '2px 8px',
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                borderRadius: '4px'
                                            }}>
                                                Renewal
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
                                            backgroundColor: getStatusBgColor(payment.status),
                                            color: getStatusColor(payment.status)
                                        }}>
                                            {payment.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>
                                        {new Date(payment.created_at).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: '2-digit'
                                        })}
                                    </td>
                                    <td style={{ padding: '16px', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
                                        {payment.transaction_id || 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer Info */}
            <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
            }}>
                <p style={{ ...fontStyles.bodySM, margin: 0, color: '#64748b' }}>
                    📊 Showing {filteredPayments.length} of {payments.length} payments • Last updated: {new Date().toLocaleTimeString()}
                </p>
            </div>
        </div>
    )
}

export default OwnerPayments

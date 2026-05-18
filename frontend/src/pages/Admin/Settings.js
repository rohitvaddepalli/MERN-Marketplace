import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import '../Admin/AdminManagement.css';
import logger from '../../utils/logger';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        taxRate: 8,
        shippingFee: 10,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    useDocumentTitle('Admin Settings');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await adminAPI.getSettings();
            setSettings(response.data.settings);
        } catch (error) {
            logger.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings({
            ...settings,
            [name]: parseFloat(value) || 0,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await adminAPI.updateSettings(settings);
            toast.success('Settings updated successfully!');
        } catch (error) {
            logger.error('Error updating settings:', error);
            toast.error(error.response?.data?.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
                <AdminSidebar />
                <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                    <div className="container">
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <AdminSidebar />
            <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                <div className="container" style={{ padding: 0 }}>
                    <div className="admin-page-header">
                        <h1>Settings</h1>
                        <p>Configure tax rates and shipping fees for the marketplace</p>
                    </div>

                    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">
                                    Tax Rate (%)
                                    <span
                                        style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.9rem',
                                            marginLeft: '8px',
                                        }}
                                    >
                                        Applied to all orders
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    name="taxRate"
                                    className="form-input"
                                    value={settings.taxRate}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    required
                                />
                                <small
                                    style={{
                                        color: 'var(--text-secondary)',
                                        display: 'block',
                                        marginTop: '4px',
                                    }}
                                >
                                    Enter a value between 0 and 100
                                </small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Shipping Fee (₹)
                                    <span
                                        style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.9rem',
                                            marginLeft: '8px',
                                        }}
                                    >
                                        Flat rate for all orders
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    name="shippingFee"
                                    className="form-input"
                                    value={settings.shippingFee}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                                <small
                                    style={{
                                        color: 'var(--text-secondary)',
                                        display: 'block',
                                        marginTop: '4px',
                                    }}
                                >
                                    Enter a value greater than or equal to 0
                                </small>
                            </div>

                            <div
                                style={{
                                    background: 'var(--gray-lighter)',
                                    padding: 'var(--spacing-lg)',
                                    borderRadius: 'var(--border-radius)',
                                    marginBottom: 'var(--spacing-lg)',
                                }}
                            >
                                <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Preview</h4>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <span>Subtotal:</span>
                                        <span>₹1000.00</span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <span>Shipping:</span>
                                        <span>₹{settings.shippingFee.toFixed(2)}</span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <span>Tax ({settings.taxRate}%):</span>
                                        <span>₹{(1000 * (settings.taxRate / 100)).toFixed(2)}</span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            paddingTop: '8px',
                                            borderTop: '1px solid var(--border-color)',
                                            fontWeight: '700',
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        <span>Total:</span>
                                        <span>
                                            ₹
                                            {(
                                                1000 +
                                                settings.shippingFee +
                                                1000 * (settings.taxRate / 100)
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={saving}
                                style={{ width: '100%' }}
                            >
                                {saving ? (
                                    <>
                                        <div className="spinner"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Settings'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;

import React, { useState, useEffect } from 'react';
import { storeAPI, uploadAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar/Sidebar';

const StoreManagement = () => {
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        email: '',
        phone: '',
        logo: '',
        banner: ''
    });

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        try {
            const response = await storeAPI.getMyStore();
            const storeData = response.data.store;
            setStore(storeData);
            if (storeData) {
                setFormData({
                    name: storeData.name || '',
                    description: storeData.description || '',
                    category: storeData.category || '',
                    street: storeData.address?.street || '',
                    city: storeData.address?.city || '',
                    state: storeData.address?.state || '',
                    zipCode: storeData.address?.zipCode || '',
                    country: storeData.address?.country || '',
                    email: storeData.contact?.email || '',
                    phone: storeData.contact?.phone || '',
                    logo: storeData.logo || '',
                    banner: storeData.banner || ''
                });
            }
        } catch (error) {
            console.error('Error fetching store:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const data = new FormData();
            data.append('images', file);

            const uploadToast = toast.loading(`Uploading ${field}...`);
            try {
                const response = await uploadAPI.uploadImages(data);
                setFormData({ ...formData, [field]: response.data.urls[0] });
                toast.success(`${field} uploaded successfully`, { id: uploadToast });
            } catch (error) {
                console.error(`Error uploading ${field}`, error);
                toast.error(`Failed to upload ${field}`, { id: uploadToast });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const storeData = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                logo: formData.logo,
                banner: formData.banner,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country
                },
                contact: {
                    email: formData.email,
                    phone: formData.phone
                }
            };

            if (store) {
                await storeAPI.updateStore(store._id, storeData);
                toast.success('Store updated successfully!');
            } else {
                await storeAPI.createStore(storeData);
                toast.success('Store created successfully!');
            }
            fetchStore();
        } catch (error) {
            console.error('Error saving store:', error);
            toast.error(error.response?.data?.message || 'Failed to save store');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
                <Sidebar />
                <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <Sidebar />
            <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                <div className="container" style={{ padding: 0 }}>
                    <h1 className="page-title">{store ? 'Manage Store' : 'Create Store'}</h1>
                    <p style={{ marginBottom: 'var(--spacing-xl)' }}>
                        {store ? 'Update your store information' : 'Create your store to start selling'}
                    </p>

                    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Store Banner</label>
                                {formData.banner && (
                                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                        <img
                                            src={formData.banner}
                                            alt="Store Banner"
                                            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--border-radius)' }}
                                        />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="form-input"
                                    onChange={(e) => handleImageUpload(e, 'banner')}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Store Logo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    {formData.logo && (
                                        <img
                                            src={formData.logo}
                                            alt="Store Logo"
                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border-color)' }}
                                        />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-input"
                                        onChange={(e) => handleImageUpload(e, 'logo')}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Store Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="Enter store name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description *</label>
                                <textarea
                                    name="description"
                                    className="form-textarea"
                                    placeholder="Describe your store"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select
                                    name="category"
                                    className="form-select"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select category</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Fashion">Fashion</option>
                                    <option value="Home & Garden">Home & Garden</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Books">Books</option>
                                    <option value="Toys">Toys</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>Address</h3>

                            <div className="form-group">
                                <label className="form-label">Street</label>
                                <input
                                    type="text"
                                    name="street"
                                    className="form-input"
                                    value={formData.street}
                                    onChange={handleChange}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        className="form-input"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        className="form-input"
                                        value={formData.state}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">ZIP Code</label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        className="form-input"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        className="form-input"
                                        value={formData.country}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <h3 style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-md)' }}>Contact Information</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--spacing-xl)' }}>
                                {store ? 'Update Store' : 'Create Store'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreManagement;

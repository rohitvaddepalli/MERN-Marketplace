import React, { useState, useEffect } from 'react';
import { productAPI, storeAPI } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        compareAtPrice: '',
        category: '',
        stock: '',
        lowStockThreshold: '10',
        images: ['']
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, storeRes] = await Promise.all([
                productAPI.getMyProducts(),
                storeAPI.getMyStore().catch(() => ({ data: { store: null } }))
            ]);
            setProducts(productsRes.data.products || []);
            setStore(storeRes.data.store);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (index, value) => {
        const newImages = [...formData.images];
        newImages[index] = value;
        setFormData({ ...formData, images: newImages });
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
                resolve(fileReader.result);
            };
            fileReader.onerror = (error) => {
                reject(error);
            };
        });
    };

    const handleImageUpload = async (index, e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await convertToBase64(file);
                const newImages = [...formData.images];
                newImages[index] = base64;
                setFormData({ ...formData, images: newImages });
            } catch (error) {
                console.error("Error converting file to base64", error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
                stock: parseInt(formData.stock),
                images: formData.images.filter(img => img)
            };

            if (editingProduct) {
                await productAPI.updateProduct(editingProduct._id, productData);
                alert('Product updated successfully!');
            } else {
                await productAPI.createProduct(productData);
                alert('Product created successfully!');
            }

            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving product:', error);
            alert(error.response?.data?.message || 'Failed to save product');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            compareAtPrice: product.compareAtPrice || '',
            category: product.category,
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold || '10',
            images: product.images.length > 0 ? product.images : ['']
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productAPI.deleteProduct(id);
                alert('Product deleted successfully!');
                fetchData();
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Failed to delete product');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            compareAtPrice: '',
            category: '',
            stock: '',
            lowStockThreshold: '10',
            images: ['']
        });
        setEditingProduct(null);
        setShowForm(false);
    };

    if (!store) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
                <Sidebar />
                <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                    <div className="container" style={{ padding: 0 }}>
                        <div className="empty-state">
                            <h3>Create a Store First</h3>
                            <p>You need to create a store before adding products</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <Sidebar />
            <div style={{ flex: 1, marginLeft: '260px', padding: 'var(--spacing-xl)' }}>
                <div className="container" style={{ padding: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                        <div>
                            <h1 className="page-title">Product Management</h1>
                            <p>Manage your store products</p>
                        </div>
                        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                            {showForm ? 'Cancel' : '+ Add Product'}
                        </button>
                    </div>

                    {showForm && (
                        <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Product Name *</label>
                                    <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description *</label>
                                    <textarea name="description" className="form-textarea" value={formData.description} onChange={handleChange} required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Price *</label>
                                        <input type="number" step="0.01" name="price" className="form-input" value={formData.price} onChange={handleChange} required />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Compare Price</label>
                                        <input type="number" step="0.01" name="compareAtPrice" className="form-input" value={formData.compareAtPrice} onChange={handleChange} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Category *</label>
                                        <select name="category" className="form-select" value={formData.category} onChange={handleChange} required>
                                            <option value="">Select category</option>
                                            <option value="Electronics">Electronics</option>
                                            <option value="Fashion">Fashion</option>
                                            <option value="Home & Garden">Home & Garden</option>
                                            <option value="Sports">Sports</option>
                                            <option value="Books">Books</option>
                                            <option value="Toys">Toys</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Stock *</label>
                                        <input type="number" name="stock" className="form-input" value={formData.stock} onChange={handleChange} required />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Low Stock Threshold</label>
                                        <input type="number" name="lowStockThreshold" className="form-input" value={formData.lowStockThreshold} onChange={handleChange} placeholder="10" />
                                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            You'll be alerted when stock falls below this level
                                        </small>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Product Images</label>
                                    {formData.images.map((img, index) => (
                                        <div key={index} style={{ marginBottom: 'var(--spacing-md)' }}>
                                            {img && (
                                                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                                                    <img
                                                        src={img}
                                                        alt={`Preview ${index + 1}`}
                                                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}
                                                    />
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="form-input"
                                                    onChange={(e) => handleImageUpload(index, e)}
                                                />
                                                {formData.images.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newImages = formData.images.filter((_, i) => i !== index);
                                                            setFormData({ ...formData, images: newImages });
                                                        }}
                                                        className="btn btn-outline btn-sm"
                                                        style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })} className="btn btn-ghost btn-sm">
                                        + Add Another Image
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                    <button type="submit" className="btn btn-primary">
                                        {editingProduct ? 'Update Product' : 'Create Product'}
                                    </button>
                                    <button type="button" onClick={resetForm} className="btn btn-ghost">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <h3>No Products Yet</h3>
                            <p>Add your first product to start selling</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
                            {products.map((product) => (
                                <div key={product._id} className="card">
                                    <img
                                        src={product.images?.[0] || 'https://via.placeholder.com/300'}
                                        alt={product.name}
                                        style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--border-radius)', marginBottom: 'var(--spacing-md)' }}
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/300'}
                                    />
                                    <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--spacing-sm)' }}>{product.name}</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {product.description}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                                        <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--primary-color)' }}>₹{product.price}</span>
                                        <span className={`badge badge-${product.stock === 0 ? 'danger' : product.stock <= (product.lowStockThreshold || 10) ? 'warning' : 'info'}`}>Stock: {product.stock}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <button onClick={() => handleEdit(product)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(product._id)} className="btn btn-outline btn-sm" style={{ flex: 1, borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductManagement;

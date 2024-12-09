'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faHome, faBox, faShoppingCart, faReceipt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

interface ImageData {
    id: number;
    documentId: string;
    name: string;
    alternativeText: string | null;
    caption: string | null;
    url: string;
}

interface Product {
    id: number;
    documentId: string;
    name: string;
    price: number;
    createdAt: string;
    description?: string;
    updatedAt: string;
    publishedAt: string;
    image: ImageData | null;
}

interface FormData {
    name: string;
    price: number;
    description: string;
    images: FileList | null;
}

function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        price: 0,
        description: '',
        images: null
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('http://localhost:1337/api/products?populate=*', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to fetch products');
            }

            const result = await response.json();
            console.log('Fetched data:', result);

            if (!result.data || !Array.isArray(result.data)) {
                throw new Error('Invalid data format received from server');
            }

            setProducts(result.data);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFormData(prev => ({
                ...prev,
                images: e.target.files
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setError(null);
            setIsLoading(true);

            const priceAsNumber = typeof formData.price === 'string'
                ? parseFloat(formData.price)
                : formData.price;

            const requestBody = {
                data: {
                    name: formData.name,
                    price: priceAsNumber,
                    description: formData.description,
                }
            };

            const url = isEditing
                ? `/api/products/${editingProductId}`
                : '/api/products';

            const productResponse = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!productResponse.ok) {
                const errorData = await productResponse.json();
                throw new Error(errorData.error?.message || 'Failed to save product');
            }

            const responseData = await productResponse.json();

            if (formData.images && formData.images.length > 0) {
                const formDataWithFiles = new FormData();
                formDataWithFiles.append('ref', 'api::product.product');
                formDataWithFiles.append('refId', responseData.data.id.toString());
                formDataWithFiles.append('field', 'image');

                Array.from(formData.images).forEach(file => {
                    formDataWithFiles.append('files', file);
                });

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formDataWithFiles,
                });

                if (!uploadResponse.ok) {
                    const uploadError = await uploadResponse.json();
                    throw new Error(uploadError.error?.message || 'Failed to upload images');
                }
            }

            setFormData({
                name: '',
                price: 0,
                description: '',
                images: null
            });
            setEditingProductId(null);
            setIsEditing(false);
            setIsModalOpen(false);
            await fetchProducts();
        } catch (err) {
            console.error('Error saving product:', err);
            setError(err instanceof Error ? err.message : 'Failed to save product');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        console.log(product);
        setFormData({
            name: product.name,
            price: product.price,
            description: product.description || '',
            images: null
        });
        setEditingProductId(product.documentId);
        setIsEditing(true);
        setIsUpdateModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                setError(null);
                const response = await fetch(`http://localhost:1337/api/products/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'Failed to delete product');
                }

                await fetchProducts();
            } catch (err) {
                console.error('Error deleting product:', err);
                setError(err instanceof Error ? err.message : 'Failed to delete product');
            }
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setError(null);
            setIsLoading(true);

            const priceAsNumber = typeof formData.price === 'string'
                ? parseFloat(formData.price)
                : formData.price;

            const requestBody = {
                data: {
                    name: formData.name,
                    price: priceAsNumber,
                    description: formData.description,
                }
            };

            const response = await fetch(`http://localhost:1337/api/products/${editingProductId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to update product');
            }

            const responseData = await response.json();

            if (formData.images && formData.images.length > 0) {
                const formDataWithFiles = new FormData();
                formDataWithFiles.append('ref', 'api::product.product');
                formDataWithFiles.append('refId', responseData.data.id.toString());
                formDataWithFiles.append('field', 'image');

                Array.from(formData.images).forEach(file => {
                    formDataWithFiles.append('files', file);
                });

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formDataWithFiles,
                });

                if (!uploadResponse.ok) {
                    const uploadError = await uploadResponse.json();
                    throw new Error(uploadError.error?.message || 'Failed to upload images');
                }
            }

            setFormData({
                name: '',
                price: 0,
                description: '',
                images: null
            });
            setEditingProductId(null);
            setIsEditing(false);
            setIsUpdateModalOpen(false);
            await fetchProducts();
        } catch (err) {
            console.error('Error updating product:', err);
            setError(err instanceof Error ? err.message : 'Failed to update product');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#3C2A21] to-[#1A120B] p-8 flex items-center justify-center">
                <div className="text-[#D5CEA3] text-xl">Loading products...</div>
            </div>
        );
    }

    return (
        <>
            <nav className="bg-[#1A120B] border-b border-[#D5CEA3]/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-[#D5CEA3] text-xl font-bold">☕ Coffee Shop</span>
                        </div>
                        <div className="flex space-x-4">
                            <Link
                                href="/products"
                                className="text-[#D5CEA3] hover:bg-[#3C2A21] px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faBox} className="w-4 h-4" />
                                Products
                            </Link>
                            <Link
                                href="/Order"
                                className="text-[#D5CEA3] hover:bg-[#3C2A21] px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faShoppingCart} className="w-4 h-4" />
                                Order
                            </Link>
                            <Link
                                href="/transaction"
                                className="text-[#D5CEA3] hover:bg-[#3C2A21] px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faReceipt} className="w-4 h-4" />
                                Transactions
                            </Link>
                            <Link
                                href="/login"
                                className="text-[#D5CEA3] hover:bg-[#3C2A21] px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="min-h-screen bg-gradient-to-br from-[#3C2A21] to-[#1A120B] p-8">
                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                        {error}
                    </div>
                )}

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-[#D5CEA3]">Products</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-[#D5CEA3] text-[#1A120B] px-4 py-2 rounded-lg hover:bg-[#E5E5CB] transition-colors duration-200"
                    >
                        <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                        Add Product
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.length === 0 ? (
                        <div className="col-span-full text-center text-[#E5E5CB]/60 py-12">
                            No products available. Add your first product!
                        </div>
                    ) : (
                        products.map((product) => (
                            <div
                                key={product.id}
                                className="bg-[#E5E5CB]/10 backdrop-blur-sm rounded-xl overflow-hidden border border-[#D5CEA3]/20 hover:shadow-lg transition-all duration-300"
                            >
                                {product.image && product.image.url ? (
                                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                                        <Image
                                            src={product.image.url.startsWith('http')
                                                ? product.image.url
                                                : `${STRAPI_URL}${product.image.url}`}
                                            alt={product.image.alternativeText || product.name}
                                            fill
                                            className="object-cover hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            priority
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-[4/3] w-full bg-[#3C2A21] flex items-center justify-center">
                                        <span className="text-[#D5CEA3]/40">No image available</span>
                                    </div>
                                )}
                                <div className="p-6">
                                    <h2 className="text-2xl font-semibold text-[#D5CEA3] mb-3">
                                        {product.name || 'Untitled Product'}
                                    </h2>
                                    <p className="text-[#E5E5CB]/60 mb-4 line-clamp-3 min-h-[4.5rem]">
                                        {product.description || 'No description available'}
                                    </p>
                                    <p className="text-[#D5CEA3] text-xl font-bold mb-4">
                                        ${Number(product.price || 0).toFixed(2)}
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="flex-1 px-4 py-2 bg-[#D5CEA3]/20 text-[#D5CEA3] rounded-lg hover:bg-[#D5CEA3]/30 transition-colors duration-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.documentId)}
                                            className="flex-1 px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-[#1A120B] border border-[#D5CEA3]/20 rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold text-[#D5CEA3] mb-6">
                                {isEditing ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-[#3C2A21] border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB]"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                                        Price
                                    </label>
                                    <input
                                        type="number"
                                        id="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        required
                                        className="w-full px-4 py-2 bg-[#3C2A21] border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB]"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-[#3C2A21] border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB]"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="images" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                                        Images
                                    </label>
                                    <input
                                        type="file"
                                        id="images"
                                        onChange={handleFileChange}
                                        multiple
                                        accept="image/*"
                                        className="w-full px-4 py-2 bg-[#3C2A21] border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB]"
                                    />
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2 border border-[#D5CEA3]/20 rounded-lg text-[#D5CEA3] hover:bg-[#3C2A21] transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-[#D5CEA3] text-[#1A120B] rounded-lg hover:bg-[#E5E5CB] transition-colors duration-200"
                                    >
                                        {isEditing ? 'Update' : 'Add Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isUpdateModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-[#1A120B] border border-[#D5CEA3]/20 rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-2xl font-bold text-[#D5CEA3] mb-6">
                                Update Product
                            </h2>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <label htmlFor="updateName" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 bg-[#3C2A21] border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB]"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="updatePrice" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                                        Price
                                    </label>
                                    <input
                                        type="number"
                                        id="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        required
                                        className="w-full px-4 py-2 bg-[#3C2A21] border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB]"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="updateDescription" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-[#3C2A21] border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB]"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="updateImages" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                                        Images
                                    </label>
                                    <input
                                        type="file"
                                        id="images"
                                        onChange={handleFileChange}
                                        multiple
                                        accept="image/*"
                                        className="w-full px-4 py-2 bg-[#3C2A21] border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB]"
                                    />
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsUpdateModalOpen(false);
                                            setIsEditing(false);
                                            setEditingProductId(null);
                                        }}
                                        className="flex-1 px-4 py-2 border border-[#D5CEA3]/20 rounded-lg text-[#D5CEA3] hover:bg-[#3C2A21] transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-[#D5CEA3] text-[#1A120B] rounded-lg hover:bg-[#E5E5CB] transition-colors duration-200"
                                    >
                                        Update Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default function Page() {
    return <ProductList />;
}


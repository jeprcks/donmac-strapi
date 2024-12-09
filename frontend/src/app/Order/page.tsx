'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faShoppingCart, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

interface Product {
    id: number;
    name: string;
    price: number;
}

interface OrderItem {
    product: Product;
    quantity: number;
}

function OrderPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('http://localhost:1337/api/products?populate=*');

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const result = await response.json();
            setProducts(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const addToOrder = (product: Product) => {
        setOrderItems(prev => {
            const existingItem = prev.find(item => item.product.id === product.id);
            if (existingItem) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromOrder = (product: Product) => {
        setOrderItems(prev => {
            const existingItem = prev.find(item => item.product.id === product.id);
            if (existingItem && existingItem.quantity > 1) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
            }
            return prev.filter(item => item.product.id !== product.id);
        });
    };

    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = orderItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const handleCheckout = async () => {
        try {
            const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : null;
            const token = localStorage.getItem('jwt');

            if (!userId || !token) {
                throw new Error('Please login first');
            }

            const formattedOrderItems = orderItems.map(item => ({
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    price: item.product.price
                },
                quantity: item.quantity
            }));

            // Create order record
            const orderData = {
                data: {
                    orderlist: formattedOrderItems,
                    totalorder: totalPrice.toString(),
                    quantity: totalQuantity.toString(),
                    user: userId
                }
            };

            const orderResponse = await fetch('http://localhost:1337/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(orderData),
            });

            if (!orderResponse.ok) {
                const orderError = await orderResponse.json();
                throw new Error(orderError.error?.message || 'Failed to create order');
            }

            // Create transaction record
            const transactionData = {
                data: {
                    orderItems: formattedOrderItems,
                    totalAmount: totalPrice,
                    totalQuantity: totalQuantity,
                    orderDate: new Date().toISOString(),
                    user: userId
                }
            };

            const transactionResponse = await fetch('http://localhost:1337/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(transactionData),
            });

            if (!transactionResponse.ok) {
                const transactionError = await transactionResponse.json();
                throw new Error(transactionError.error?.message || 'Failed to create transaction');
            }

            setOrderItems([]);
            setIsCheckoutModalOpen(false);
            window.location.href = '/transaction';

        } catch (err) {
            console.error('Checkout error:', err);
            setError(err instanceof Error ? err.message : 'Failed to create order');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#3C2A21] to-[#1A120B] p-8 flex items-center justify-center">
                <div className="text-[#D5CEA3] text-xl">Loading orders...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#3C2A21] to-[#1A120B] p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/products" className="text-[#D5CEA3] hover:text-[#E5E5CB] transition-colors">
                        <FontAwesomeIcon icon={faArrowLeft} className="w-6 h-6" />
                    </Link>
                    <h1 className="text-3xl font-bold text-[#D5CEA3]">Order</h1>
                </div>

                <div className="bg-[#E5E5CB]/10 backdrop-blur-sm rounded-xl p-6 mb-8">
                    <div className="space-y-4">
                        {products.map(product => (
                            <div key={product.id} className="flex items-center justify-between p-4 border border-[#D5CEA3]/20 rounded-lg">
                                <div className="text-[#D5CEA3]">{product.name}</div>
                                <div className="flex items-center gap-4">
                                    <div className="text-[#D5CEA3]">
                                        ${product.price.toFixed(2)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => removeFromOrder(product)}
                                            className="p-2 text-[#D5CEA3] hover:bg-[#3C2A21] rounded-lg transition-colors"
                                        >
                                            <FontAwesomeIcon icon={faMinus} />
                                        </button>
                                        <span className="text-[#D5CEA3] w-8 text-center">
                                            {orderItems.find(item => item.product.id === product.id)?.quantity || 0}
                                        </span>
                                        <button
                                            onClick={() => addToOrder(product)}
                                            className="p-2 text-[#D5CEA3] hover:bg-[#3C2A21] rounded-lg transition-colors"
                                        >
                                            <FontAwesomeIcon icon={faPlus} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#E5E5CB]/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[#D5CEA3]">Total Quantity:</span>
                        <span className="text-[#D5CEA3] font-bold">{totalQuantity}</span>
                    </div>
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[#D5CEA3]">Total Price:</span>
                        <span className="text-[#D5CEA3] font-bold">${totalPrice.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={() => setIsCheckoutModalOpen(true)}
                        disabled={orderItems.length === 0}
                        className="w-full bg-[#D5CEA3] text-[#1A120B] py-3 rounded-lg font-semibold hover:bg-[#E5E5CB] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <FontAwesomeIcon icon={faShoppingCart} />
                        Checkout
                    </button>
                </div>
            </div>

            {isCheckoutModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1A120B] border border-[#D5CEA3]/20 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-[#D5CEA3] mb-6">Order Summary</h2>

                        <div className="space-y-4 mb-6">
                            {orderItems.map((item) => (
                                <div key={item.product.id} className="flex justify-between items-center border-b border-[#D5CEA3]/20 pb-4">
                                    <div className="text-[#D5CEA3]">
                                        <div className="font-semibold">{item.product.name}</div>
                                        <div className="text-sm text-[#D5CEA3]/60">
                                            Quantity: {item.quantity} × ${item.product.price.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="text-[#D5CEA3] font-bold">
                                        ${(item.quantity * item.product.price).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-[#D5CEA3]/20 pt-4 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[#D5CEA3]">Total Items:</span>
                                <span className="text-[#D5CEA3] font-bold">{totalQuantity}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-[#D5CEA3]">Total Amount:</span>
                                <span className="text-[#D5CEA3] font-bold">${totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsCheckoutModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-[#D5CEA3]/20 rounded-lg text-[#D5CEA3] hover:bg-[#3C2A21] transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCheckout}
                                className="flex-1 px-4 py-2 bg-[#D5CEA3] text-[#1A120B] rounded-lg hover:bg-[#E5E5CB] transition-colors duration-200"
                            >
                                Confirm Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderPage;

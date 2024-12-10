'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

interface Transaction {
    id: number;
    documentId: string;
    orderDate: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    orderItems: {
        product: {
            id: number;
            name: string;
            price: number;
        };
        quantity: number;
    }[];
    totalAmount: number;
    totalQuantity: number;
}

function TransactionPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const token = localStorage.getItem('jwt');
                const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : null;

                if (!token || !userId) {
                    throw new Error('Please login first');
                }

                const response = await fetch(`http://localhost:1337/api/transactions?filters[user][id][$eq]=${userId}&sort[0]=createdAt:desc`, {
                    headers: {
                        // Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch transactions');
                }

                const data = await response.json();
                // console.log('Transaction data:', JSON.stringify(data, null, 2));
                console.log(data.data)
                setTransactions(data.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            return 'Invalid Date';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#3C2A21] to-[#1A120B] p-8 flex items-center justify-center">
                <div className="text-[#D5CEA3] text-xl">Loading transactions...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#3C2A21] to-[#1A120B] p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/Order" className="text-[#D5CEA3] hover:text-[#E5E5CB] transition-colors">
                        <FontAwesomeIcon icon={faArrowLeft} className="w-6 h-6" />
                    </Link>
                    <h1 className="text-3xl font-bold text-[#D5CEA3]">Transaction History</h1>
                </div>

                <div className="space-y-6">
                    {transactions.map((transaction) => (
                        <div key={transaction.id} className="bg-[#E5E5CB]/10 backdrop-blur-sm rounded-xl p-6">
                            <div className="mb-4">
                                <div className="text-[#D5CEA3] text-sm">
                                    Order Date: {formatDate(transaction.orderDate)}
                                </div>
                            </div>

                            <div className="space-y-4 mb-4">
                                {transaction.orderItems.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <div className="text-[#D5CEA3]">
                                            <div>{item.product.name}</div>
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

                            <div className="border-t border-[#D5CEA3]/20 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[#D5CEA3]">Total Items:</span>
                                    <span className="text-[#D5CEA3] font-bold">
                                        {transaction.totalQuantity}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-[#D5CEA3]">Total Amount:</span>
                                    <span className="text-[#D5CEA3] font-bold">
                                        ${transaction.totalAmount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TransactionPage;

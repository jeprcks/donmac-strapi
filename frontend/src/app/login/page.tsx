'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [signUpData, setSignUpData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [loginData, setLoginData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLoginData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSignUpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSignUpData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store the token in localStorage
            localStorage.setItem('jwt', data.jwt);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to products page
            router.push('/products');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (signUpData.password !== signUpData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:1337/api/auth/local/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: signUpData.username,
                    password: signUpData.password,
                    email: `${signUpData.username}@example.com`, // Strapi requires an email
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Registration failed');
            }

            // Close modal and show success message
            setIsSignUpModalOpen(false);
            setSignUpData({
                username: '',
                password: '',
                confirmPassword: ''
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#3C2A21] to-[#1A120B] flex items-center justify-center p-4">
            <div className="bg-[#E5E5CB]/10 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-xl border border-[#D5CEA3]/20">
                <div className="flex flex-col items-center mb-8">
                    <div className="text-5xl mb-4">☕</div>
                    <h1 className="text-[#D5CEA3] text-3xl font-bold">Welcome Back</h1>
                    <p className="text-[#E5E5CB]/60 mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={loginData.username}
                            onChange={handleLoginInputChange}
                            className="w-full px-4 py-3 bg-[#1A120B]/50 border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB] placeholder-[#E5E5CB]/30"
                            placeholder="Enter your username"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={loginData.password}
                            onChange={handleLoginInputChange}
                            className="w-full px-4 py-3 bg-[#1A120B]/50 border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB] placeholder-[#E5E5CB]/30"
                            placeholder="Enter your password"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                className="h-4 w-4 rounded border-[#D5CEA3]/20 bg-[#1A120B]/50 text-[#D5CEA3]"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-[#D5CEA3]">
                                Remember me
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#D5CEA3] text-[#1A120B] py-3 rounded-lg font-semibold hover:bg-[#E5E5CB] transition-colors duration-200"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-[#D5CEA3]/60">
                        Don't have an account?{' '}
                        <button
                            onClick={() => setIsSignUpModalOpen(true)}
                            className="text-[#D5CEA3] hover:text-[#E5E5CB] transition-colors"
                        >
                            Sign Up
                        </button>
                    </p>
                </div>
            </div>

            {/* Sign Up Modal */}
            {isSignUpModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1A120B] border border-[#D5CEA3]/20 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-[#D5CEA3] mb-6">Create Account</h2>
                        <form onSubmit={handleSignUpSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="signup-username" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={signUpData.username}
                                    onChange={handleSignUpInputChange}
                                    className="w-full px-4 py-3 bg-[#3C2A21] border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB]"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="signup-password" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={signUpData.password}
                                    onChange={handleSignUpInputChange}
                                    className="w-full px-4 py-3 bg-[#3C2A21] border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB]"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#D5CEA3] mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={signUpData.confirmPassword}
                                    onChange={handleSignUpInputChange}
                                    className="w-full px-4 py-3 bg-[#3C2A21] border border-[#D5CEA3]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5CEA3]/50 text-[#E5E5CB]"
                                    required
                                />
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsSignUpModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-[#D5CEA3]/20 rounded-lg text-[#D5CEA3] hover:bg-[#3C2A21] transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#D5CEA3] text-[#1A120B] rounded-lg hover:bg-[#E5E5CB] transition-colors duration-200"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

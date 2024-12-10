import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
    try {
        const headersList = await headers();
        const response = await fetch('http://localhost:1337/api/products?populate=*', {
            headers: {
                'Content-Type': 'application/json',
                ...Object.fromEntries(await headersList.entries())
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.log('Fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const headersList = await headers();
        const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

        const productResponse = await fetch(`${STRAPI_URL}/api/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...Object.fromEntries(await headersList.entries())
            },
            body: JSON.stringify(body),
        });

        if (!productResponse.ok) {
            const errorData = await productResponse.json();
            return NextResponse.json(
                { error: errorData.error?.message || 'Failed to create product' },
                { status: productResponse.status }
            );
        }

        const productData = await productResponse.json();
        return NextResponse.json(productData);
    } catch (error) {
        console.error('Create error:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        const headersList = await headers();

        if (!id) {
            throw new Error('Product ID is required');
        }

        const response = await fetch(`http://localhost:1337/api/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...Object.fromEntries(await headersList.entries())
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to delete product');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        const body = await request.json();
        const headersList = await headers();
        const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

        if (!id) {
            throw new Error('Product ID is required');
        }

        const response = await fetch(`${STRAPI_URL}/api/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...Object.fromEntries(await headersList.entries())
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to update product');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update product' },
            { status: 500 }
        );
    }
} 
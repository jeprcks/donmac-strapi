import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('http://localhost:1337/api/products?populate=*', {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const productResponse = await fetch('http://localhost:1337/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const productData = await productResponse.json();

        return NextResponse.json(productData);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const response = await fetch(`http://localhost:1337/api/products/${params.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
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

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
        
        const response = await fetch(`${STRAPI_URL}/api/products/${params.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.error?.message || 'Failed to update product' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        );
    }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';

interface RouteParams {
    params: {
        id: string;
    }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const payload = await getPayload();
        const { id } = params;

        const result = await payload.findByID({
            collection: 'customers',
            id: id,
        });

        return NextResponse.json({ doc: result });
    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json(
            { error: 'Customer not found' },
            { status: 404 }
        );
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const payload = await getPayload();
        const { id } = params;
        const data = await request.json();

        const result = await payload.update({
            collection: 'customers',
            id: id,
            data: data,
        });

        return NextResponse.json({ doc: result });
    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const payload = await getPayload();
        const { id } = params;

        const result = await payload.delete({
            collection: 'customers',
            id: id,
        });

        return NextResponse.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

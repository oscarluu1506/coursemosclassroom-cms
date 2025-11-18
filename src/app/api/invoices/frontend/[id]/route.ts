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
            collection: 'invoices',
            id: id,
        });

        return NextResponse.json({ doc: result });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json(
            { error: 'Invoice not found' },
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
            collection: 'invoices',
            id: id,
            data: data,
        });

        return NextResponse.json({ doc: result });
    } catch (error) {
        console.error('Error updating invoice:', error);
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
            collection: 'invoices',
            id: id,
        });

        return NextResponse.json({
            message: 'Invoice deleted successfully',
            deletedId: result.id
        });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// src/app/api/subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/payload/payloadClient';
import { getPayload } from 'payload';
interface RouteParams {
    params: {
        id: string;
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const payload = await getPayloadClient();
        const data = await request.json();
        const subscriptionId = params.id;

        const result = await payload.update({
            collection: 'subscriptions',
            id: subscriptionId,
            data: data,
        });

        return NextResponse.json({ doc: result });
    } catch (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const payload = await getPayload();
        const { id } = params;

        const result = await payload.findByID({
            collection: 'subscriptions',
            id: id,
        });

        return NextResponse.json({ doc: result });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json(
            { error: 'Subscription not found' },
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
            collection: 'subscriptions',
            id: id,
            data: data,
        });

        return NextResponse.json({ doc: result });
    } catch (error) {
        console.error('Error updating subscription:', error);
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
            collection: 'subscriptions',
            id: id,
        });

        return NextResponse.json({
            message: 'Subscription deleted successfully',
            deletedId: result.id
        });
    } catch (error) {
        console.error('Error deleting subscription:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

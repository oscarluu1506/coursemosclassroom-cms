// src/app/api/customers/frontend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/payload/payloadClient';

export async function GET(request: NextRequest) {
    try {
        const payload = await getPayloadClient();
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const where = searchParams.get('where');
        const email = searchParams.get('email');
        const limit = searchParams.get('limit');

        let query = {};

        // Nếu có parameter email trực tiếp
        if (email) {
            query = {
                email: {
                    equals: email,
                },
            };
        }
        // Nếu có parameter where dạng JSON
        else if (where) {
            try {
                query = JSON.parse(where);
            } catch (e) {
                console.error('Error parsing where parameter:', e);
                return NextResponse.json(
                    { error: 'Invalid where parameter' },
                    { status: 400 }
                );
            }
        }

        const result = await payload.find({
            collection: 'customers',
            where: query,
            limit: limit ? parseInt(limit) : 10,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await getPayloadClient();
        const data = await request.json();

        const result = await payload.create({
            collection: 'customers',
            data: data,
        });

        return NextResponse.json({ doc: result });
    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
export async function PATCH(request: NextRequest) {
    try {
        const payload = await getPayloadClientClient();
        const data = await request.json();

        console.log('📝 Update customer request received:', data);

        if (!data.id) {
            console.error('❌ Missing ID in update request');
            return NextResponse.json(
                { error: 'Missing ID of document to update.' },
                { status: 400 }
            );
        }

        // Đảm bảo ID là string
        const customerId = String(data.id);
        console.log('🔧 Attempting to update customer with ID:', customerId);

        const updateData: any = {};
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.organization !== undefined) updateData.organization = data.organization;
        if (data.organization_description !== undefined) updateData.organization_description = data.organization_description;

        console.log('📋 Update data to apply:', updateData);

        // Thực hiện update
        const result = await payload.update({
            collection: 'customers',
            id: customerId,
            data: updateData,
        });

        console.log('✅ Customer updated successfully');
        return NextResponse.json({
            success: true,
            doc: result
        });

    } catch (error: any) {
        console.error('❌ Error updating customer:', error);

        // Kiểm tra nếu lỗi là "document not found"
        if (error.message?.includes('not found') || error.status === 404) {
            return NextResponse.json(
                { error: `Customer not found with ID: ${data.id}` },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                error: error.message || 'Internal Server Error',
            },
            { status: 500 }
        );
    }
}

// src/app/api/customers/frontend/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/payload/payloadClient';

export async function PATCH(request: NextRequest) {
    try {
        const payload = await getPayloadClient();
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

export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Customer update endpoint is working',
        usage: 'Send PATCH request with { id, phone, organization, organization_description }'
    });
}

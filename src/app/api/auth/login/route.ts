// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { flatService } from '@/services/flatService';
import {getPayload} from "payload";
import config from "@payload-config";

export async function POST(request: NextRequest) {
    try {
        const payload = await getPayload({ config })
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = await flatService.login({ email, password });

        // Tìm customer bằng email
        const customers = await payload.find({
            collection: 'customers',
            where: {
                email: {
                    equals: email
                }
            }
        });

        if (customers.docs.length === 0) {
            return NextResponse.json(
                { message: 'Customer not found' },
                { status: 404 }
            );
        }

        const customer = customers.docs[0];

        //Cập nhật secret_key với clientKey từ Flat service
        const updatedCustomer = await payload.update({
            collection: 'customers',
            id: customer.id,
            data: {
                secret_key: user.clientKey
            }
        });

        return NextResponse.json({
            status: 0,
            data: user
        });

    } catch (error: any) {
        console.error('Login API error:', error);

        return NextResponse.json(
            {
                message: error.message || 'Internal server error',
                status: 1
            },
            { status: 500 }
        );
    }
}

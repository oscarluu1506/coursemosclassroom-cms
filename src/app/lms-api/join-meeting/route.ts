import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
    const payload = await getPayload({ config })

    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        // Nếu không có token parameter
        if (!token) {
            return NextResponse.json(
                {
                    error: 'Token is required',
                },
                { status: 401 }
            );
        }

        // Verify token
        const privateKey = process.env.JWT_PRIVATE_KEY;
        if (!privateKey) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        let decoded;
        try {
            decoded = jwt.verify(token, privateKey) as any;

            if (!decoded.roomUUID) {
                return NextResponse.json(
                    { error: 'Meeting UUID is required' },
                    { status: 400 }
                );
            }

            // Tìm meeting trong database theo flat_room_id trước
            const meetings = await payload.find({
                collection: 'meetings',
                where: {
                    flat_room_id: {
                        equals: decoded.roomUUID
                    }
                }
            });

            if (meetings.docs.length === 0) {
                return NextResponse.json(
                    { error: 'Meeting not found' },
                    { status: 404 }
                );
            }

            const meeting = meetings.docs[0];

            // Kiểm tra quyền truy cập bằng email
            const hasPermission = checkMeetingPermission(meeting, decoded.email);

            if (!hasPermission) {
                return NextResponse.json(
                    {
                        error: 'No permission to join this meeting',
                        meeting: {
                            name: meeting.name,
                            flat_room_id: meeting.flat_room_id
                        }
                    },
                    { status: 403 }
                );
            }

            // Nếu có quyền, trả về Flat room link thực tế
            return NextResponse.json(
                {
                    success: true,
                    joinUrl: meeting.flat_room_link+`?token=${token}`,
                    meeting: {
                        id: meeting.id,
                        name: meeting.name,
                        flat_room_id: meeting.flat_room_id
                    }
                },
                { status: 200 }
            );
        } catch (jwtError: any) {
            if (jwtError.name === 'JsonWebTokenError') {
                return NextResponse.json(
                    { error: 'Invalid token' },
                    { status: 400 }
                );
            }
            if (jwtError.name === 'TokenExpiredError') {
                return NextResponse.json(
                    { error: 'Token expired' },
                    { status: 400 }
                );
            }
            throw jwtError;
        }



    } catch (error: any) {
        console.error(`Error joining meeting: ${error.message}`)

        return NextResponse.json(
            { error: 'Failed to join meeting: ' + error.message },
            { status: 500 }
        );
    }
}

// Hàm kiểm tra quyền join meeting
function checkMeetingPermission(meeting: any, email: string): boolean {
    if (!email) return false;

    const normalizedEmail = email.toLowerCase().trim();
    // Kiểm tra trong mảng users
    if (meeting.users && Array.isArray(meeting.users)) {
        const hasUserPermission = meeting.users.some((user: any) =>
            user.email && user.email.toLowerCase().trim() === normalizedEmail
        );
        if (hasUserPermission) {
            return true;
        }
    }

    // Kiểm tra moodle_user_email
    if (meeting.moodle_user_email &&
        meeting.moodle_user_email.toLowerCase().trim() === normalizedEmail) {
        return true;
    }

    if (meeting.customer_id?.email &&
        meeting.customer_id.email.toLowerCase().trim() === normalizedEmail) {
        return true;
    }

    return false;
}

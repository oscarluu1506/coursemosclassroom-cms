import { NextResponse } from 'next/server'
import { authenticateCustomer, checkMeetingOwner } from '../../../../lib/moodle-auth-utils'
import { getPayload } from 'payload'
import config from '@payload-config'
import jwt from 'jsonwebtoken'
import { flatService } from "@/services/flatService"

// Constants and error messages
const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Unauthorized',
    TOKEN_REQUIRED: 'Token is required.',
    SERVER_CONFIG_ERROR: 'Server configuration error',
    MEETING_NOT_FOUND: 'Meeting not found.',
    NO_PERMISSION: 'Meeting not found or you do not have permission.',
    MEETING_NAME_REQUIRED: 'Meeting name is required.',
    UPDATE_FAILED: 'Failed to update meeting',
    INVALID_TOKEN: 'Invalid token',
} as const

const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const

interface DecodedToken {
    title: string
    roomUUID: string
    beginTime?: string
    endTime?: string
    duration?: string
}

interface UpdateMeetingData {
    name: string
    start_time: Date | null
    end_time: Date | null
    duration: number | null
}

export async function POST(request: Request) {
    const payload = await getPayload({ config })

    try {
        // Authentication
        const customer = await authenticateCustomer(request)
        if (!customer) {
            return NextResponse.json(
                { error: ERROR_MESSAGES.UNAUTHORIZED },
                { status: HTTP_STATUS.UNAUTHORIZED }
            )
        }

        // Token validation
        const formData = await request.formData()
        const token = formData.get('token') as string

        if (!token) {
            return NextResponse.json(
                { error: ERROR_MESSAGES.TOKEN_REQUIRED },
                { status: HTTP_STATUS.BAD_REQUEST }
            )
        }

        // JWT verification
        const privateKey = process.env.JWT_PRIVATE_KEY
        if (!privateKey) {
            console.error('JWT_PRIVATE_KEY is not configured')
            return NextResponse.json(
                { error: ERROR_MESSAGES.SERVER_CONFIG_ERROR },
                { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
            )
        }

        let decoded: DecodedToken
        try {
            decoded = jwt.verify(token, privateKey) as DecodedToken
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError)
            return NextResponse.json(
                { error: ERROR_MESSAGES.INVALID_TOKEN },
                { status: HTTP_STATUS.BAD_REQUEST }
            )
        }

        // Validate required fields
        if (!decoded.title) {
            return NextResponse.json(
                { error: ERROR_MESSAGES.MEETING_NAME_REQUIRED },
                { status: HTTP_STATUS.BAD_REQUEST }
            )
        }

        // Find meeting
        const meetings = await payload.find({
            collection: 'meetings',
            where: {
                flat_room_id: {
                    equals: decoded.roomUUID
                }
            },
            limit: 1
        })

        if (meetings.docs.length === 0) {
            return NextResponse.json(
                { error: ERROR_MESSAGES.MEETING_NOT_FOUND },
                { status: HTTP_STATUS.NOT_FOUND }
            )
        }

        const meeting = meetings.docs[0]

        // Check ownership
        const ownerCheck = await checkMeetingOwner(decoded.roomUUID, customer.id)
        if (!ownerCheck.exists) {
            return NextResponse.json(
                { error: ERROR_MESSAGES.NO_PERMISSION },
                { status: HTTP_STATUS.NOT_FOUND }
            )
        }

        // Prepare update data
        const dataToUpdate: UpdateMeetingData = {
            name: decoded.title,
            start_time: decoded.beginTime ? new Date(decoded.beginTime) : null,
            end_time: decoded.endTime ? new Date(decoded.endTime) : null,
            duration: decoded.duration ? parseInt(decoded.duration) : null,
        }

        // Update meeting
        const updatedMeeting = await payload.update({
            collection: 'meetings',
            id: meeting.id,
            data: dataToUpdate,
        })

        // Update Flat room
        try {
            const flatRoomResponse = await flatService.updateRoomWithToken(token)
            console.log(flatRoomResponse)
            if (flatRoomResponse.status === 0) {
                console.log('Flat room updated successfully',flatRoomResponse)
            } else {
                console.warn('Flat room update returned non-zero status:', flatRoomResponse)
            }
        } catch (flatError) {
            console.error('Failed to update Flat room:', flatError)
            // Continue execution as meeting was updated successfully
        }

        return NextResponse.json({
            success: true,
            data: updatedMeeting
        }, { status: HTTP_STATUS.OK })

    } catch (error: any) {
        console.error(`Error updating meeting: ${error.message}`)

        // Log additional context for debugging
        if (error.stack) {
            console.error('Stack trace:', error.stack)
        }

        return NextResponse.json(
            {
                error: ERROR_MESSAGES.UPDATE_FAILED,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        )
    }
}

// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}

import axios from 'axios';
import crypto from 'crypto';

export interface CreateOrdinaryRoomRequest {
    title: string;
    type: 'SmallClass';
    beginTime: number;
    endTime: number;
    pmi: boolean;
    region: string;
    email: string;
    clientKey: string;
}

export interface CreateOrdinaryRoomResponse {
    roomUUID: string;
    roomId: number;
    roomOriginId: string;
    inviteCode: string;
    joinUrl: string;
    createdAt: number;
}

export interface FlatRoom {
    roomUUID: string;
    roomId: number;
    joinUrl: string;
    createdAt: number;
}

export interface FlatLoginRequest {
    email: string;
    password: string;
}

export interface FlatLoginResponse {
    status: number;
    data: {
        name: string;
        avatar: string;
        userUUID: string;
        token: string;
        hasPhone: boolean;
        hasPassword: boolean;
        isAnonymous: boolean;
        clientKey: string;
    };
}
export interface StopRoomRequest {
    roomUUID: string;
}

export interface StopRoomResponse {
    status: number;
    data: {
        roomUUID: string;
        roomStatus: string;
    };
}
export interface FlatUser {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
    hasPhone: boolean;
    hasPassword: boolean;
    isAnonymous: boolean;
    clientKey: string;
    email: string;
}

export interface SendVerificationCodeRequest {
    email: string;
    lang: string;
}

export interface SendVerificationCodeResponse {
    status: number;
    data: {};
}

export interface RegisterRequest {
    email: string;
    password: string;
    code: string;
}

export interface RegisterResponse {
    status: number;
    data: {
        name: string;
        avatar: string;
        userUUID: string;
        token: string;
        hasPhone: boolean;
        hasPassword: boolean;
        isAnonymous: boolean;
    };
}

export interface RoomListResponse {
    status: number;
    data: {
        total: number;
        list: RoomItem[];
        page: number;
        limit: number;
    };
}

export interface RoomItem {
    id: string;
    created_at: string;
    updated_at: string;
    version: number;
    room_uuid: string;
    periodic_uuid: string;
    owner_uuid: string;
    title: string;
    room_type: string;
    room_status: string;
    begin_time: string;
    end_time: string;
    region: string;
    whiteboard_room_uuid: string;
    is_delete: number;
    has_record: number;
    is_ai: number;
    user_uuid: string;
    user_name: string;
}
export interface RoomInfoResponse {
    status: number;
    data: {
        roomInfo: {
            title: string;
            beginTime: number;
            endTime: number;
            roomType: string;
            roomStatus: 'Idle' | 'Started' | 'Stopped' | 'Paused';
            ownerUUID: string;
            ownerUserName: string;
            ownerName: string;
            hasRecord: boolean;
            region: string;
            inviteCode: string;
            isPmi: boolean;
            isAI: boolean;
        };
    };
}

export interface TotalMinutesResponse {
    totalMinutes: number;
    totalRooms: number;
    rooms: Array<{
        roomUUID: string;
        title: string;
        duration: number;
        beginTime: number;
        endTime: number;
        roomStatus: string;
    }>;
}

export interface RoomInfoRequest {
    roomUUID: string;
}
export interface RoomParticipantsRequest {
    room_uuid: string;
    page?: number;
    limit?: number;
}

export interface RoomParticipant {
    room_title: string;
    avatar_url: string;
    user_name: string;
}

export interface RoomParticipantsResponse {
    status: number;
    data: {
        total: number;
        list: RoomParticipant[];
        page: number;
        limit: number;
    };
}

export interface RoomParticipantsSummary {
    totalParticipants: number;
    participants: RoomParticipant[];
    roomTitle: string;
}
export interface OrganizationUser {
    id: string;
    created_at: string;
    updated_at: string;
    version: number;
    user_uuid: string;
    user_name: string;
    user_password: string;
    avatar_url: string;
    client_key: string;
    gender: string;
    is_delete: number;
    parent_uuid: string;
}

export interface OrganizationUsersResponse {
    status: number;
    data: {
        total: number;
        list: OrganizationUser[];
        page: number;
        limit: number;
    };
}

export interface OrganizationUsersSummary {
    totalUsers: number;
    users: OrganizationUser[];
    page: number;
    limit: number;
}

export class FlatService {
    private baseURL: string;

    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_FLAT_BACKEND_BASE_URL;
        console.log('FlatService initialized with baseURL:', this.baseURL);
    }

    /**
     * Generate client key từ secret key
     */
    public generateClientKey(secretKey: string): string {
        return crypto
            .createHash('md5')
            .update(secretKey + 'test')
            .digest('hex');
    }

    /**
     * Gửi mã xác nhận đến email
     */
    async sendVerificationCode(email: string): Promise<void> {
        try {
            console.log('Sending verification code to email:', email);
            console.log('Using baseURL:', this.baseURL);

            const requestData: SendVerificationCodeRequest = {
                email: email,
                lang: 'en'
            };

            const response = await axios.post<SendVerificationCodeResponse>(
                `${this.baseURL}/v2/register/email/send-message`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (response.data.status !== 0) {
                throw new Error('Failed to send verification code');
            }

            console.log('Verification code sent successfully to:', email);

        } catch (error: any) {
            console.error('Error sending verification code:', error);
            console.error('Error response:', error.response?.data);
            throw new Error(`Failed to send verification code: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Đăng ký tài khoản mới với email và mã xác nhận
     */
    async register(credentials: RegisterRequest): Promise<FlatUser> {
        try {
            console.log('Registering new user with email:', credentials.email);
            console.log('Using baseURL:', this.baseURL);

            const response = await axios.post<RegisterResponse>(
                `${this.baseURL}/v2/register/email`,
                credentials,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (response.data.status !== 0) {
                throw new Error('Registration failed');
            }

            console.log('Flat.io registration successful, Response:', response.data.data);
            console.log('User UUID:', response.data.data.userUUID);
            console.log('Token:', response.data.data.token);

            return {
                ...response.data.data,
                clientKey: '', // Registration response không có clientKey
                email: credentials.email
            };

        } catch (error: any) {
            console.error('Error registering to Flat.io:', error);
            console.error('Error response:', error.response?.data);
            throw new Error(`Failed to register to Flat.io: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Đăng nhập vào Flat
     */
    async login(credentials: FlatLoginRequest): Promise<FlatUser> {
        try {
            console.log('Logging into Flat.io with email:', credentials.email);
            console.log('Using baseURL:', this.baseURL);

            const response = await axios.post<FlatLoginResponse>(
                `${this.baseURL}/v2/login/email`,
                credentials,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (response.data.status !== 0) {
                throw new Error('Login failed');
            }

            console.log('Flat.io login successful, Response:', response.data.data);
            console.log('User UUID:', response.data.data.userUUID);
            console.log('Token:', response.data.data.token);
            console.log('Client Key:', response.data.data.clientKey);

            return {
                ...response.data.data,
                email: credentials.email
            };

        } catch (error: any) {
            console.error('Error logging into Flat.io:', error);
            console.error('Error response:', error.response?.data);
            throw new Error(`Failed to login to Flat.io: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Lấy danh sách phòng của user
     */
    async getUserRooms(token: string, page: number = 1, limit: number = 10): Promise<RoomListResponse['data']> {
        try {
            console.log('Fetching user rooms with token:', token.substring(0, 20) + '...');

            const response = await axios.get<RoomListResponse>(
                `${this.baseURL}/v1/user/organization/list-room`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    params: {
                        page,
                        limit
                    }
                }
            );

            if (response.data.status !== 0) {
                throw new Error('Failed to fetch rooms');
            }

            console.log('User rooms fetched successfully:', response.data.data);

            return response.data.data;

        } catch (error: any) {
            console.error('Error fetching user rooms:', error);
            console.error('Error response:', error.response?.data);
            throw new Error(`Failed to fetch user rooms: ${error.response?.data?.message || error.message}`);
        }
    }


    async stopRoom(roomUUID: string, token: string): Promise<StopRoomResponse['data']> {
        try {
            console.log('Stopping room:', roomUUID);
            console.log('Using baseURL:', this.baseURL);

            const requestData: StopRoomRequest = {
                roomUUID: roomUUID,
            };

            const response = await axios.post<StopRoomResponse>(
                `${this.baseURL}/v1/user/organization/room/update-status/stopped`,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (response.data.status !== 0) {
                throw new Error('Failed to stop room');
            }

            console.log('Room stopped successfully:', response.data.data);

            return response.data.data;

        } catch (error: any) {
            console.error('Error stopping room:', error);
            console.error('Error response:', error.response?.data);
            throw new Error(`Failed to stop room: ${error.response?.data?.message || error.message}`);
        }
    }
    /**
     * Tạo phòng ordinary mới (legacy method)
     */
    async createRoom(roomData: {
        title: string;
        type: 'SmallClass';
        beginTime: number;
        endTime: number;
        email: string;
    }, customer: any): Promise<FlatRoom> {
        try {
            const publicUrl = process.env.NEXT_PUBLIC_URL || 'localhost:3000'
            // Tạo clientKey từ secret_key của customer
            const clientKey = this.generateClientKey(customer.secret_key ?? customer.flatUser.clientKey);

            const tokenResponse = await fetch(`${publicUrl}/data-token/create-room-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...roomData,
                    clientKey
                }),
            });

            if (!tokenResponse.ok) {
                throw new Error('Failed to generate token');
            }

            const { token } = await tokenResponse.json();

            // Gọi API tạo phòng với token
            const result = await this.createRoomWithToken(token)
            if (result.status === 0) {
                const flatRoom = {
                    roomUUID: result.data.roomUUID,
                    roomId: result.data.roomId,
                    joinUrl: `${process.env.NEXT_PUBLIC_FLAT_CMS_BASE_URL}/join/${result.data.roomUUID}`,
                    createdAt: result.data.createdAt
                };


                return flatRoom;

            } else {
                throw new Error(result.message || 'Failed to create room');
            }

        } catch (error: any) {
            throw new Error(`Failed to create room: ${error.message}`);
        }
    }

    async createRoomWithToken(token) : Promise<FlatRoom> {
        const response = await fetch(`${this.baseURL}/v1/room/create/ordinary-by-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });
        return response.json();
    }

    async updateRoomWithToken(token) : Promise<FlatRoom> {
        const response = await fetch(`${this.baseURL}/v1/user/organization/room/update/ordinary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });
        return response.json();
    }

    /**
     * Lấy thông tin chi tiết của phòng
     */
    async getRoomInfo(roomUUID: string, token: string): Promise<RoomInfoResponse['data']> {
        try {
            console.log('Fetching room info for roomUUID:', roomUUID);
            console.log('Using baseURL:', this.baseURL);

            const requestData: RoomInfoRequest = {
                roomUUID: roomUUID,
            };

            const response = await axios.post<RoomInfoResponse>(
                `${this.baseURL}/v1/user/organization/room/info/ordinary`,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (response.data.status !== 0) {
                throw new Error('Failed to fetch room info');
            }

            console.log('Room info fetched successfully:', response.data.data);

            return response.data.data;

        } catch (error: any) {
            console.error('Error fetching room info:', error);
            console.error('Error response:', error.response?.data);
            throw new Error(`Failed to fetch room info: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Lấy tổng số phút của tất cả các phòng
     */
    async getTotalRoomMinutes(token: string, options?: {
        startDate?: Date;    // Lọc từ ngày
        endDate?: Date;      // Lọc đến ngày
        roomStatus?: string; // Lọc theo trạng thái
        page?: number;
        limit?: number;
    }): Promise<TotalMinutesResponse> {
        try {
            console.log('Calculating total room minutes');

            const {
                startDate,
                endDate,
                roomStatus,
                page = 1,
                limit = 50
            } = options || {};

            // Lấy tất cả các phòng
            const allRooms: any[] = [];
            let currentPage = page;
            let hasMore = true;

            // Lặp qua tất cả các trang để lấy toàn bộ phòng
            while (hasMore) {
                console.log(`Fetching rooms page ${currentPage}`);

                const roomsData = await this.getUserRooms(token, currentPage, limit);

                if (roomsData.list.length === 0) {
                    hasMore = false;
                    break;
                }

                allRooms.push(...roomsData.list);

                // Kiểm tra nếu đã lấy hết tất cả phòng
                if (allRooms.length >= roomsData.total || roomsData.list.length < limit) {
                    hasMore = false;
                } else {
                    currentPage++;
                }
            }

            console.log(`Total rooms fetched: ${allRooms.length}`);

            // Lọc phòng theo điều kiện (nếu có)
            let filteredRooms = allRooms;

            if (startDate) {
                filteredRooms = filteredRooms.filter(room =>
                    new Date(room.room_begin_time) >= startDate
                );
            }

            if (endDate) {
                filteredRooms = filteredRooms.filter(room =>
                    new Date(room.room_begin_time) <= endDate
                );
            }

            if (roomStatus) {
                filteredRooms = filteredRooms.filter(room =>
                    room.room_status === roomStatus
                );
            }

            // Tính toán tổng số phút và thu thập thông tin chi tiết
            let totalMinutes = 0;
            const roomsWithDetails: TotalMinutesResponse['rooms'] = [];

            for (const room of filteredRooms) {
                try {
                    // Lấy thông tin chi tiết của từng phòng để có beginTime và endTime chính xác
                    const roomInfo = await this.getRoomInfo(room.room_uuid, token);

                    const beginTime = roomInfo.roomInfo.beginTime;
                    const endTime = roomInfo.roomInfo.endTime;

                    // Tính số phút (chuyển từ milliseconds sang phút)
                    const duration = Math.max(0, Math.round((endTime - beginTime) / (1000 * 60)));

                    totalMinutes += duration;

                    roomsWithDetails.push({
                        roomUUID: room.room_uuid,
                        title: roomInfo.roomInfo.title,
                        duration: duration,
                        beginTime: beginTime,
                        endTime: endTime,
                        roomStatus: roomInfo.roomInfo.roomStatus
                    });

                    console.log(`Room "${roomInfo.roomInfo.title}": ${duration} minutes`);

                } catch (error) {
                    console.error(`Error processing room ${room.room_uuid}:`, error);
                    // Vẫn tính toán dựa trên thông tin cơ bản nếu không lấy được chi tiết
                    if (room.room_begin_time && room.room_end_time) {
                        const beginTime = new Date(room.room_begin_time).getTime();
                        const endTime = new Date(room.room_end_time).getTime();
                        const duration = Math.max(0, Math.round((endTime - beginTime) / (1000 * 60)));

                        totalMinutes += duration;

                        roomsWithDetails.push({
                            roomUUID: room.room_uuid,
                            title: room.room_title,
                            duration: duration,
                            beginTime: beginTime,
                            endTime: endTime,
                            roomStatus: room.room_status
                        });
                    }
                }
            }

            const result: TotalMinutesResponse = {
                totalMinutes: totalMinutes,
                totalRooms: filteredRooms.length,
                rooms: roomsWithDetails
            };

            console.log(`Total minutes calculated: ${totalMinutes} minutes across ${filteredRooms.length} rooms`);

            return result;

        } catch (error: any) {
            console.error('Error calculating total room minutes:', error);
            throw new Error(`Failed to calculate total room minutes: ${error.message}`);
        }
    }

    /**
     * Lấy tổng số phút theo tháng (tiện ích)
     */
    async getTotalMinutesThisMonth(token: string): Promise<TotalMinutesResponse> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        return this.getTotalRoomMinutes(token, {
            startDate: startOfMonth,
            endDate: endOfMonth
        });
    }

    /**
     * Lấy tổng số phút theo ngày (tiện ích)
     */
    async getTotalMinutesToday(token: string): Promise<TotalMinutesResponse> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        return this.getTotalRoomMinutes(token, {
            startDate: startOfDay,
            endDate: endOfDay
        });
    }

    /**
     * Lấy danh sách participants của một room
     */
    async getRoomParticipants(roomUUID: string, token: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<RoomParticipantsSummary> {
        try {
            console.log('Fetching room participants for roomUUID:', roomUUID);

            const requestData: RoomParticipantsRequest = {
                room_uuid: roomUUID,
                page: options?.page || 1,
                limit: options?.limit || 50
            };

            const response = await axios.post<RoomParticipantsResponse>(
                `${this.baseURL}/v1/user/organization/room/list-user`,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            console.log('Response:', (response))
            if (response.data.status !== 0) {
                throw new Error('Failed to fetch room participants');
            }

            console.log('Room participants fetched successfully:', {
                total: response.data.data.total,
                participantsCount: response.data.data.list.length,
                roomTitle: response.data.data.list[0]?.room_title || 'Unknown'
            });

            return {
                totalParticipants: response.data.data.total,
                participants: response.data.data.list,
                roomTitle: response.data.data.list[0]?.room_title || 'Unknown Room'
            };

        } catch (error: any) {
            console.error('Error fetching room participants:', error);
            console.error('Error response:', error.response?.data);
            throw new Error(`Failed to fetch room participants: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Lấy tất cả participants của một room (tự động lấy tất cả trang)
     */
    async getAllRoomParticipants(roomUUID: string, token: string): Promise<RoomParticipantsSummary> {
        try {
            console.log('Fetching all participants for roomUUID:', roomUUID);

            const allParticipants: RoomParticipant[] = [];
            let currentPage = 1;
            const limit = 50;
            let hasMore = true;
            let roomTitle = '';

            while (hasMore) {
                console.log(`Fetching participants page ${currentPage} for room ${roomUUID}`);

                const response = await this.getRoomParticipants(roomUUID, token, {
                    page: currentPage,
                    limit: limit
                });

                // Lưu room title từ page đầu tiên
                if (currentPage === 1) {
                    roomTitle = response.roomTitle;
                }

                allParticipants.push(...response.participants);

                // Kiểm tra nếu đã lấy hết tất cả participants
                if (allParticipants.length >= response.totalParticipants || response.participants.length < limit) {
                    hasMore = false;
                } else {
                    currentPage++;
                }
            }

            console.log(`Fetched all ${allParticipants.length} participants for room "${roomTitle}"`);

            return {
                totalParticipants: allParticipants.length,
                participants: allParticipants,
                roomTitle: roomTitle
            };

        } catch (error: any) {
            console.error('Error fetching all room participants:', error);
            throw new Error(`Failed to fetch all room participants: ${error.message}`);
        }
    }

    /**
     * Lấy tổng số participants của nhiều rooms
     */
    async getTotalParticipantsForAllRoomUnderOrganization(
        token: string,
        options?: {
            page?: number;
            limit?: number;
        }
    ): Promise<OrganizationUsersSummary> {
        try {
            console.log('Fetching organization users');
            console.log('Using baseURL:', this.baseURL);

            const page = options?.page || 1;
            const limit = options?.limit || 10;

            const response = await axios.get<OrganizationUsersResponse>(
                `${this.baseURL}/v1/user/organization/list-user`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    params: {
                        page,
                        limit
                    }
                }
            );

            if (response.data.status !== 0) {
                throw new Error('Failed to fetch organization users');
            }

            console.log('Organization users fetched successfully:', {
                total: response.data.data.total,
                usersCount: response.data.data.list.length,
                page: response.data.data.page,
                limit: response.data.data.limit
            });

            return {
                totalUsers: response.data.data.total,
                users: response.data.data.list,
                page: response.data.data.page,
                limit: response.data.data.limit
            };

        } catch (error: any) {
            console.error('Error fetching organization users:', error);
            console.error('Error response:', error.response?.data);
            throw new Error(`Failed to fetch organization users: ${error.response?.data?.message || error.message}`);
        }
    }


}

// Export singleton instance
export const flatService = new FlatService();

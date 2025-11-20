import axios from 'axios';
import {
    FlatRoom,
    FlatRoomResponse,
    StopRoomRequest,
    StopRoomResponse,
    RoomListResponse,
    RoomInfoResponse,
    TotalMinutesResponse,
    RoomInfoRequest,
    RoomParticipantsRequest,
    RoomParticipantsResponse,
    RoomParticipantsSummary,
    RoomItem
} from '../types';
import { generateClientKey } from '../utils/crypto';
import {RoomParticipant} from "@/services/flat/types";

export class RoomService {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
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

    /**
     * Dừng phòng
     */
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
    }, customer: any): Promise<FlatRoomResponse> {
        try {
            const publicUrl = process.env.NEXT_PUBLIC_URL || 'localhost:3000';
            // Tạo clientKey từ secret_key của customer
            const clientKey = generateClientKey(customer.secret_key ?? customer.flatUser.clientKey);

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
            const result = await this.createRoomWithToken(token);
            if (result.status === 0) {
                const flatRoom = {
                    status: 0,
                    data: {
                        roomUUID: result.data.roomUUID,
                        joinUrl: `${process.env.NEXT_PUBLIC_FLAT_CMS_BASE_URL}/join/${result.data.roomUUID}`,
                        inviteCode: result.data.inviteCode
                    }

                };

                return flatRoom;

            } else {
                throw new Error(JSON.stringify(result) || 'Failed to create room');
            }

        } catch (error: any) {
            throw new Error(`Failed to create room: ${error.message}`);
        }
    }

    /**
     * Tạo phòng với token
     */
    async createRoomWithToken(token: string): Promise<FlatRoomResponse> {
        const response = await fetch(`${this.baseURL}/v1/room/create/ordinary-by-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });
        return response.json();
    }

    /**
     * Cập nhật phòng với token
     */
    async updateRoomWithToken(token: string): Promise<FlatRoomResponse> {
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
        startDate?: Date;
        endDate?: Date;
        roomStatus?: string;
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
            const allRooms: RoomItem[] = [];
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
                    new Date(room.begin_time) >= startDate
                );
            }

            if (endDate) {
                filteredRooms = filteredRooms.filter(room =>
                    new Date(room.begin_time) <= endDate
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
                    if (room.begin_time && room.end_time) {
                        const beginTime = new Date(room.begin_time).getTime();
                        const endTime = new Date(room.end_time).getTime();
                        const duration = Math.max(0, Math.round((endTime - beginTime) / (1000 * 60)));

                        totalMinutes += duration;

                        roomsWithDetails.push({
                            roomUUID: room.room_uuid,
                            title: room.title,
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
}

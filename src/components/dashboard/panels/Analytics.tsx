// src/components/dashboard/panels/Analytics.tsx
'use client';

import { useState, useEffect } from 'react';
import { FlatUser, flatService, TotalMinutesResponse, RoomInfoResponse, RoomItem } from '@/services/flatService';

interface AnalyticsProps {
    user: FlatUser;
}

type TimeRange = 'all' | 'month';

interface RoomWithDetails {
    roomUUID: string;
    title: string;
    beginTime: number;
    endTime: number;
    roomStatus: string;
    duration: number;
    participants: number;
    roomInfo?: RoomInfoResponse['data']['roomInfo'];
}

// Fallback data khi API fail
const defaultAnalyticsData: TotalMinutesResponse = {
    totalMinutes: 0,
    totalRooms: 0,
    rooms: []
};

const Analytics: React.FC<AnalyticsProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<TimeRange>('month');
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [data, setData] = useState<TotalMinutesResponse>(defaultAnalyticsData);
    const [roomsWithDetails, setRoomsWithDetails] = useState<RoomWithDetails[]>([]);
    const [totalParticipants, setTotalParticipants] = useState<number>(0);
    const [totalActualMinutes, setTotalActualMinutes] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        fetchAnalyticsData();
    }, [activeTab, user.token]);

    // Fetch room details và participants khi data thay đổi
    useEffect(() => {
        if (data && data.rooms && data.rooms.length > 0) {
            fetchRoomDetailsAndParticipants();
        } else {
            setRoomsWithDetails([]);
            setTotalParticipants(0);
            setTotalActualMinutes(0);
        }
    }, [data, user.token]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            setError(null);
            setDetailsError(null);
            console.log('Fetching analytics data...');

            let analyticsData: TotalMinutesResponse;

            if (activeTab === 'month') {
                console.log('Fetching monthly data...');
                analyticsData = await flatService.getTotalMinutesThisMonth(user.token);
            } else {
                console.log('Fetching all-time data...');
                analyticsData = await flatService.getTotalRoomMinutes(user.token);
            }

            console.log('Analytics data received:', analyticsData);
            setData(analyticsData);
            setLastUpdated(new Date());

        } catch (err: any) {
            console.error('Error fetching analytics data:', err);

            // Phân loại lỗi để hiển thị message phù hợp
            let errorMessage = 'Failed to load analytics data';

            if (err.message?.includes('Failed to fetch user rooms')) {
                errorMessage = 'Unable to connect to room service. Please check your internet connection.';
            } else if (err.message?.includes('Failed to fetch rooms')) {
                errorMessage = 'Cannot retrieve room list. The service might be temporarily unavailable.';
            } else if (err.message?.includes('Failed to calculate total room minutes')) {
                errorMessage = 'Unable to calculate usage statistics. Please try again later.';
            } else if (err.message?.includes('Authorization')) {
                errorMessage = 'Authentication failed. Please log in again.';
            }

            setError(errorMessage);
            setData(defaultAnalyticsData);
        } finally {
            setLoading(false);
        }
    };

    // Hàm mới: Lấy danh sách active rooms
    const getActiveRooms = async (): Promise<RoomItem[]> => {
        try {
            console.log('Fetching active rooms...');
            const roomsData = await flatService.getUserRooms(user.token, 1, 100);

            // Lọc active rooms theo điều kiện: (status='Idle' và is_delete=0) hoặc status='Started'
            const activeRooms = roomsData.list.filter(room =>
                (room.room_status === 'Idle' && room.room_is_delete === 0) ||
                room.room_status === 'Started'
            );

            console.log(`Found ${activeRooms.length} active rooms out of ${roomsData.list.length} total rooms`);
            return activeRooms;
        } catch (err: any) {
            console.error('Error fetching active rooms:', err);
            throw new Error('Failed to fetch active rooms');
        }
    };

    // Hàm mới: Tính duration thực tế từ beginTime và endTime
    const calculateActualDuration = (beginTime: number, endTime: number): number => {
        return Math.max(0, Math.round((endTime - beginTime) / (1000 * 60)));
    };

    const fetchRoomDetailsAndParticipants = async () => {
        if (!data || !data.rooms || data.rooms.length === 0) {
            setRoomsWithDetails([]);
            setTotalParticipants(0);
            setTotalActualMinutes(0);
            return;
        }

        try {
            setDetailsLoading(true);
            setDetailsError(null);
            console.log('Fetching room details and participants...');

            const roomsDetails: RoomWithDetails[] = [];
            let totalParticipantsCount = 0;
            let totalActualMinutesCount = 0;

            const allParticipants = await flatService.getTotalParticipantsForAllRoomUnderOrganization(
                user.token,
                { page: 1, limit: 100 }
            );
            // Lấy thông tin chi tiết và participants cho từng room
            for (const room of data.rooms.slice(0, 50)) { // Giới hạn 50 rooms để tránh overload
                try {
                    // Lấy thông tin room chi tiết để có beginTime và endTime thực tế
                    const roomInfo = await flatService.getRoomInfo(room.roomUUID, user.token);
                    // Lấy participants của room (thực tế)
                    const participantsData = await flatService.getRoomParticipants(
                        room.roomUUID,
                        user.token,
                        { page: 1, limit: 100 }
                    );
                    // Tính duration thực tế từ beginTime và endTime thực tế
                    const actualBeginTime = roomInfo.roomInfo.beginTime;
                    const actualEndTime = roomInfo.roomInfo.endTime;
                    const actualDuration = calculateActualDuration(actualBeginTime, actualEndTime);

                    const roomDetail: RoomWithDetails = {
                        roomUUID: room.roomUUID,
                        title: roomInfo.roomInfo.title,
                        beginTime: actualBeginTime,
                        endTime: actualEndTime,
                        roomStatus: roomInfo.roomInfo.roomStatus,
                        duration: actualDuration,
                        participants: participantsData.totalParticipants,
                        roomInfo: roomInfo.roomInfo
                    };

                    roomsDetails.push(roomDetail);
                    totalParticipantsCount = allParticipants.totalUsers;
                    totalActualMinutesCount += actualDuration;

                    console.log(`Room "${roomInfo.roomInfo.title}": ${actualDuration} minutes, ${participantsData.totalParticipants} participants`);

                } catch (roomError: any) {
                    console.error(`Error fetching details for room ${room.roomUUID}:`, roomError);

                    // Fallback: sử dụng dữ liệu ước tính nếu không lấy được chi tiết
                    const estimatedDuration = room.duration || 0;
                    const estimatedParticipants = Math.max(1, Math.round(estimatedDuration / 10)); // Ước tính dựa trên duration

                    const roomDetail: RoomWithDetails = {
                        roomUUID: room.roomUUID,
                        title: room.title,
                        beginTime: room.beginTime || Date.now(),
                        endTime: room.endTime || Date.now(),
                        roomStatus: room.roomStatus,
                        duration: estimatedDuration,
                        participants: estimatedParticipants
                    };

                    roomsDetails.push(roomDetail);
                    totalParticipantsCount = allParticipants.totalUsers;
                    totalActualMinutesCount += estimatedDuration;
                }

                // Thêm delay nhỏ để tránh rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            setRoomsWithDetails(roomsDetails);
            setTotalParticipants(totalParticipantsCount);
            setTotalActualMinutes(totalActualMinutesCount);

            console.log(`Fetched details for ${roomsDetails.length} rooms`);
            console.log(`Total participants: ${totalParticipantsCount}`);
            console.log(`Total actual minutes: ${totalActualMinutesCount}`);

        } catch (err: any) {
            console.error('Error fetching room details:', err);

            let errorMessage = 'Failed to load room details';
            if (err.message?.includes('Authorization')) {
                errorMessage = 'Unable to fetch room details: Authentication failed';
            } else if (err.message?.includes('rate limit')) {
                errorMessage = 'Room details temporarily unavailable due to rate limiting';
            }

            setDetailsError(errorMessage);

            // Fallback: sử dụng dữ liệu cơ bản
            const fallbackRooms = data.rooms.map(room => ({
                roomUUID: room.roomUUID,
                title: room.title,
                beginTime: room.beginTime || Date.now(),
                endTime: room.endTime || Date.now(),
                roomStatus: room.roomStatus,
                duration: room.duration || 0,
                participants: Math.max(1, Math.round((room.duration || 0) / 10)) // Ước tính
            }));

            const fallbackParticipants = fallbackRooms.reduce((sum, room) => sum + room.participants, 0);
            const fallbackMinutes = fallbackRooms.reduce((sum, room) => sum + room.duration, 0);

            setRoomsWithDetails(fallbackRooms);
            setTotalParticipants(fallbackParticipants);
            setTotalActualMinutes(fallbackMinutes);
        } finally {
            setDetailsLoading(false);
        }
    };

    // Hàm mới: Lấy tổng số active rooms thực tế
    const fetchActiveRoomsCount = async (): Promise<number> => {
        try {
            const activeRooms = await getActiveRooms();
            return activeRooms.length;
        } catch (err) {
            console.error('Error fetching active rooms count:', err);
            // Fallback: tính từ data hiện có
            return roomsWithDetails.filter(room =>
                room.roomStatus === 'Started' || room.roomStatus === 'Idle'
            ).length;
        }
    };

    const formatTime = (totalMinutes: number): string => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const getActiveRoomsCount = (): number => {
        return roomsWithDetails.filter(room =>
            room.roomStatus === 'Started' || room.roomStatus === 'Idle'
        ).length;
    };

    const getTotalRoomsCount = (): number => {
        return roomsWithDetails.length;
    };

    const getCancelledRoomsCount = (): number => {
        return roomsWithDetails.filter(room =>
            room.roomStatus === 'Cancelled'
        ).length;
    };

    const getParticipantsDisplay = () => {
        if (detailsLoading) {
            return (
                <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span className="text-xs text-gray-500">Calculating...</span>
                </div>
            );
        }

        if (detailsError) {
            return (
                <div>
                    <div className="text-3xl font-bold text-purple-600">
                        {totalParticipants}
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">Estimated</div>
                </div>
            );
        }

        return (
            <div className="text-3xl font-bold text-purple-600">
                {totalParticipants}
            </div>
        );
    };

    const getUsageTimeDisplay = () => {
        if (detailsLoading) {
            return (
                <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                    <span className="text-xs text-gray-500">Calculating...</span>
                </div>
            );
        }

        // LUÔN sử dụng totalActualMinutes (tổng của actualDuration)
        const displayMinutes = totalActualMinutes;

        return (
            <div className="text-3xl font-bold text-orange-600">
                {formatTime(displayMinutes)}
            </div>
        );
    };

    // Tính tổng duration từ actualDuration của tất cả rooms
    const getTotalDurationFromActual = (): number => {
        return roomsWithDetails.reduce((total, room) => total + room.duration, 0);
    };

    // Hiển thị loading state
    if (loading) {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>
                <div className="space-y-6">
                    {/* Tab Navigation Skeleton */}
                    <div className="flex space-x-1 mb-6">
                        {['month', 'all'].map((tab) => (
                            <button
                                key={tab}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    activeTab === tab
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                disabled
                            >
                                {tab === 'month' ? 'Current Month' : 'All Time'}
                            </button>
                        ))}
                    </div>

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="bg-white border rounded-lg p-4 text-center">
                                <div className="animate-pulse">
                                    <div className="h-8 bg-gray-300 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Content Skeleton */}
                    <div className="bg-white border rounded-lg p-6">
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const totalActiveRooms = getTotalRoomsCount();
    const cancelledRoomsCount = getCancelledRoomsCount();

    // LUÔN sử dụng totalActualMinutes cho cả Usage Time và Total Duration
    const displayMinutes = totalActualMinutes;
    const totalDurationMinutes = totalActualMinutes;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm text-red-800">{error}</p>
                            <p className="text-xs text-red-600 mt-1">
                                Showing cached or default data. Some features may be limited.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Error Banner */}
            {detailsError && !error && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm text-yellow-800">{detailsError}</p>
                            <p className="text-xs text-yellow-600 mt-1">
                                Showing estimated data based on available room information.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
                {[
                    { key: 'month' as TimeRange, label: 'Current Month' },
                    { key: 'all' as TimeRange, label: 'All Time' }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === tab.key
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Rooms Created */}
                    <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
                        <div className="text-3xl font-bold text-blue-600">
                            {totalActiveRooms}
                        </div>
                        <div className="text-sm text-gray-600">Total Rooms</div>
                        <div className="text-xs text-gray-400 mt-1">
                            {activeTab === 'month' ? 'This month' : 'All time'}
                            {cancelledRoomsCount > 0 && (
                                <div className="text-red-500">
                                    {cancelledRoomsCount} cancelled
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total Participants */}
                    <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
                        {getParticipantsDisplay()}
                        <div className="text-sm text-gray-600">Total Participants</div>
                        <div className="text-xs text-gray-400 mt-1">
                            {detailsError ? 'Estimated' : 'Actual count'}
                        </div>
                    </div>

                    {/* Total Usage Time */}
                    <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
                        {getUsageTimeDisplay()}
                        <div className="text-sm text-gray-600">Total Usage Time</div>
                        <div className="text-xs text-gray-400 mt-1">
                            {activeTab === 'month' ? 'This month' : 'All time'}
                            {detailsError && <div className="text-yellow-500">Estimated</div>}
                        </div>
                    </div>
                </div>

                {/* Detailed Statistics */}
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Usage Statistics</h3>
                        {lastUpdated && (
                            <span className="text-xs text-gray-500">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    {roomsWithDetails.length > 0 ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {totalActiveRooms}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Rooms</div>
                                    {cancelledRoomsCount > 0 && (
                                        <div className="text-xs text-red-500">
                                            +{cancelledRoomsCount} cancelled
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatTime(getTotalDurationFromActual())}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Duration</div>
                                    {detailsError && (
                                        <div className="text-xs text-yellow-500">Estimated</div>
                                    )}
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {totalActiveRooms > 0 ? Math.round(totalDurationMinutes / totalActiveRooms) : 0}m
                                    </div>
                                    <div className="text-sm text-gray-600">Avg per Room</div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-medium">Recent Rooms</h4>
                                    <span className="text-xs text-gray-500">
                                        {totalParticipants} total participants
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {roomsWithDetails.slice(0, 10).map((room) => (
                                        <div
                                            key={room.roomUUID}
                                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {room.title}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(room.beginTime).toLocaleDateString()} • {room.roomStatus}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-orange-600">
                                                    {formatTime(room.duration)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {room.participants} participants
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-4">📊</div>
                            <p className="text-lg mb-2">No analytics data available</p>
                            <p className="text-sm">
                                {error
                                    ? 'Unable to load data from the server.'
                                    : 'Start creating rooms to see your usage statistics.'
                                }
                            </p>
                            {!error && (
                                <p className="text-xs mt-2 text-gray-400">
                                    Switch between "Current Month" and "All Time" tabs to view different time ranges.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        {error && 'Using fallback data - some statistics may be incomplete'}
                        {detailsError && !error && 'Using estimated room details and participants data'}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={fetchRoomDetailsAndParticipants}
                            disabled={detailsLoading || !data?.rooms?.length}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <span>{detailsLoading ? 'Refreshing Details...' : 'Refresh Details'}</span>
                            <svg
                                className={`w-4 h-4 ${detailsLoading ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={fetchAnalyticsData}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>{loading ? 'Refreshing...' : 'Refresh All Data'}</span>
                            <svg
                                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;

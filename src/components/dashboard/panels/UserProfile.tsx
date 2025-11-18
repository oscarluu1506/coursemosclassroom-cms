// src/components/dashboard/panels/UserProfile.tsx
'use client';

import { FlatUser } from '@/services/flatService';
import { useState } from 'react';

interface UserProfileProps {
    user: FlatUser;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);

            // Reset copied state after 2 seconds
            setTimeout(() => {
                setCopiedField(null);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const CopyIcon = ({ isCopied }: { isCopied: boolean }) => (
        <svg
            className={`w-4 h-4 ${isCopied ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            {isCopied ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            )}
        </svg>
    );

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">User Profile</h2>

            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-20 h-20 rounded-full"
                        />
                        <div>
                            <h3 className="text-xl font-semibold">{user.name}</h3>
                            <p className="text-gray-600">{user.email}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Account Information</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span>User UUID:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs">{user.userUUID}</span>
                                    <button
                                        onClick={() => handleCopy(user.userUUID, 'uuid')}
                                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                                        title="Copy User UUID"
                                    >
                                        <CopyIcon isCopied={copiedField === 'uuid'} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Client Key:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs">{user.clientKey}</span>
                                    <button
                                        onClick={() => handleCopy(user.clientKey, 'clientKey')}
                                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                                        title="Copy Client Key"
                                    >
                                        <CopyIcon isCopied={copiedField === 'clientKey'} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Success message when copied */}
                    {copiedField && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-green-700 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {copiedField === 'uuid' ? 'User UUID' : 'Client Key'} copied to clipboard!
                            </p>
                        </div>
                    )}
                </div>

                {/*<div className="space-y-4">*/}
                {/*    <div className="bg-blue-50 p-4 rounded-lg">*/}
                {/*        <h4 className="font-semibold mb-2">Account Status</h4>*/}
                {/*        <div className="space-y-2">*/}
                {/*            <div className="flex justify-between">*/}
                {/*                <span>Phone Verified:</span>*/}
                {/*                <span className={user.hasPhone ? "text-green-600" : "text-red-600"}>*/}
                {/*                    {user.hasPhone ? "Yes" : "No"}*/}
                {/*                </span>*/}
                {/*            </div>*/}
                {/*            <div className="flex justify-between">*/}
                {/*                <span>Password Set:</span>*/}
                {/*                <span className={user.hasPassword ? "text-green-600" : "text-red-600"}>*/}
                {/*                    {user.hasPassword ? "Yes" : "No"}*/}
                {/*                </span>*/}
                {/*            </div>*/}
                {/*            <div className="flex justify-between">*/}
                {/*                <span>Anonymous Account:</span>*/}
                {/*                <span className={user.isAnonymous ? "text-yellow-600" : "text-green-600"}>*/}
                {/*                    {user.isAnonymous ? "Yes" : "No"}*/}
                {/*                </span>*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
        </div>
    );
};

export default UserProfile;

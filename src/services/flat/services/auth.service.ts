import axios from 'axios';
import {
    FlatLoginRequest,
    FlatLoginResponse,
    FlatUser,
    SendVerificationCodeRequest,
    SendVerificationCodeResponse,
    RegisterRequest,
    RegisterResponse
} from '../types';

export class AuthService {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
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
}

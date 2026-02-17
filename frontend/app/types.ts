export interface User {
    id: number;
    username: string;
    email: string;
}
export interface ApiResponse {
    success: boolean;
    data?: User[];
    error?: string;
}
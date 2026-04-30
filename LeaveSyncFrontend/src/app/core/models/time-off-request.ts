export interface TimeOffRequest {
    _id: string;
    userId: string;
    userName?: string;
    type: 'vacation' | 'sick';
    startDate: string;
    endDate: string;
    totalDays: number;
    status: 'pending' | 'approved' | 'denied';
    updatedAt?: string;
}

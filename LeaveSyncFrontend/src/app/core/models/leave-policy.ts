export interface LeavePolicy {
    _id: string;
    type: 'vacation' | 'sick';
    totalDays: number;
    minYears: number;
    description?: string;
}

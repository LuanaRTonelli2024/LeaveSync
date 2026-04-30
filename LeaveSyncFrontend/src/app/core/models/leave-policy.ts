export interface LeavePolicy {
    _id: string;
    type: 'vacation' | 'sick';
    totalDays: number;
    minYears: number;
    maxYears?: number;
    description?: string;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    password?: string;
    role: 'employee' | 'admin';
    department?: string;
    createdAt?: string;
    hireDate: string;
}

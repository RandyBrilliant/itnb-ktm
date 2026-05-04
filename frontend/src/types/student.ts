/**
 * Student Data Types & Interfaces
 * Comprehensive type definitions for student dashboard views
 */

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  studentId: string;
  program: string;
  level: string;
  gpa: number;
  totalCredits: number;
  profileImage: string;
  department: string;
}

export interface DigitalID {
  id: string;
  studentId: string;
  fullName: string;
  program: string;
  department: string;
  photoUrl: string;
  validFrom: Date;
  validUntil: Date;
  libraryAccessLevel: number;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
}

export interface Certificate {
  id: string;
  title: string;
  category: 'official' | 'historical';
  issueDate: Date;
  expirationDate?: Date;
  status: 'valid' | 'expired';
  downloadUrl: string;
  icon: string;
  metadata: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: 'editorial' | 'campus-life' | 'academics' | 'events';
  image: string;
  publishedAt: Date;
  featured?: boolean;
}

export interface CalendarEvent {
  id: string;
  date: Date;
  month: string;
  day: number;
  title: string;
  description?: string;
  isActive?: boolean;
}

export interface PerkBenefit {
  id: string;
  title: string;
  provider: string;
  category: 'software' | 'food-drink' | 'transport' | 'tech';
  description: string;
  discount: string;
  image: string;
  imageAlt: string;
  claimUrl: string;
  tags: string[];
  isFeatured?: boolean;
  badge?: string;
  status: 'active' | 'expired' | 'used';
}

export interface DashboardStats {
  gpa: number;
  gpaChange: number;
  credits: number;
  creditProgress: number;
  upcomingEvents: number;
}

export interface PaginationData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

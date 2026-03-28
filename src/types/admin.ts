export interface LocalizedText {
  uz: string;
  uzLatin: string;
  ru: string;
}

// Dashboard
export interface AdminDashboardDto {
  totalUsers: number;
  activeUsersToday: number;
  totalQuestions: number;
  activeQuestions: number;
  totalExamSessions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  newUsersThisWeek: number;
  examModeBreakdown: ExamModeBreakdownDto[];
  recentUsers: RecentUserDto[];
}

export interface ExamModeBreakdownDto {
  mode: string;
  count: number;
}

export interface RecentUserDto {
  id: string;
  phoneNumber: string | null;
  firstName: string | null;
  createdAt: string;
}

// Pagination
export interface PaginatedList<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

// Users
export interface UserListItemDto {
  id: string;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin';
  authProvider: 'Phone' | 'Telegram';
  isBlocked: boolean;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface UserDetailDto {
  id: string;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin';
  authProvider: 'Phone' | 'Telegram';
  preferredLanguage: 'uz' | 'uzLatin' | 'ru';
  telegramId: number | null;
  isBlocked: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  totalExams: number;
  completedExams: number;
  averageScore: number;
  activeSubscription: {
    planId: string;
    planName: string;
    status: string;
    expiresAt: string;
  } | null;
}

// Payments
export interface PaymentTransactionDto {
  id: string;
  userId: string;
  userPhone: string | null;
  provider: 'Payme' | 'Click';
  providerTransactionId: string | null;
  amountInTiyins: number;
  currency: string;
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  completedAt: string | null;
  createdAt: string;
}

export interface RevenueReportDto {
  totalRevenue: number;
  totalTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  paymeRevenue: number;
  clickRevenue: number;
  dailyBreakdown: DailyRevenueDto[];
}

export interface DailyRevenueDto {
  date: string;
  revenue: number;
  transactionCount: number;
}

// Plans
export interface AdminPlanDto {
  id: string;
  nameUz: string;
  nameUzLatin: string;
  nameRu: string;
  descriptionUz: string;
  descriptionUzLatin: string;
  descriptionRu: string;
  priceInTiyins: number;
  durationDays: number;
  features: string;
  isActive: boolean;
  createdAt: string;
}

// Questions
export interface AdminQuestionDto {
  id: string;
  text: LocalizedText;
  explanation: LocalizedText;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  categoryId: string;
  categoryName: LocalizedText;
  difficulty: number;
  ticketNumber: number;
  licenseCategory: 'AB' | 'CD' | 'Both';
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  answerOptions: AdminAnswerOptionDto[];
}

export interface AdminAnswerOptionDto {
  id: string;
  text: LocalizedText;
  imageUrl: string | null;
  isCorrect: boolean;
}

// Categories
export interface CategoryDto {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  iconUrl: string | null;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  questionCount: number;
  children: CategoryDto[];
}

// Exam Templates
export interface ExamTemplateDto {
  id: string;
  titleUz: string;
  titleUzLatin: string;
  titleRu: string;
  totalQuestions: number;
  passingScore: number;
  timeLimitMinutes: number;
  isActive: boolean;
  poolRules: PoolRuleDto[];
}

export interface PoolRuleDto {
  categoryId: string;
  categoryName?: string;
  questionCount: number;
}

// Audit Log
export interface AuditLogDto {
  id: string;
  userId: string;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

// System Settings
export interface SystemSettingDto {
  key: string;
  value: string;
  description: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
}

// Announcements
export interface AnnouncementDto {
  id: string;
  title: LocalizedText;
  content: LocalizedText;
  type: 'Info' | 'Warning' | 'Important';
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

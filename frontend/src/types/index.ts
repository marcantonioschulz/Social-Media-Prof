// User and Authentication
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'approver';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Organization
export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Asset Types
export type AssetType = 'image' | 'video' | 'audio' | 'text';

export interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  [key: string]: any;
}

export interface LicenseInfo {
  type: string;
  source: string;
  author?: string;
  licenseUrl?: string;
  expiryDate?: string;
  restrictions?: string;
}

export interface Asset {
  id: string;
  organizationId: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  assetType: AssetType;
  url: string;
  thumbnailUrl?: string;
  metadata?: AssetMetadata;
  licenseInfo?: LicenseInfo;
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// Post Types
export type PostStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'published';
export type Platform = 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'tiktok';

export interface PostAsset {
  id: string;
  postId: string;
  assetId: string;
  order: number;
  asset?: Asset;
}

export interface Post {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  status: PostStatus;
  platforms: Platform[];
  scheduledAt?: string;
  publishedAt?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  assets?: PostAsset[];
  user?: User;
  approvalWorkflow?: ApprovalWorkflow;
}

export interface CreatePostData {
  title: string;
  content: string;
  platforms: Platform[];
  scheduledAt?: string;
  assetIds: string[];
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  platforms?: Platform[];
  scheduledAt?: string;
  status?: PostStatus;
}

// Approval Workflow
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalStep {
  id: string;
  workflowId: string;
  approverId: string;
  status: ApprovalStatus;
  comment?: string;
  order: number;
  approvedAt?: string;
  rejectedAt?: string;
  approver?: User;
}

export interface ApprovalWorkflow {
  id: string;
  postId: string;
  organizationId: string;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  steps?: ApprovalStep[];
  post?: Post;
}

export interface ApprovalAction {
  status: 'approved' | 'rejected';
  comment?: string;
}

// Audit Log
export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'post.create'
  | 'post.update'
  | 'post.delete'
  | 'post.publish'
  | 'asset.upload'
  | 'asset.delete'
  | 'approval.approve'
  | 'approval.reject';

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: User;
}

// Dashboard Statistics
export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  pendingApprovals: number;
  totalAssets: number;
  recentActivity: AuditLog[];
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Filter and Query Types
export interface PostFilters {
  status?: PostStatus;
  platform?: Platform;
  search?: string;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
}

export interface AssetFilters {
  assetType?: AssetType;
  search?: string;
  tags?: string[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

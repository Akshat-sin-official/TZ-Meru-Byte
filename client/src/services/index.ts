// API service layer
export { apiClient } from './apiClient';
export { adminService } from './adminService';
export type { AdminStats, PendingRelease, AdminAction, AdminActionsResponse } from './adminService';
export { expertService } from './expertService';
export type { ExpertStats, ExpertEngagement, ExpertDiscussion, ExpertProfile, SubmitMilestoneRequest, ExpertAvailability } from './expertService';
export { seekerService } from './seekerService';
export type { SeekerStats, SeekerEngagement, SeekerQuotation, SeekerDiscussion, ApproveMilestoneRequest, RejectMilestoneRequest, RevisionMilestoneRequest } from './seekerService';
export { searchService } from './searchService';
export type { ExpertSearchResult, ExpertSearchResponse, SearchFilters, ExpertSearchInput } from './searchService';
export { meetingService } from './meetingService';
export type { MeetingAccess } from './meetingService';
export { notificationService } from './notificationService';
export type { Notification, NotificationListResponse } from './notificationService';


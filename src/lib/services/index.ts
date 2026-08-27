export { ServiceError, isDemoMode, getSupabaseClient, requireSupabase, throwIfError } from './serviceHelpers';

export { fetchAccessibleProperties, fetchAccessiblePropertyIds, isSharedOnlyRole } from './accessiblePropertiesService';
export { fetchProperties, fetchProperty, createProperty, updateProperty } from './propertiesService';
export { createUnit, updateUnit } from './unitsService';
export type { UnitInsert, UnitUpdate } from './unitsService';
export type { PropertyInsert } from './propertiesService';
export { fetchLeads, fetchClients, createLead, createClient, updateClient, updateLead, updateLeadStatus } from './leadsService';
export { fetchLeases, fetchLeasesForProperties, fetchTenants, fetchTenantsForProperties, createTenant, createLease, updateTenant, updateLease, fetchLeaseById, fetchTenantById } from './leasesService';
export { fetchSigningLink, completeSigning, fetchSigningLinks } from './signingService';
export { fetchTasks, createTask, updateTask, updateTaskStatus } from './tasksService';
export {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  createNotification,
} from './notificationsService';
export type { CreateNotificationPayload } from './notificationsService';
export { fetchAuctions, fetchPayments, createAuction, createPayment, fetchPaymentById, updatePayment } from './auctionsService';
export type { AuctionInsert, PaymentInsert } from './auctionsService';
export { fetchSharedWithUser } from './sharedPropertiesService';
export type { SharedPropertySummary } from './sharedPropertiesService';
export { fetchFavorites, addFavorite, removeFavorite } from './favoritesService';
export { searchPublicProperties } from './buyerSearchService';
export { updateProfile, ensureProfile } from './profilesService';
export type { ProfileUpdatePayload, EnsureProfilePayload } from './profilesService';
export {
  fetchBrokerDashboardStats,
  fetchManagedPropertySidebar,
} from './brokerStatsService';
export type { BrokerDashboardStats, ManagedPropertySidebarItem } from './brokerStatsService';
export {
  fetchAdminDashboardStats,
  fetchRoleDistribution,
  fetchRecentUsers,
  fetchPendingReviews,
} from './adminStatsService';
export type { AdminDashboardStats, RoleDistributionItem } from './adminStatsService';

export {
  STORAGE_BUCKETS,
  getPropertyImagePublicUrl,
  getSignedContractUrl,
  uploadPropertyImage,
  deletePropertyImage,
  uploadSignedContract,
} from './storageService';

export { invokeEdgeFunction, notifyShare, generateAgreementPdf } from './edgeFunctions';

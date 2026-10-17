export { ServiceError, isDemoMode, getSupabaseClient, requireSupabase, throwIfError } from './serviceHelpers';

export {
  fetchAccessibleProperties,
  fetchAccessiblePropertyIds,
  isSharedOnlyRole,
} from './accessiblePropertiesService';
export { fetchProperties, fetchProperty, createProperty, updateProperty } from './propertiesService';
export { createUnit, updateUnit, releaseUnitOccupancy } from './unitsService';
export { saveUnitOnboarding } from './unitOnboardingService';
export type { UnitOnboardingSubmit, UnitOccupancyMode } from './unitOnboardingService';
export type { UnitInsert, UnitUpdate } from './unitsService';
export type { PropertyInsert } from './propertiesService';
export { fetchLeads, fetchClients, createLead, createClient, updateClient, updateLead, updateLeadStatus } from './leadsService';
export type { ClientPayload } from './leadsService';
export {
  findMatchesForClient,
  findMatchesForLead,
  findMatchingClientsForProperty,
  notifyReverseMatches,
  notifyLeadPropertyMatches,
} from './matchingService';
export type { LeadMatchResult } from './matchingService';
export {
  createLandingPage,
  fetchLandingPageForProperty,
  getPublicLandingPage,
  submitPublicLead,
} from './landingPagesService';
export type { PropertyLandingPage, PublicLandingPage } from './landingPagesService';
export {
  fetchLeases,
  fetchLeasesForProperties,
  fetchTenants,
  fetchTenantsForProperties,
  createTenant,
  createTenantWithLease,
  attachTenantToUnit,
  createLease,
  updateTenant,
  updateLease,
  reassignLeaseUnit,
  fetchLeaseById,
  fetchTenantById,
} from './leasesService';
export type { AttachTenantToUnitInput, CreateTenantWithLeaseInput } from './leasesService';
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
export {
  fetchPayments,
  fetchPaymentById,
  createPayment,
  createPaymentRequest,
  updatePayment,
  confirmTransferPayment,
  getPublicPaymentCheckout,
  submitPaymentTransferProof,
  initPaymentSession,
  completePublicPayment,
  simulateCardPayment,
  issueInvoice,
  fetchPaymentIntegrations,
  upsertPaymentIntegration,
  fetchOutboundWebhooks,
  upsertOutboundWebhook,
  deleteOutboundWebhook,
  getPaymentCheckoutUrl,
} from './paymentsService';
export type { PaymentInsert } from './paymentsService';
export { fetchAuctions, createAuction } from './auctionsService';
export type { AuctionInsert } from './auctionsService';
export { fetchSharedWithUser } from './sharedPropertiesService';
export type { SharedPropertySummary } from './sharedPropertiesService';
export { fetchFavorites, addFavorite, removeFavorite } from './favoritesService';
export { searchPublicProperties } from './buyerSearchService';
export { updateProfile, ensureProfile } from './profilesService';
export type { ProfileUpdatePayload } from './profilesService';
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
export { fetchAdminProfiles } from './adminUsersService';
export { fetchAdminPropertyShares } from './adminSharesService';
export { fetchImportBatches, runAdminPropertyImport } from './adminImportService';
export type { AdminImportResult, ImportBatchRow } from './adminImportService';
export {
  createSupportTicket,
  fetchMySupportTickets,
  fetchAdminSupportTickets,
  updateSupportTicketStatus,
} from './supportTicketsService';
export type { SupportTicket, SupportTicketStatus } from './supportTicketsService';
export type { AdminDashboardStats, RoleDistributionItem } from './adminStatsService';

export {
  STORAGE_BUCKETS,
  getPropertyImagePublicUrl,
  getSignedContractUrl,
  uploadPropertyImage,
  deletePropertyImage,
  uploadSignedContract,
} from './storageService';

export {
  uploadTenantDocument,
  deleteTenantDocument,
  fetchTenantDocumentFiles,
  getTenantDocumentDownloadUrl,
  documentsForTenant,
} from './tenantDocumentsService';

export { invokeEdgeFunction, notifyShare, generateAgreementPdf } from './edgeFunctions';

export enum EventAction {
  USER_UPDATED = "userUpdated",
  CLAIMS_SET = "claimsSet",
  DOCUMENT_CREATED = "documentCreated",
  DOCUMENT_SOFT_DELETED = "documentSoftDeleted",
  USER_DELETED = "userDeleted",
  TOKEN_REVOKED = "tokenRevoked",
}

// Event sources enum
export enum EventSource {
  AUTH_TRIGGER = "authTrigger",
  FIRESTORE_TRIGGER = "firestoreTrigger",
  CLEANUP_JOB = "cleanupJob",
}
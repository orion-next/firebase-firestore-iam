import { params } from "firebase-functions/v1";
import { FieldValue } from "firebase-admin/firestore";

export type AccountDocumentType = {
    displayName?: string;
    photoURL?: string;
    email?: string;
    emailVerified?: boolean;
    phoneNumber?: string;
    disabled?: boolean;
    claims?: Record<string, any>; // allowed claims only
    _deletedDate?: FirebaseFirestore.Timestamp;
}

export type EventLogType = {
    timestamp: FieldValue;
    actor: string;
    action: string;
    source: string;
    details?: Record<string, any>;
}

export enum Actors {
    SYSTEM = "AUTOMATED_ACTION"
}

export enum EventAction {
    USER_CREATED = "USER_CREATED",
    USER_UPDATED = "USER_UPDATED",
    DOCUMENT_CREATED = "DOCUMENT_CREATED",
    DOCUMENT_DELETED = "DOCUMENT_DELETED",
    USER_DELETED = "USER_DELETED",
}

// Event sources enum
export enum EventSource {
    AUTH_CHANGE_TRIGGER = "AUTH_CHANGE_TRIGGER",
    DOC_CHANGE_TRIGGER = "DOC_CHANGE_TRIGGER"
}

export enum Collections {
    Accounts = "Accounts",
    EventLogs = "Activity"
}

export const ENV = {
    CREATE_DOC_ON_USER_CREATED: params.defineBoolean("CREATE_DOC_ON_USER_CREATED", {
        description: "Create account document when user is created",
        default: true,
    }),
    DELETE_DOC_ON_USER_DELETED: params.defineBoolean("DELETE_DOC_ON_USER_DELETED", {
        description: "Soft delete account document when user is deleted",
        default: true,
    }),
    CREATE_USER_ON_DOC_CREATED: params.defineBoolean("CREATE_USER_ON_DOC_CREATED", {
        description: "Create user when account document is created",
        default: true,
    }),
    UPDATE_USER_ON_DOC_UPDATED: params.defineBoolean("UPDATE_USER_ON_DOC_UPDATED", {
        description: "Update user when account document is updated",
        default: true,
    }),
    DELETE_USER_ON_DOC_DELETED: params.defineBoolean("DELETE_USER_ON_DOC_DELETED", {
        description: "Delete user when account document is deleted",
        default: true,
    }),
    REVOKE_TOKEN_ON_USER_UPDATE: params.defineBoolean("REVOKE_TOKEN_ON_USER_UPDATED", {
        description: "Revoke refresh tokens when user properties are updated",
        default: true,
    }),
    ALLOWED_CLAIMS: params.defineString("ALLOWED_CLAIMS", {
        description: "Comma-separated list of allowed custom claims",
        default: "role, group",
    }),
    BLOCK_PUBLIC_SIGNUP: params.defineBoolean("BLOCK_PUBLIC_SIGNUP", {
        description: "Only allow user creation if a document exists in the Accounts collection with that user's UID",
        default: false,
    }),
};

// Define the enum with all error codes
export enum FIREBASE_ERROR {
  // Authentication
  USER_NOT_FOUND = "auth/user-not-found",
  INVALID_EMAIL = "auth/invalid-email",
  EMAIL_ALREADY_EXISTS = "auth/email-already-exists",
  UID_ALREADY_EXISTS = "auth/uid-already-exists",
  INVALID_UID = "auth/invalid-uid",
  INVALID_DISPLAY_NAME = "auth/invalid-display-name",
  INVALID_PHOTO_URL = "auth/invalid-photo-url",
  INVALID_PHONE_NUMBER = "auth/invalid-phone-number",
  PHONE_NUMBER_ALREADY_EXISTS = "auth/phone-number-already-exists",
  INVALID_DISABLED_FIELD = "auth/invalid-disabled-field",
  CLAIMS_TOO_LARGE = "auth/claims-too-large",
  ID_TOKEN_EXPIRED = "auth/id-token-expired",
  ID_TOKEN_REVOKED = "auth/id-token-revoked",
  INVALID_ID_TOKEN = "auth/invalid-id-token",
  ARGUMENT_ERROR = "auth/argument-error",
  INSUFFICIENT_PERMISSION = "auth/insufficient-permission",
  INTERNAL_AUTH_ERROR = "auth/internal-error",

  // Firestore
  ABORTED = "aborted",
  ALREADY_EXISTS = "already-exists",
  CANCELLED = "cancelled",
  DATA_LOSS = "data-loss",
  DEADLINE_EXCEEDED = "deadline-exceeded",
  FAILED_PRECONDITION = "failed-precondition",
  INTERNAL = "internal",
  INVALID_ARGUMENT = "invalid-argument",
  NOT_FOUND = "not-found",
  OUT_OF_RANGE = "out-of-range",
  PERMISSION_DENIED = "permission-denied",
  RESOURCE_EXHAUSTED = "resource-exhausted",
  UNAUTHENTICATED = "unauthenticated",
  UNAVAILABLE = "unavailable",
  UNIMPLEMENTED = "unimplemented"
}

export const FIREBASE_ERROR_MAP: Record<string, { Severity: "warn" | "error"; Message: string }> = {
  // Authentication
  [FIREBASE_ERROR.USER_NOT_FOUND]: { Severity: "warn", Message: "User not found." },
  [FIREBASE_ERROR.INVALID_EMAIL]: { Severity: "error", Message: "Invalid email format." },
  [FIREBASE_ERROR.EMAIL_ALREADY_EXISTS]: { Severity: "error", Message: "Email already exists." },
  [FIREBASE_ERROR.UID_ALREADY_EXISTS]: { Severity: "error", Message: "UID already exists." },
  [FIREBASE_ERROR.INVALID_UID]: { Severity: "error", Message: "Invalid UID." },
  [FIREBASE_ERROR.INVALID_DISPLAY_NAME]: { Severity: "error", Message: "Invalid display name." },
  [FIREBASE_ERROR.INVALID_PHOTO_URL]: { Severity: "error", Message: "Invalid photo URL." },
  [FIREBASE_ERROR.INVALID_PHONE_NUMBER]: { Severity: "error", Message: "Invalid phone number." },
  [FIREBASE_ERROR.PHONE_NUMBER_ALREADY_EXISTS]: { Severity: "error", Message: "Phone number already exists." },
  [FIREBASE_ERROR.INVALID_DISABLED_FIELD]: { Severity: "error", Message: "Invalid disabled field." },
  [FIREBASE_ERROR.CLAIMS_TOO_LARGE]: { Severity: "error", Message: "Custom claims payload too large." },
  [FIREBASE_ERROR.ID_TOKEN_EXPIRED]: { Severity: "error", Message: "ID token expired." },
  [FIREBASE_ERROR.ID_TOKEN_REVOKED]: { Severity: "error", Message: "ID token revoked." },
  [FIREBASE_ERROR.INVALID_ID_TOKEN]: { Severity: "error", Message: "Invalid ID token." },
  [FIREBASE_ERROR.ARGUMENT_ERROR]: { Severity: "error", Message: "Invalid argument provided." },
  [FIREBASE_ERROR.INSUFFICIENT_PERMISSION]: { Severity: "error", Message: "Insufficient permission." },
  [FIREBASE_ERROR.INTERNAL_AUTH_ERROR]: { Severity: "error", Message: "Internal Auth error." },

  // Firestore
  [FIREBASE_ERROR.ABORTED]: { Severity: "error", Message: "Operation aborted." },
  [FIREBASE_ERROR.ALREADY_EXISTS]: { Severity: "error", Message: "Resource already exists." },
  [FIREBASE_ERROR.CANCELLED]: { Severity: "error", Message: "Operation cancelled." },
  [FIREBASE_ERROR.DATA_LOSS]: { Severity: "error", Message: "Unrecoverable data loss or corruption." },
  [FIREBASE_ERROR.DEADLINE_EXCEEDED]: { Severity: "error", Message: "Deadline exceeded." },
  [FIREBASE_ERROR.FAILED_PRECONDITION]: { Severity: "error", Message: "Operation failed precondition." },
  [FIREBASE_ERROR.INTERNAL]: { Severity: "error", Message: "Internal Firestore error." },
  [FIREBASE_ERROR.INVALID_ARGUMENT]: { Severity: "error", Message: "Invalid argument." },
  [FIREBASE_ERROR.NOT_FOUND]: { Severity: "error", Message: "Document not found." },
  [FIREBASE_ERROR.OUT_OF_RANGE]: { Severity: "error", Message: "Value out of range." },
  [FIREBASE_ERROR.PERMISSION_DENIED]: { Severity: "error", Message: "Permission denied." },
  [FIREBASE_ERROR.RESOURCE_EXHAUSTED]: { Severity: "error", Message: "Resource exhausted (quota exceeded)." },
  [FIREBASE_ERROR.UNAUTHENTICATED]: { Severity: "error", Message: "Unauthenticated request." },
  [FIREBASE_ERROR.UNAVAILABLE]: { Severity: "error", Message: "Service unavailable." },
  [FIREBASE_ERROR.UNIMPLEMENTED]: { Severity: "error", Message: "Operation not implemented." }
};

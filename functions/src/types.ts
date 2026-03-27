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
    DELETE_DOC_ON_USER_DELETED: params.defineBoolean("DELETE_DOC_ON_USER_DELETED", {
        description: "Soft delete account document when user is deleted",
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
};

export const FIREBASE_ERROR_MAP: Record<string, { Severity: "warn" | "error"; Message: string; }> = {
    // Authentication
    "auth/user-not-found": { Severity: "warn", Message: "User not found." },
    "auth/invalid-email": { Severity: "error", Message: "Invalid email format." },
    "auth/email-already-exists": { Severity: "error", Message: "Email already exists." },
    "auth/uid-already-exists": { Severity: "error", Message: "UID already exists." },
    "auth/invalid-uid": { Severity: "error", Message: "Invalid UID." },
    "auth/invalid-display-name": { Severity: "error", Message: "Invalid display name." },
    "auth/invalid-photo-url": { Severity: "error", Message: "Invalid photo URL." },
    "auth/invalid-phone-number": { Severity: "error", Message: "Invalid phone number." },
    "auth/phone-number-already-exists": { Severity: "error", Message: "Phone number already exists." },
    "auth/invalid-disabled-field": { Severity: "error", Message: "Invalid disabled field." },
    "auth/claims-too-large": { Severity: "error", Message: "Custom claims payload too large." },
    "auth/id-token-expired": { Severity: "error", Message: "ID token expired." },
    "auth/id-token-revoked": { Severity: "error", Message: "ID token revoked." },
    "auth/invalid-id-token": { Severity: "error", Message: "Invalid ID token." },
    "auth/argument-error": { Severity: "error", Message: "Invalid argument provided." },
    "auth/insufficient-permission": { Severity: "error", Message: "Insufficient permission." },
    "auth/internal-error": { Severity: "error", Message: "Internal Auth error." },

    // Firestore
    "aborted": { Severity: "error", Message: "Operation aborted." },
    "already-exists": { Severity: "error", Message: "Resource already exists." },
    "cancelled": { Severity: "error", Message: "Operation cancelled." },
    "data-loss": { Severity: "error", Message: "Unrecoverable data loss or corruption." },
    "deadline-exceeded": { Severity: "error", Message: "Deadline exceeded." },
    "failed-precondition": { Severity: "error", Message: "Operation failed precondition." },
    "internal": { Severity: "error", Message: "Internal Firestore error." },
    "invalid-argument": { Severity: "error", Message: "Invalid argument." },
    "not-found": { Severity: "error", Message: "Document not found." },
    "out-of-range": { Severity: "error", Message: "Value out of range." },
    "permission-denied": { Severity: "error", Message: "Permission denied." },
    "resource-exhausted": { Severity: "error", Message: "Resource exhausted (quota exceeded)." },
    "unauthenticated": { Severity: "error", Message: "Unauthenticated request." },
    "unavailable": { Severity: "error", Message: "Service unavailable." },
    "unimplemented": { Severity: "error", Message: "Operation not implemented."
    }
};



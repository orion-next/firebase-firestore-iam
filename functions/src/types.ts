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

export enum ErrorCodes {
  AUTH_USER_NOT_FOUND = "auth/user-not-found",
  AUTH_INVALID_EMAIL = "auth/invalid-email",
}

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

import { EventAction, EventSource } from "./constants";

const SYSTEM_ACTOR = "system";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// Parameters for extension
const COLLECTION_NAME = functions.params.defineString("collectionName", {
  description: "Firestore collection to store user account documents",
  default: "Accounts",
});

const DELETE_DOC_ON_USER_DELETED = functions.params.defineBoolean("deleteDocumentOnUserDeleted", {
  description: "Soft delete account document when user is deleted",
  default: true,
});

const REVOKE_TOKEN_ON_USER_UPDATE = functions.params.defineBoolean("revokeTokenOnUserUpdate", {
  description: "Revoke refresh tokens when user properties are updated",
  default: true,
});

const EVENT_LOG_SUBCOLLECTION = functions.params.defineString("eventLogCollectionName", {
  description: "Sub-collection name for storing event logs under each account document",
  default: "Events",
});

const CLEANUP_SCHEDULE = functions.params.defineString("cleanupSchedule", {
  description: "Schedule for cleanup job",
  default: "0 0 1 * *",
});

const DOC_LIFETIME_MONTHS = functions.params.defineInt("docLifetimeMonths", {
  description: "Lifetime of soft-deleted user documents in months before hard deletion",
  default: 12,
});

// Properties recognized by Firebase Auth
const FIREBASE_USER_PROPERTIES = [
  "displayName",
  "photoURL",
  "email",
  "emailVerified",
  "phoneNumber",
  "disabled",
];

// Whitelisted claims to prevent privilege escalation
const ALLOWED_CLAIMS = ["role", "tenant", "betaTester"];

function splitUserData(data: Record<string, any>) {
  const userUpdates: Record<string, any> = {};
  const customClaims: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (FIREBASE_USER_PROPERTIES.includes(key)) {
      userUpdates[key] = value;
    }
  }

  if (data.claims && typeof data.claims === "object") {
    for (const [claimKey, claimValue] of Object.entries(data.claims)) {
      if (ALLOWED_CLAIMS.includes(claimKey)) {
        customClaims[claimKey] = claimValue;
      } else {
        functions.logger.warn(`Ignoring unsupported claim: ${claimKey}`);
      }
    }
  }

  return { userUpdates, customClaims };
}

async function writeEventLog(email: string, action: string, source: string, details: Record<string, any>) {
  const logRef = db
    .collection(COLLECTION_NAME.value())
    .doc(email)
    .collection(EVENT_LOG_SUBCOLLECTION.value())
    .doc();

  await logRef.set({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    actor: SYSTEM_ACTOR,
    action,
    source,
    details,
  });
}

// On user created
export const syncAccountOnUserCreated = functions.auth.user().onCreate(async (user) => {
  if (!user.email) return;
  const email = user.email;
  const accountRef = db.collection(COLLECTION_NAME.value()).doc(email);
  const accountDoc = await accountRef.get();

  if (accountDoc.exists) {
    const { userUpdates, customClaims } = splitUserData(accountDoc.data() || {});
    if (Object.keys(userUpdates).length > 0) {
      await auth.updateUser(user.uid, userUpdates);
      functions.logger.info(`Updated user properties for ${email}`);
  await writeEventLog(email, EventAction.USER_UPDATED, EventSource.AUTH_TRIGGER, { userUpdates });
    }
    if (Object.keys(customClaims).length > 0) {
      await auth.setCustomUserClaims(user.uid, customClaims);
      functions.logger.info(`Set custom claims for ${email}`);
await writeEventLog(email, EventAction.CLAIMS_SET, EventSource.AUTH_TRIGGER, { customClaims });
    }
  } else {
    await accountRef.set({});
    functions.logger.info(`Created empty account document for ${email}`);
await writeEventLog(email, EventAction.DOCUMENT_CREATED, EventSource.AUTH_TRIGGER, {});
  }
});

// On user deleted (soft delete)
export const deleteAccountOnUserDeleted = functions.auth.user().onDelete(async (user) => {
  if (!user.email) return;
  if (!DELETE_DOC_ON_USER_DELETED.value()) {
    functions.logger.info(`Skipping soft delete for ${user.email}`);
    return;
  }
  const accountRef = db.collection(COLLECTION_NAME.value()).doc(user.email);
  const accountDoc = await accountRef.get();
  if (accountDoc.exists) {
    await accountRef.update({ _deletedDate: admin.firestore.FieldValue.serverTimestamp() });
    functions.logger.info(`Soft deleted account document for ${user.email}`);
    await writeEventLog(user.email, EventAction.DOCUMENT_SOFT_DELETED, EventSource.AUTH_TRIGGER, {});
  }
});

// On Accounts written
export const syncUserOnAccountWritten = functions.firestore
  .document(`${COLLECTION_NAME.value()}/{email}`)
  .onWrite(async (change, context) => {
    const email = context.params.email;
    if (!change.after.exists) return;
    const data = change.after.data() || {};
    try {
      const userRecord = await auth.getUserByEmail(email);
      const { userUpdates, customClaims } = splitUserData(data);
      if (Object.keys(userUpdates).length > 0) {
        await auth.updateUser(userRecord.uid, userUpdates);
        functions.logger.info(`Updated user properties for ${email}`);
    await writeEventLog(email, EventAction.USER_UPDATED, EventSource.FIRESTORE_TRIGGER, { userUpdates });
      }
      if (Object.keys(customClaims).length > 0) {
        await auth.setCustomUserClaims(userRecord.uid, customClaims);
        functions.logger.info(`Set custom claims for ${email}`);
await writeEventLog(email, EventAction.CLAIMS_SET, EventSource.FIRESTORE_TRIGGER, { customClaims });
      }
      if (REVOKE_TOKEN_ON_USER_UPDATE.value()) {
        await auth.revokeRefreshTokens(userRecord.uid);
        functions.logger.info(`Revoked tokens for ${email}`);
await writeEventLog(email, EventAction.TOKEN_REVOKED, EventSource.FIRESTORE_TRIGGER, {});
      }
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        functions.logger.warn(`User with email ${email} not found. Skipping update.`);
      } else {
        functions.logger.error("Error updating user:", error);
      }
    }
  });

// On Accounts deleted (soft delete user doc, hard delete Auth user)
export const deleteUserOnAccountDeleted = functions.firestore
  .document(`${COLLECTION_NAME.value()}/{email}`)
  .onDelete(async (snap, context) => {
    const email = context.params.email;
    try {
      const userRecord = await auth.getUserByEmail(email);
      await auth.revokeRefreshTokens(userRecord.uid);
      await auth.deleteUser(userRecord.uid);
      functions.logger.info(`Deleted Firebase user for ${email}`);
      const accountRef = db.collection(COLLECTION_NAME.value()).doc(email);
      await accountRef.set({ _deletedDate: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      await writeEventLog(email, EventAction.USER_DELETED, EventSource.FIRESTORE_TRIGGER, {});
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        functions.logger.warn(`User with email ${email} not found. Skipping delete.`);
      } else {
        functions.logger.error("Error deleting user:", error);
      }
    }
  });

// Scheduled hard purge of expired docs
export const cleanupExpiredUserDocs = functions.pubsub
  .schedule(CLEANUP_SCHEDULE.value())
  .onRun(async () => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - DOC_LIFETIME_MONTHS.value());
    functions.logger.info(`Running cleanup job. Hard deleting docs with _deletedDate older than ${DOC_LIFETIME_MONTHS.value()} months (before ${cutoffDate.toISOString()})`);
    const accountsRef = db.collection(COLLECTION_NAME.value());
    const snapshot = await accountsRef.where("_deletedDate", "<=", cutoffDate).get();
    if (snapshot.empty) {
      functions.logger.info("No expired documents found for cleanup.");
      return null;
    }
    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      functions.logger.info(`Hard deleted doc ${doc.id}`);
    });
    await batch.commit();
    functions.logger.info(`Cleanup job completed. Deleted ${snapshot.size} documents.`);
    return null;
  });
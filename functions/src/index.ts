import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

import { AccountDocumentType, Collections, ENV, EventAction, EventSource } from "./types";
import { HandleError, LogEvent } from "./utilities";
import { AccountService, AuthenticationService } from "./services";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

export const SyncAccountOnUserCreated = functions.auth.user().onCreate(async (user) => {
    if (!user.uid) return;
    const user_uid = user.uid;

    try {
        const account_reference = db.collection(Collections.Accounts).doc(user_uid);
        const account_document = await account_reference.get();

        if (account_document.exists) {
            const account_data = account_document.data() as AccountDocumentType;
            await AuthenticationService.SyncUserFromDocument(auth, user_uid, account_data);
            await LogEvent(db, user_uid, {
                action: EventAction.USER_CREATED,
                source: EventSource.AUTH_CHANGE_TRIGGER
            });
        } else if (ENV.CREATE_DOC_ON_USER_CREATED.value()) {
            await db.runTransaction(async (tx) => {
                tx.set(account_reference, {});
                functions.logger.info(`Created empty account document for ${user_uid}.`);
                await LogEvent(db, user_uid, {
                    action: EventAction.DOCUMENT_CREATED,
                    source: EventSource.AUTH_CHANGE_TRIGGER
                }, tx);
            });
        }
    } catch (err) {
        HandleError(err, SyncAccountOnUserCreated.name);
    }
});

export const DeleteAccountOnUserDeleted = functions.auth.user().onDelete(async (user) => {
    if (!ENV.DELETE_DOC_ON_USER_DELETED.value()) return;

    if (!user.uid) return;
    var user_uid = user.uid;
    try {
        await db.runTransaction(async (tx) => {
            await AccountService.SoftDeleteDocument(tx, db, user_uid);
            await LogEvent(db, user_uid, {
                action: EventAction.USER_DELETED,
                source: EventSource.AUTH_CHANGE_TRIGGER
            }, tx);
        });
    } catch (err) {
        HandleError(err, DeleteAccountOnUserDeleted.name);
    }
});

export const SyncUserOnAccountCreated = functions.firestore.document(`${Collections.Accounts}/{uid}`).onCreate(async (change, context) => {
    const user_uid = context.params.uid;
    const account_data = change.data() as AccountDocumentType;

    try {
        await AuthenticationService.SyncUserFromDocument(auth, user_uid, account_data);
        await LogEvent(db, user_uid, {
            action: EventAction.USER_UPDATED,
            source: EventSource.DOC_CHANGE_TRIGGER
        });
    } catch (err) {
        HandleError(err, SyncUserOnAccountCreated.name);
    }
});

export const SyncUserOnAccountUpdated = functions.firestore.document(`${Collections.Accounts}/{uid}`).onUpdate(async (change, context) => {
    const user_uid = context.params.uid;
    const account_data = change.after.data() as AccountDocumentType;

    try {
        await AuthenticationService.SyncUserFromDocument(auth, user_uid, account_data);
        await LogEvent(db, user_uid, {
            action: EventAction.USER_UPDATED,
            source: EventSource.DOC_CHANGE_TRIGGER
        });
    } catch (err) {
        HandleError(err, SyncUserOnAccountUpdated.name);
    }
});

export const DeleteUserOnAccountDeleted = functions.firestore.document(`${Collections.Accounts}/{uid}`).onDelete(async (_snap, context) => {
    if (!ENV.DELETE_USER_ON_DOC_DELETED.value()) return;
    
    const user_uid = context.params.uid;

    try {
        await AuthenticationService.DeleteUserAndRevokeToken(auth, user_uid);

        await db.runTransaction(async (tx) => {
            await AccountService.SoftDeleteDocument(tx, db, user_uid);
            await LogEvent(db, user_uid, {
                action: EventAction.USER_DELETED,
                source: EventSource.DOC_CHANGE_TRIGGER
            }, tx);
        });
    } catch (err) {
        HandleError(err, DeleteUserOnAccountDeleted.name);
    }
});
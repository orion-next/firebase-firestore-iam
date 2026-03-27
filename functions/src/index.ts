import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

import { AccountDocumentType, Collections, EventAction, EventSource } from "./types";
import { HandleError, LogEvent } from "./utilities";
import { AccountService, AuthenticationService } from "./services";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

export const SyncAccountOnUserCreated = functions.auth.user().onCreate(async (user) => {
    if (!user.email) return;
    const user_email = user.email;

    try {
        const account_reference = db.collection(Collections.Accounts).doc(user_email);
        const account_document = await account_reference.get();

        if (account_document.exists) {
            const account_data = account_document.data() as AccountDocumentType;
            await AuthenticationService.SyncUserFromDocument(auth, user_email, account_data);
            await LogEvent(db, user_email, {
                action: EventAction.USER_CREATED,
                source: EventSource.AUTH_CHANGE_TRIGGER
            });
        } else {
            await db.runTransaction(async (tx) => {
                tx.set(account_reference, {});
                functions.logger.info(`Created empty account document for ${user_email}.`);
                await LogEvent(db, user_email, {
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
    if (!user.email) return;
    var user_email = user.email;
    try {
        await db.runTransaction(async (tx) => {
            await AccountService.SoftDeleteDocument(tx, db, user_email);
            await LogEvent(db, user_email, {
                action: EventAction.USER_DELETED,
                source: EventSource.AUTH_CHANGE_TRIGGER
            }, tx);
        });
    } catch (err) {
        HandleError(err, DeleteAccountOnUserDeleted.name);
    }
});

export const SyncUserOnAccountCreated = functions.firestore.document(`${Collections.Accounts}/{email}`).onCreate(async (change, context) => {
    const user_email = context.params.email;
    const account_data = change.data() as AccountDocumentType;

    try {
        await AuthenticationService.SyncUserFromDocument(auth, user_email, account_data);
        await LogEvent(db, user_email, {
            action: EventAction.USER_UPDATED,
            source: EventSource.DOC_CHANGE_TRIGGER
        });
    } catch (err) {
        HandleError(err, SyncUserOnAccountCreated.name);
    }
});

export const SyncUserOnAccountUpdated = functions.firestore.document(`${Collections.Accounts}/{email}`).onUpdate(async (change, context) => {
    const user_email = context.params.email;
    const account_data = change.after.data() as AccountDocumentType;

    try {
        await AuthenticationService.SyncUserFromDocument(auth, user_email, account_data);
        await LogEvent(db, user_email, {
            action: EventAction.USER_UPDATED,
            source: EventSource.DOC_CHANGE_TRIGGER
        });
    } catch (err) {
        HandleError(err, SyncUserOnAccountUpdated.name);
    }
});

export const DeleteUserOnAccountDeleted = functions.firestore.document(`${Collections.Accounts}/{email}`).onDelete(async (_snap, context) => {
    const user_email = context.params.email;

    try {
        await AuthenticationService.DeleteUserAndRevokeToken(auth, user_email);

        await db.runTransaction(async (tx) => {
            await AccountService.SoftDeleteDocument(tx, db, user_email);
            await LogEvent(db, user_email, {
                action: EventAction.USER_DELETED,
                source: EventSource.DOC_CHANGE_TRIGGER
            }, tx);
        });
    } catch (err) {
        HandleError(err, DeleteUserOnAccountDeleted.name);
    }
});
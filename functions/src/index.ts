import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

import { AccountDocumentType, Collections, EventAction, EventSource } from "./types";
import { LogEvent } from "./utilities";
import { AccountService, AuthenticationService } from "./services";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

export const SyncAccountOnUserCreated = functions.auth.user().onCreate(async (user) => {
    if (!user.email) return;

    const email = user.email;
    const account_reference = db.collection(Collections.Accounts).doc(email);
    const account_document = await account_reference.get();

    if (account_document.exists) {
        const account_data = account_document.data() as AccountDocumentType;
        await AccountService.SyncWithAuthenticationUser(auth, email, account_data);
        await LogEvent(db, email, EventAction.USER_CREATED, EventSource.AUTH_CHANGE_TRIGGER);
    } else {
        await account_reference.set({});
        functions.logger.info(`Created empty account document for ${email}.`);
        await LogEvent(db, email, EventAction.DOCUMENT_CREATED, EventSource.AUTH_CHANGE_TRIGGER);
    }
});

export const DeleteAccountOnUserDeleted = functions.auth.user().onDelete(async (user) => {
    if (!user.email) return;
    await AccountService.SoftDeleteDocument(db, user.email);
    await LogEvent(db, user.email, EventAction.USER_DELETED, EventSource.AUTH_CHANGE_TRIGGER);
});

export const SyncUserOnAccountCreated = functions.firestore.document("Accounts/{email}").onCreate(async (change, context) => {
    const email = context.params.email;
    const account_data = change.data() as AccountDocumentType;
    await AccountService.SyncWithAuthenticationUser(auth, email, account_data);
    await LogEvent(db, email, EventAction.USER_UPDATED, EventSource.DOC_CHANGE_TRIGGER);
});

export const SyncUserOnAccountUpdated = functions.firestore.document("Accounts/{email}").onUpdate(async (change, context) => {
    const email = context.params.email;
    const account_data = change.after.data() as AccountDocumentType;
    await AccountService.SyncWithAuthenticationUser(auth, email, account_data);
    await LogEvent(db, email, EventAction.USER_UPDATED, EventSource.DOC_CHANGE_TRIGGER);
});

export const DeleteUserOnAccountDeleted = functions.firestore.document(`${Collections.Accounts}/{email}`).onDelete(async (_snap, context) => {
    const email = context.params.email;
    await AuthenticationService.DeleteUserAndRevokeToken(auth, email);
    await AccountService.SoftDeleteDocument(db, email);
    await LogEvent(db, email, EventAction.USER_DELETED, EventSource.DOC_CHANGE_TRIGGER);
});
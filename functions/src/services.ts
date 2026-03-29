import * as functions from "firebase-functions/v1";
import { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { Auth } from "firebase-admin/auth";

import { AccountDocumentType, Collections, ENV, FIREBASE_ERROR } from "./types";
import { UserRecord } from "firebase-functions/v1/auth";

export const AccountService = {
    SoftDeleteDocument: async (tx: Transaction, db: Firestore, uid: string) => {
        const doc = db.collection(Collections.Accounts).doc(uid);
        const doc_data = await doc.get();
        if (!doc_data.exists) return;
        tx.set(doc, { ...doc_data.data(), _deletedDate: FieldValue.serverTimestamp() });
        functions.logger.info(`Soft deleted account document for ${uid}`);
    }
}

export const AuthenticationService = {
    SyncUserFromDocument: async (auth: Auth, uid: string, data: AccountDocumentType) => {
        const { claims, ...data_props } = data;
        let user_record : UserRecord;
        try {
            user_record = await auth.getUser(uid);            
            if (ENV.UPDATE_USER_ON_DOC_UPDATED.value() && Object.keys(data_props).length > 0) {
                await auth.updateUser(user_record.uid, data_props);
                functions.logger.info(`Updated user properties for ${uid}`);
            }
        } catch (error: any) {
            if (error.code === FIREBASE_ERROR.USER_NOT_FOUND && ENV.CREATE_USER_ON_DOC_CREATED.value()) {
                user_record = await auth.createUser({ uid, ...data_props });
                functions.logger.info(`Created new user with UID ${uid}`);
            } else {
                throw error;
            }
        }
        
        if (ENV.UPDATE_USER_ON_DOC_UPDATED.value() && claims && Object.keys(claims).length > 0) {
            var allowed_claims = ENV.ALLOWED_CLAIMS.value().split(",").map(s => s.trim()).filter(s => s.length) ?? [];
            const filteredClaims = Object.fromEntries(
                Object.entries(claims).filter(([key]) => allowed_claims.includes(key))
            );

            await auth.setCustomUserClaims(user_record.uid, filteredClaims);
            functions.logger.info(`Set custom claims on ${Object.keys(filteredClaims)} for ${uid}`);
        }

        if (ENV.REVOKE_TOKEN_ON_USER_UPDATE.value())
            await auth.revokeRefreshTokens(user_record.uid);
    },
    DeleteUserAndRevokeToken: async (auth: Auth, uid: string) => {
        const userRecord = await auth.getUser(uid);
        await auth.revokeRefreshTokens(userRecord.uid);
        await auth.deleteUser(userRecord.uid);
        functions.logger.info(`Deleted Firebase user for ${uid} and revoked tokens.`);
    }
}
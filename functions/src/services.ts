import * as functions from "firebase-functions/v1";
import { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { Auth } from "firebase-admin/auth";

import { AccountDocumentType, Collections, ENV } from "./types";

export const AccountService = {
    SoftDeleteDocument: async (tx: Transaction, db: Firestore, email: string) => {
        const doc = db.collection(Collections.Accounts).doc(email);
        if (!(await doc.get()).exists) return;
        tx.set(doc, { _deletedDate: FieldValue.serverTimestamp() }, { merge: true });
        functions.logger.info(`Soft deleted account document for ${email}`);
    }
}

export const AuthenticationService = {
    SyncUserFromDocument: async (auth: Auth, email: string, data: AccountDocumentType) => {
        const user_record = await auth.getUserByEmail(email);

        // Destructure claims out of the unified doc
        const { claims, ...data_props } = data;

        if (Object.keys(data_props).length > 0) {
            await auth.updateUser(user_record.uid, data_props);
            functions.logger.info(`Updated user properties for ${email}`);
        }
        
        if (claims && Object.keys(claims).length > 0) {
            var allowed_claims = ENV.ALLOWED_CLAIMS.value().split(",").map(s => s.trim()).filter(s => s.length) ?? [];
            const filteredClaims = Object.fromEntries(
                Object.entries(claims).filter(([key]) => allowed_claims.includes(key))
            );

            await auth.setCustomUserClaims(user_record.uid, filteredClaims);
            functions.logger.info(`Set custom claims on ${Object.keys(filteredClaims)} for ${email}`);
        }

        if (ENV.REVOKE_TOKEN_ON_USER_UPDATE.value())
            await auth.revokeRefreshTokens(user_record.uid);
    },
    DeleteUserAndRevokeToken: async (auth: Auth, email: string) => {
        const userRecord = await auth.getUserByEmail(email);
        await auth.revokeRefreshTokens(userRecord.uid);
        await auth.deleteUser(userRecord.uid);
        functions.logger.info(`Deleted Firebase user for ${email} and revoked tokens.`);
    }
}
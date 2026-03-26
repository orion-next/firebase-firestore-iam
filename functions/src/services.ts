import { logger as Logger } from "firebase-functions/v1";
import { FieldValue, Firestore } from "firebase-admin/firestore";
import { Auth } from "firebase-admin/auth";

import { AccountDocumentType, Collections, ENV } from "./types";

export const AccountService = {
    SyncWithAuthenticationUser: async (auth: Auth, email: string, data: AccountDocumentType) => {
        const user_record = await auth.getUserByEmail(email);

        // Destructure claims out of the unified doc
        const { claims, ...data_props } = data;

        if (Object.keys(data_props).length > 0) {
            await auth.updateUser(user_record.uid, data_props);
            Logger.info(`Updated user properties for ${email}`);
        }
        if (claims && Object.keys(claims).length > 0) {
            var allowed_claims = ENV.ALLOWED_CLAIMS.value().split(",").map(s => s.trim()).filter(s => s.length) ?? [];
            const filteredClaims = Object.fromEntries(
                Object.entries(claims).filter(([key]) => allowed_claims.includes(key))
            );

            await auth.setCustomUserClaims(user_record.uid, filteredClaims);
            Logger.info(`Set custom claims for ${email}`);
        }

        if (ENV.REVOKE_TOKEN_ON_USER_UPDATE.value())
            await auth.revokeRefreshTokens(user_record.uid);
    },
    SoftDeleteDocument: async (db: Firestore, email: string) => {
        const doc = db.collection(Collections.Accounts).doc(email);
        if (!(await doc.get()).exists) return;
        
        await doc.set({ _deletedDate: FieldValue.serverTimestamp() }, { merge: true });
        Logger.info(`Soft deleted account document for ${email}`);
    }
}

export const AuthenticationService = {
    DeleteUserAndRevokeToken: async (auth: Auth, email: string) => {
        const userRecord = await auth.getUserByEmail(email);
        await auth.revokeRefreshTokens(userRecord.uid);
        await auth.deleteUser(userRecord.uid);
        Logger.info(`Deleted Firebase user for ${email} and revoked tokens.`);
    }
}

export const ExceptionService = {
    
}
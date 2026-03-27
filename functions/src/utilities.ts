import * as functions from "firebase-functions";
import { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { Collections, ErrorCodes, EventLogType, Actors } from "./types";
import { FirebaseError } from "firebase-admin";

export const LogEvent = async (db: Firestore, email: string, event: Omit<EventLogType, "timestamp" | "actor">, tx?: Transaction) => {
    const logRef = db
        .collection(Collections.Accounts).doc(email)
        .collection(Collections.EventLogs).doc();

    var eventLog: EventLogType = {
        timestamp: FieldValue.serverTimestamp(),
        actor: Actors.SYSTEM,    
        ...event
    };

    tx ? tx.set(logRef, eventLog) : await logRef.set(eventLog);
}

export const HandleError = (error: unknown, source: string) => {
    if (GuardForFirebaseError(error)) {
        switch (error.code) {
            case ErrorCodes.AUTH_USER_NOT_FOUND:
                functions.logger.warn(
                    `[${source}] User not found.`
                );
                break;

            case ErrorCodes.AUTH_INVALID_EMAIL:
                functions.logger.error(
                    `[${source}] Invalid email.`
                );
                break;

            default:
                functions.logger.error(
                    `[${source}] Unexpected error ${error.message}.`,
                    error
                );
                break;
        }
    }

    functions.logger.error(`[${source}] Unexpected error.`, error);
}

const GuardForFirebaseError = (err: unknown) : err is FirebaseError => typeof err === "object" && err !== null && "code" in err;

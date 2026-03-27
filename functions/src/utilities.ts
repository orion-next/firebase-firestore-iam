import * as functions from "firebase-functions";
import { FieldValue, Firestore, Transaction } from "firebase-admin/firestore";
import { Collections, EventLogType, Actors, FIREBASE_ERROR_MAP } from "./types";
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
    const mapped_error = FIREBASE_ERROR_MAP[error.code];
    if (mapped_error) {
      const logFn = mapped_error.Severity === "warn" ? functions.logger.warn : functions.logger.error;
      logFn(`[${source}] ${mapped_error.Message}`);
      return;
    }
  }

  functions.logger.error(`[${source}] Unexpected error.`, error);
};

const GuardForFirebaseError = (err: unknown) : err is FirebaseError => typeof err === "object" && err !== null && "code" in err;

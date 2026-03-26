import { FieldValue, Firestore } from "firebase-admin/firestore";
import { Collections, EventLogType } from "./types";

const SYSTEM_ACTOR = "system";

export const LogEvent = async (db: Firestore, email: string, action: string, source: string, details?: Record<string, any>) => {
  const logRef = db
    .collection(Collections.Accounts)
    .doc(email)
    .collection(Collections.EventLogs)
    .doc();

  var log : EventLogType = {
    timestamp: FieldValue.serverTimestamp(),
    actor: SYSTEM_ACTOR,
    action,
    source
  };

  if (details) log.details = details;
  await logRef.set(log);
}
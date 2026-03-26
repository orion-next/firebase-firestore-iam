## After installation

The extension is now active.

### Accounts Collection
A Firestore collection (default: `Accounts`) stores account documents keyed by email.


### Event Logs
All actions are recorded in a subcollection (default: `Events`) under each account document.
- This allows you to present historical logs to your user (or administrator) easily.
- Each log entry includes:   
  | Property | Details |
  | - | - |
  | `timestamp` | Time of event |
  | `actor` | Who initiated the event (`system` or `user` ) |
  | `action` | What event occurred |
  | `source` | From what technical source the event occurred |
  | `details` | Before and after values or changes |

### Soft Deletion
When a Firebase user is deleted, the corresponding Firestore account document is marked with `_deletedDate`.
- This allows you to retain records for audit and compliance while inactive.
- This allows you to restore documents and users back to active.

### Scheduled Cleanup
A Pub/Sub job runs on the configured schedule (default: every 24 hours).   
It hard deletes account documents whose `_deletedDate` is older than the configured lifetime (default: 12 months).

### Token Revocation
When the `revokeTokenOnUserUpdate` parameter is enabled, refresh tokens are revoked whenever user properties or claims are updated.

### Monitoring
Check Cloud Logging for detailed logs of all sync operations.
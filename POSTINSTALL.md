## After installation

The extension is now active.

### IAM Permissions
Ensure that the service account bound to the extension has the right to manage documents and authentication.   
Example: `Firebase Admin` role.
- The associated service account can be found in Google Cloud Console > IAM > Service Accounts
- It can be one of the following accounts (in cascading order):
  - `ext-firebase-firestore-iam@<project-id>.iam.gserviceaccount.com`
  - `<project-number>-compute@developer.gserviceaccount.com`
  - `<project-id>@appsport.gserviceaccount.com` 

### Accounts Collection
A Firestore collection `Accounts` stores user account documents keyed by email.

### Event Logs
All actions are recorded in a subcollection `Activity` under each user account document.
- This allows you to present historical logs to your user (or administrator) easily.
- Each log entry includes:   
  | Property | Details |
  | - | - |
  | `timestamp` | Time of event |
  | `actor` | Who initiated the event (`system` or `user` ) |
  | `action` | What event occurred |
  | `source` | From what technical source the event occurred |

### Soft Deletion
When a Firebase user is deleted, the corresponding Firestore account document is marked with `_deletedDate`.
- This allows you to retain records for audit and compliance while inactive.
- This allows you to restore documents and users back to active.

### Token Revocation
When the `REVOKE_TOKEN_ON_USER_UPDATED` parameter is enabled, refresh tokens are revoked whenever user properties or claims are updated.

### Monitoring
Check Cloud Logging for detailed logs of all sync operations.
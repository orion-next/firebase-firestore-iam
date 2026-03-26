## Before you install

This extension synchronizes Firebase Authentication with Firestore account documents. It ensures that user properties and claims remain consistent across both systems, while providing audit trails and lifecycle management.

| Authentication Event | Details |
| - | - |
| User Creation | Ensures a corresponding Firestore document exists |
| User Deletion | (Optional) Soft deletes the Firestore document by setting `_deletedDate` |

| Firestore Event | Details |
| - | - |
| Document Creation/Update | Updates Firebase user properties and custom claims |
| Document Deletion | Deletes the Firebase user and soft deletes the Firestore document |

Built on top of the event-based synchronization logic:
- Claims defined via `claims` field in account documents are synchronized to custom claims.
- Automated actions are logged via document entries and cloud logging.
  - Record event logs to sub-collection per account document.
  - Record function logs.

### Requirements

- A Firebase project with **Authentication** and **Firestore** enabled.
- Node.js 22 runtime support for Cloud Functions.
- IAM permissions to deploy Cloud Functions.

### Billing

To install this extension, your project must be on the [Blaze (pay as you go)](https://firebase.google.com/pricing) plan.
- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which may have associated charges if you exceed the service’s no‑cost tier:
  - Cloud Functions for synchronization triggers.
  - Firestore for account documents and audit logs.

Make sure you understand the billing implications before installing.
## Firestore ↔ Authentication IAM Synchronization Extension

![Build Functions](https://github.com/orion-next/firebase-firestore-iam/actions/workflows/build-on-master.yml/badge.svg?branch=master)

**Author**: Vidush H. Namah   
**Source**: https://github.com/orion-next/firebase-firestore-iam

Keep Firebase Authentication users and Firestore account documents synchronized.

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
- Expired documents are purged based on configurable clean up schedule and document lifetime.
- Automated actions are logged via document entries and cloud logging.
  - Record event logs to sub-collection per account document.
  - Push logs to Google Cloud Logging (accessible via Google Cloud Console).

### Additional Parameters

The following parameters may be configured.
| Parameter | Details |
| - | - |
| Cloud Functions Location | Deployment location for the functions created |
| Accounts Collection Name | Firestore collection used to store account documents |
| Event Log Collection Name | Subcollection name under each account document to store event logs |
| Soft Delete Behaviour | Whether to soft delete the account document when a user is deleted |
| Token Management Behavior | Whether to revoke refresh tokens when a user is updated |
| Cleanup Schedule | Schedule for cleanup job (e.g. every 24h) |
| Document Lifetime (Months) | Lifetime of soft‑deleted user documents in months before purge |

### Google API Usage

| API | Reason |
| - | - |
| firebaseauth.googleapis.com | Manage Firebase Authentication users |
| firestore.googleapis.com | Read/write account documents and event logs |
| pubsub.googleapis.com | Schedule cleanup jobs |

### Billing

To install this extension, your project must be on the [Blaze (pay as you go)](https://firebase.google.com/pricing) plan.
- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which may have associated charges if you exceed the service’s no‑cost tier:
  - Cloud Functions for synchronization triggers.
  - Firestore for account documents and audit logs.
  - Pub/Sub for scheduled cleanup jobs.
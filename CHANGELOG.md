## CHANGELOG

All notable changes to this project will be documented in this file.
| Change type | Description |
| - | - |
| `Added` | Addition of new features |
| `Changed` | Changes in existing functionality |
| `Removed` | Removal of previously existing features |
| `Fixed` | Bug fixes on existing functionality |
---

### 0.2.2 : Multiple changes

**Added**
- Full set of configuration parameters to toggle synchronization behaviors:
  - `CREATE_DOC_ON_USER_CREATED`: Automatic Firestore account document creation.
  - `DELETE_DOC_ON_USER_DELETED`: Optional soft delete of documents.
  - `CREATE_USER_ON_DOC_CREATED` / `UPDATE_USER_ON_DOC_UPDATED`: Control user creation and updates from Firestore.
  - `DELETE_USER_ON_DOC_DELETED`: Control Firebase user deletion from Firestore events.
  - `REVOKE_TOKEN_ON_USER_UPDATED`: Optional refresh token revocation during user updates.
- Comprehensive Mermaid sequence diagrams in-repository documentation.
- Detailed test cases and verification matrix for the new configuration parameters.

**Changed**
- Updated `PREINSTALL.md` and `POSTINSTALL.md` to reflect the new feature set and UID-based account keying.
- Refactored core triggers in `index.ts` to utilize the newer Gen 2 blocking function.

**Fixed**
- Corrected a logic bug in `services.ts` where `CREATE_DOC_ON_USER_CREATED` was used instead of `CREATE_USER_ON_DOC_CREATED`.

### 0.2.1 : Fix trigger registrations

**Fixed**
- Conflicting triggers between document create and update
- Removed use of `merge: true` to prevent silent updates (without function trigger)

### 0.2.0 : Error handling and transactions

**Added**
- Firebase error handling across the project
  - Messages for most common auth and firestore errors defined for user-readability
  - Non firebase errors are logged as-is.
- Transactions for mutiple writes to documents

### 0.1.0 : Initial release

**Added**
- Firebase Authentication users with Firestore account documents sychronization
  - Claims defined via `claims` field in account documents
  - Configurable comma-separated list of allowed claim keys
- Soft delete of account documents by setting `_deletedDate` in document
- Structured logging
  - Recording event logs to sub-collection per account document
  - Supports function logging
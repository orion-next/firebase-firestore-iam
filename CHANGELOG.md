## CHANGELOG

All notable changes to this project will be documented in this file.
| Change type | Description |
| - | - |
| `Added` | Addition of new features |
| `Changed` | Changes in existing functionality |
| `Removed` | Removal of previously existing features |
| `Fixed` | Bug fixes on existing functionality |
---

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
## CHANGELOG

All notable changes to this project will be documented in this file.
| Change type | Description |
| - | - |
| `Added` | Addition of new features |
| `Changed` | Changes in existing functionality |
| `Removed` | Removal of previously existing features |
| `Fixed` | Bug fixes on existing functionality |
---

### 0.1.0 : Initial release
- Synchronize Firebase Authentication users with Firestore account documents
  - Parameterized collection name, deletion behavior, and token revocation
  - Claims defined via `claims` field in account documents
- Implemented soft delete of account documents with `_deletedDate`
  - Scheduled hard purge of expired documents
  - Parameterized cleanup schedule and document lifetime
- Structured logging
  - Streams event logs to sub-collection per account document

#### Added
- Firebase Authentication users with Firestore account documents sychronization
  - Parameterized collection names, deletion behavior, and token revocation
  - Claims defined via `claims` field in account documents
- Soft delete of account documents by setting `_deletedDate` in document
  - Scheduled purge of expired documents
  - Parameterized cleanup schedule and document lifetime
- Structured logging
  - Recording event logs to sub-collection per account document
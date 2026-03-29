### Test Matrix: Firestore ↔ Authentication IAM (Emulator Verification)

This checklist provides a complete verification path for all synchronization triggers. Ensure the Firebase Emulator is running before proceeding.

---

### 1. Authentication: User Created (`SyncAccountOnUserCreated`)

#### Case: Missing Document (Auto-Creation Enabled)
- **Condition**: `CREATE_DOC_ON_USER_CREATED=true` (Default).
- **Steps**:
    - Create a new user in the Auth Emulator.
- **Verification**:
    - [ ] A new document exists in the `Accounts` collection with the user's UID.
    - [ ] An `Activity` log exists with `action: DOCUMENT_CREATED` and `source: AUTH_CHANGE_TRIGGER`.

#### Case: Missing Document (Auto-Creation Disabled)
- **Condition**: `CREATE_DOC_ON_USER_CREATED=false`.
- **Steps**:
    - Create a new user in the Auth Emulator.
- **Verification**:
    - [ ] No document is created in the `Accounts` collection.
    - [ ] No entry exists in the `Activity` log.

#### Case: Existing Soft-Deleted Document
- **Condition**: Document already exists in Firestore with a `_deletedDate` timestamp.
- **Steps**:
    - Manually create a document in the `Accounts` collection (e.g., UID: `soft-deleted-user`).
    - Add a field `_deletedDate` with any valid Firestore Timestamp.
    - Create a new user in the Auth Emulator with the exact same UID (`soft-deleted-user`).
- **Verification**:
    - [ ] The Firebase Auth user is automatically deleted immediately after creation.
    - [ ] The Firestore document remains unchanged.
    - [ ] No new `Activity` logs are generated.

#### Case: Existing Active Document
- **Condition**: Document already exists in Firestore without `_deletedDate`.
- **Steps**:
    - Manually create a document in the `Accounts` collection (e.g., UID: `existing-user`) with `{ "displayName": "Firestore Name" }`.
    - Create a new user in the Auth Emulator with the exact same UID (`existing-user`) and a different name (`Auth Name`).
- **Verification**:
    - [ ] The Firebase Auth user's `displayName` is updated to `"Firestore Name"`.
    - [ ] An `Activity` log exists with `action: USER_CREATED` and `source: AUTH_CHANGE_TRIGGER`.
---

### 2. Authentication: User Deleted (`DeleteAccountOnUserDeleted`)

#### Case: Soft Delete Enabled
- **Condition**: `DELETE_DOC_ON_USER_DELETED=true` (Default).
- **Steps**:
    - Select an existing user in the Auth Emulator.
    - Delete the user record.
- **Verification**:
    - [ ] The corresponding Firestore document in the `Accounts` collection now has a `_deletedDate` field.
    - [ ] An `Activity` log exists with `action: USER_DELETED` and `source: AUTH_CHANGE_TRIGGER`.

#### Case: Soft Delete Disabled
- **Condition**: `DELETE_DOC_ON_USER_DELETED=false`.
- **Steps**:
    - Delete a user record in the Auth Emulator.
- **Verification**:
    - [ ] The Firestore document in the `Accounts` collection is NOT modified.
    - [ ] No `Activity` logs are generated.
---

### 3. Firestore: Account Document Change (`SyncUserOnAccountCreated / Updated`)

#### Case: User Update (Properties & Claims)
- **Condition**: `UPDATE_USER_ON_DOC_UPDATED=true` `REVOKE_TOKEN_ON_USER_UPDATED=true`.
- **Steps**:
    - Update an existing document in the `Accounts` collection.
    - Add or change `displayName` and a `claims` object (e.g., `{ "role": "admin" }`).
- **Verification**:
    - [ ] The Firebase Auth user's property is updated.
    - [ ] The Firebase Auth user has the new custom claims (if key is in `ALLOWED_CLAIMS`).
    - [ ] The Firebase Auth user's refresh tokens are revoked.
    - [ ] An `Activity` log exists with `action: USER_UPDATED` and `source: DOC_CHANGE_TRIGGER`.

#### Case: Non-Existent User (Sync Logic)
- **Condition**: Firestore document created, but corresponding Auth user is missing.
- **Steps**:
    - Create a new document in the `Accounts` collection with a UID that does NOT exist in Auth.
- **Verification**:
    - [ ] A new Firebase Auth user is created with the UID and properties from the document.
    - [ ] An `Activity` log exists with `action: USER_UPDATED` and `source: DOC_CHANGE_TRIGGER`.

#### Case: Irrelevant Field Update
- **Condition**: Update a field NOT in the `AccountDocumentType` sync list (e.g., adding `last_active_at`).
- **Steps**:
    - Select an existing document in the `Accounts` collection.
    - Add or update a field named `last_active_at` with a current timestamp.
- **Verification**:
    - [ ] The Firebase Auth user is NOT updated.
    - [ ] Cloud Logging shows "No syncable changes... Skipping sync."
    - [ ] NO new document is created in the `Activity` log sub-collection.
---

### 4. Firestore: Account Document Deletion (`DeleteUserOnAccountDeleted`)

#### Case: Auth User Deletion Enabled
- **Condition**: `DELETE_USER_ON_DOC_DELETED=true` (Default).
- **Steps**:
    - Manually delete a document from the `Accounts` collection.
- **Verification**:
    - [ ] The associated Firebase Auth user is deleted.
    - [ ] All refresh tokens for that user are revoked.

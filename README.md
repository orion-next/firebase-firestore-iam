### Firestore ↔ Authentication IAM Extension

![Build Status](https://github.com/orion-next/firebase-firestore-iam/actions/workflows/build-on-master.yml/badge.svg?branch=master)

**Author**: Vidush H. Namah   
**Source**: https://github.com/orion-next/firebase-firestore-iam

Keep Firebase Authentication users and Firestore account documents synchronized.

This extension synchronizes Firebase Authentication with Firestore account documents. It ensures that user properties and claims remain consistent across both systems, while providing audit trails and lifecycle management.

| Event | Details |
| :- | :- |
|    |    |
| **Authentication Events** | - |
| Firebase User Creation &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Ensures a corresponding Firestore document exists |
| Firebase User Deletion    | (Optional) Soft deletes the Firestore document by setting `_deletedDate` |
|    |    |
| **Firestore Events** | - |
| Document Creation/Update | Updates Firebase user properties and custom claims |
| Document Deletion        | Deletes the Firebase user and soft deletes the Firestore document |

Built on top of the event-based synchronization logic:
- Claims defined via `claims` field in account documents are synchronized to custom claims.
- Automated actions are logged via document entries and cloud logging.
  - Record event logs to sub-collection per account document.
  - Record function logs.

### Sequence Diagrams

The following diagrams outline the synchronization logic for each trigger.

#### 1. Authentication: User Created
Triggers when a new user is created in Firebase Authentication.

```mermaid
sequenceDiagram
    participant Auth as Firebase Auth
    participant Func as Cloud Function (SyncAccountOnUserCreated)
    participant FS as Firestore (Accounts)
    participant Log as Firestore (Activity)

    Auth->>Func: User Created Trigger
    Func->>FS: Get Account Document (uid)
    FS-->>Func: Document Data
    alt Document does NOT exist AND ENV.CREATE_DOC_ON_USER_CREATED is true
        Func->>FS: Create Empty Document (uid)
        Func->>Log: Log DOCUMENT_CREATED
    else Document exists AND _deletedDate is set
        Func->>Auth: Revoke Tokens & Delete User Record
    else Document exists AND _deletedDate is NOT set
        Func->>Auth: Sync properties & Set Custom Claims
        alt ENV.REVOKE_TOKEN_ON_USER_UPDATE is true
            Func->>Auth: Revoke refresh tokens
        end
        Func->>Log: Log USER_CREATED
    end
```

#### 2. Authentication: User Deleted
Triggers when a user is deleted from Firebase Authentication.

```mermaid
sequenceDiagram
    participant Auth as Firebase Auth
    participant Func as Cloud Function (DeleteAccountOnUserDeleted)
    participant FS as Firestore (Accounts)
    participant Log as Firestore (Activity)

    Auth->>Func: User Deleted Trigger
    alt ENV.DELETE_DOC_ON_USER_DELETED is true
        Func->>FS: Soft Delete (Transaction)
        Func->>Log: Log USER_DELETED
    end
```

#### 3. Firestore: Account Created / Updated
Triggers when an account document is created or updated in the `Accounts` collection.

```mermaid
sequenceDiagram
    participant FS as Firestore (Accounts)
    participant Func as Cloud Function (SyncUserOnAccountCreated / Updated)
    participant Auth as Firebase Auth
    participant Log as Firestore (Activity)

    FS->>Func: Document Created/Updated Trigger
    alt Document is soft-deleted (_deletedDate exists)
        Func->>Auth: Revoke Tokens & Delete User Record
    else Document is active
        Func->>Auth: Get User Record
        alt User found
            alt ENV.UPDATE_USER_ON_DOC_UPDATED is true
                Func->>Auth: Update properties & Set Custom Claims (allowed claims only)
                alt ENV.REVOKE_TOKEN_ON_USER_UPDATE is true
                    Func->>Auth: Revoke refresh tokens
                end
            end
        else User NOT found AND ENV.CREATE_USER_ON_DOC_CREATED is true
            Func->>Auth: Create User with properties & claims
            alt ENV.REVOKE_TOKEN_ON_USER_UPDATE is true
                Func->>Auth: Revoke refresh tokens
            end
        end
        Func->>Log: Log USER_UPDATED
    end
```

#### 4. Firestore: Account Deleted
Triggers when an account document is deleted from Firestore.

```mermaid
sequenceDiagram
    participant FS as Firestore (Accounts)
    participant Func as Cloud Function (DeleteUserOnAccountDeleted)
    participant Auth as Firebase Auth
    participant Log as Firestore (Activity)

    FS->>Func: Document Deleted Trigger
    alt ENV.DELETE_USER_ON_DOC_DELETED is true
        Func->>Auth: Revoke Tokens & Delete User Record
        Func->>FS: Soft Delete (Transaction)
        Func->>Log: Log USER_DELETED
    end
```

#### Additional Parameters

The following parameters may be configured.
| Parameter | Details |
| :- | :- |
| Cloud Functions Location | Deployment location for the functions created |
| Soft Delete Behaviour | Whether to soft delete the account document when a user is deleted |
| Token Management Behavior | Whether to revoke refresh tokens when a user is updated |
| Allowed claims | Comma-separated list of claims that can be set on users. |

#### Google API Usage

| API | Reason |
| :- | :- |
| firebaseauth.googleapis.com | Manage Firebase Authentication users |
| firestore.googleapis.com | Read/write account documents and event logs |

#### Billing

To install this extension, your project must be on the [Blaze (pay as you go)](https://firebase.google.com/pricing) plan.
- You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
- This extension uses other Firebase and Google Cloud Platform services, which may have associated charges if you exceed the service’s no‑cost tier:
  - Cloud Functions for synchronization triggers.
  - Firestore for account documents and audit logs.

The following table provides estimates for Cloud Function invocations and Firestore document operations per event, accounting for cascading processes (default configuration).

| Operation | Function Invocations | Firestore Reads | Firestore Writes |
| :--- | :---: | :---: | :---: |
| **User Sign-Up** (Public) <br/>`BeforeUserCreation` + `SyncAccountOnUserCreated` | 3 | 2 | 3 |
| **User Sign-Up** (Pre-allocated) <br/>`BeforeUserCreation` + `SyncAccountOnUserCreated` | 2 | 2 | 1 |
| **Firestore Doc Update** <br/>`SyncUserOnAccountUpdated` | 1 | 0 | 1 |
| **Auth User Deletion** <br/>`DeleteAccountOnUserDeleted` | 1 | 1 | 2 |
| **Firestore Doc Deletion** <br/>`DeleteUserOnAccountDeleted` | 1 | 1 | 2 |

> [!NOTE]
> Estimates assume public sign-up is not allowed and default synchronization settings.

#### Post Installation
Ensure that the service account bound to the extension has the right to manage documents and authentication.   
Example: `Firebase Admin` role.
- The associated service account can be found in Google Cloud Console > IAM > Service Accounts
- It can be one of the following accounts (in cascading order):
  - `ext-firebase-firestore-iam@<project-id>.iam.gserviceaccount.com`
  - `<project-number>-compute@developer.gserviceaccount.com`
  - `<project-id>@appsport.gserviceaccount.com` 

---

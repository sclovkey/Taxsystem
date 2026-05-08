# Security Specification

## Data Invariants
1. A transaction must have a valid date and amount >= 0.
2. A user can only access their own data (`users/{userId}/...`).
3. `userId` in the document must match the authenticated user's UID.
4. Timestamps should be validated if using server timestamps (though here they are strings).

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a transaction with a different `userId`.
2. **Unauthorized Access**: Attempt to read another user's transactions.
3. **Invalid Data Type**: Send a transaction with `amount` as a string.
4. **Missing Required Fields**: Create a transaction without `date`.
5. **ID Poisoning**: Use a 2KB string as a transaction ID.
6. **Shadow Update**: Attempt to add a `verified: true` field via update.
7. **Resource Poisoning**: Send a payload with a description exceeding 5000 characters.
8. **Insecure List Query**: Attempt to list all transactions without a userId filter (should be blocked by rules).
9. **PII Leak**: Attempt to read private user info (if any).
10. **State Shortcut**: (N/A for this simple CRUD, but I'll check status fields in Liabilities).
11. **Terminal State Locking**: Change a `Paid` liability back to `Pending`.
12. **Orphaned Write**: Create a stock batch with a non-existent item (relational integrity).

## Test Runner (Mock Logic)
The `firestore.rules` will be tested against these invariants.

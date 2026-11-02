# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Ownership (`ownerId == request.auth.uid`)**: Every document in `/ad_assets/{assetId}`, `/linked_sheets/{sheetDocId}`, and `/ad_reminders/{reminderId}` must have `ownerId == request.auth.uid` and a verified email (`request.auth.token.email_verified == true`).
2. **Strict Key & Size Boundaries**: Every write validates exact keys via `hasAll` and `hasOnly`, enforces regex ID validation `^[a-zA-Z0-9_\-]+$` (<= 128 chars), and enforces string length caps (`imageDataUrl <= 750000`, `primaryText <= 2000`, `title <= 160`).
3. **Temporal & Immutable Fields**: `createdAt` and `ownerId` are immutable on update; `createdAt` and `updatedAt` must equal `request.time`.
4. **Query Enforcer**: All `list` operations strictly verify `resource.data.ownerId == request.auth.uid`.

## 2. The "Dirty Dozen" Payloads
1. Unauthenticated write to `/ad_assets/asset_1` -> `PERMISSION_DENIED`
2. Spoofed `ownerId` (`ownerId: "other_user"`) on create -> `PERMISSION_DENIED`
3. Unverified email (`email_verified: false`) on create -> `PERMISSION_DENIED`
4. Shadow field injection (`isAdmin: true`) on `/ad_assets/asset_1` -> `PERMISSION_DENIED`
5. Oversized `title` (> 160 chars) on `/ad_assets/asset_1` -> `PERMISSION_DENIED`
6. Invalid `assetType` enum value (`"video_raw"`) -> `PERMISSION_DENIED`
7. Forged `createdAt` timestamp (client timestamp != `request.time`) -> `PERMISSION_DENIED`
8. Mutating `ownerId` or `createdAt` during update -> `PERMISSION_DENIED`
9. Updating a completed reminder after terminal state `status == 'completed'` -> `PERMISSION_DENIED`
10. Poisoned path ID containing special characters or > 128 chars -> `PERMISSION_DENIED`
11. Cross-user `get` or `list` query without `ownerId == request.auth.uid` -> `PERMISSION_DENIED`
12. Value poisoning on update (`autoSyncEnabled: "yes"` instead of boolean) -> `PERMISSION_DENIED`

# Property actions and future permissions

## Current implementation status

The property action menu is connected to the local Roomler API. The current admin preview has no login or role-based authorization. Mutating action endpoints are therefore disabled when `NODE_ENV=production`; this is a development workflow, not production-ready access control.

## Capability model

Keep these capabilities separate rather than granting one broad `manage_properties` permission:

| Capability | UI action | API operation | Intended effect |
|---|---|---|---|
| `properties.view` | View details | `GET /api/admin/properties/:id` | Read one property record |
| `properties.edit` | Edit property | `PATCH /api/admin/properties/:id` | Update property-level descriptive/reference fields |
| `properties.status.change` | Change listing status | `PATCH /api/admin/properties/:id/status` | Change draft/published/paused/removed |
| `properties.delete` | Delete property | `DELETE /api/admin/properties/:id` | Permanently delete the database record and database-linked children |

The backend declares these capability identifiers as the intended permission contract. They are **not enforced yet**, because authentication and an identity/role source have not been implemented. Before production, add authenticated-user middleware and server-side capability checks to every route. The frontend should also hide or disable actions the current user cannot perform, but that is a usability measure—not the security boundary.

## Suggested initial role matrix (proposal, not implemented)

| Role | View | Edit | Change status | Delete |
|---|---:|---:|---:|---:|
| Super admin | Yes | Yes | Yes | Yes |
| Listing operator | Yes | Yes | Draft / paused only, unless explicitly granted publish | No |
| Verifier | Yes | No | No | No |
| Read-only reviewer | Yes | No | No | No |

This matrix is a proposal for discussion, not an existing Roomler policy. A future verifier capability should be separate from listing-status changes so that publishing a property never implies verification.

## Safety and data behavior

- Listing status and verification status are independent. Changing a listing to `published` does not change verification metadata.
- The first edit implementation updates only property-level descriptive/reference fields. It does not replace floors, rooms, beds, pricing, charges, amenities, or photos.
- Delete is a hard delete. PostgreSQL foreign-key cascades remove linked database rows where configured. S3 objects are not deleted by this endpoint; orphaned object cleanup requires a separate, auditable storage workflow.
- The frontend displays a confirmation dialog before delete.
- Validate authorization on the backend on every request; never rely on a hidden button or menu item.
- Consider soft-delete/retention and audit events before enabling permanent deletion for real listings.

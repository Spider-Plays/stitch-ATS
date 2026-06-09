# Pages

Each route page lives in its own folder:

```
pages/
  {domain}/
    {page-name}/
      PageComponent.tsx   # main page component
      {page-name}.css     # page-specific styles (imported in the tsx)
      *.utils.ts          # page helpers (optional)
      components/         # components used only by this page (optional)
    _shared/              # helpers shared within a domain (optional)
```

## Examples

| Route | Folder |
|-------|--------|
| `/dashboard` | `dashboard/Dashboard.tsx` |
| `/candidates` | `candidates/list/CandidatesList.tsx` |
| `/candidates/:id` | `candidates/profile/CandidateProfile.tsx` |
| `/requirements/:id` | `requirements/detail/RequirementDetail.tsx` |

## Permissions

All role and capability checks are declared in [`src/permissions/index.ts`](../permissions/index.ts).
Import from `@/permissions` instead of scattered `lib/*Permissions` files.

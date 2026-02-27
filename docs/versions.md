# Version Documentation

## Exact Dependency Versions

This project uses exact versions for reproducible builds.

### Core Framework
| Package | Version | Install Command |
|---------|---------|-----------------|
| next | 16.1.6 | `npm install next@16.1.6` |
| react | 19.2.3 | `npm install react@19.2.3` |
| react-dom | 19.2.3 | `npm install react-dom@19.2.3` |
| typescript | 5.9.3 | `npm install -D typescript@5.9.3` |

### Backend & Database
| Package | Version | Install Command |
|---------|---------|-----------------|
| convex | 1.32.0 | `npm install convex@1.32.0` |
| @convex-dev/better-auth | 0.10.11 | `npm install @convex-dev/better-auth@0.10.11` |

### Authentication
| Package | Version | Install Command |
|---------|---------|-----------------|
| better-auth | 1.4.19 | `npm install better-auth@1.4.19` |

### Styling
| Package | Version | Install Command |
|---------|---------|-----------------|
| tailwindcss | 4.2.1 | `npm install -D tailwindcss@4.2.1` |
| @tailwindcss/postcss | 4.2.1 | `npm install -D @tailwindcss/postcss@4.2.1` |

### UI Components
| Package | Version | Install Command |
|---------|---------|-----------------|
| shadcn | 3.8.5 | `npx shadcn@3.8.5 init` |
| @radix-ui/react-slot | 1.2.4 | `npm install @radix-ui/react-slot@1.2.4` |
| lucide-react | 0.575.0 | `npm install lucide-react@0.575.0` |
| class-variance-authority | 0.7.1 | `npm install class-variance-authority@0.7.1` |
| clsx | 2.1.1 | `npm install clsx@2.1.1` |
| tailwind-merge | 3.5.0 | `npm install tailwind-merge@3.5.0` |

### Crawler & Content
| Package | Version | Install Command |
|---------|---------|-----------------|
| @mozilla/readability | 0.6.0 | `npm install @mozilla/readability@0.6.0` |
| linkedom | 0.18.12 | `npm install linkedom@0.18.12` |
| fast-xml-parser | 5.2.2 | `npm install fast-xml-parser@5.2.2` |
| robots-parser | 4.0.2 | `npm install robots-parser@4.0.2` |

### Testing
| Package | Version | Install Command |
|---------|---------|-----------------|
| vitest | 4.0.18 | `npm install -D vitest@4.0.18` |
| @vitejs/plugin-react | 4.5.2 | `npm install -D @vitejs/plugin-react@4.5.2` |
| jsdom | 26.0.0 | `npm install -D jsdom@26.0.0` |
| @types/jsdom | 21.1.7 | `npm install -D @types/jsdom@21.1.7` |

### Build Tools
| Package | Version | Install Command |
|---------|---------|-----------------|
| vite | 6.3.5 | `npm install -D vite@6.3.5` |
| terser | 5.39.0 | `npm install -D terser@5.39.0` |
| npm-check-updates | 18.0.0 | `npm install -D npm-check-updates@18.0.0` |

## Breaking Changes & Notes

### Next.js 16.x
- **Async Params**: Page and layout params are now Promises and must be awaited
- **Middleware**: `middleware.ts` is replaced by `proxy.ts` for clearer network boundaries
- **Caching**: Shift from implicit caching to explicit `use cache` directives

### React 19.x
- **Refs**: `ref` is now a regular prop; `forwardRef` is deprecated
- **Cleanup**: Ref callbacks can now return a cleanup function
- **Actions**: Enhanced form actions and transitions

### Tailwind CSS 4.x
- **CSS-First Configuration**: Configuration moves from `tailwind.config.js` to CSS variables using `@theme`
- **Directives**: `@tailwind base/components/utilities` replaced by `@import "tailwindcss"`
- **Borders**: The `border` class no longer has a default color (uses `currentColor`)
- **Theme**: Use `@theme` block in CSS for customizations

### Better Auth 1.4.x
- Uses Convex Component pattern for integration
- Session cookies now use `cookieCache` for performance
- JWT tokens verified via JWKS endpoint

### Convex 1.32.x
- Vector search requires explicit filterFields for tenant isolation
- Actions are the only place to perform side effects (fetch, etc.)
- Components use `convex.config.ts` for registration

## Updating Dependencies

To check for available updates without applying them:

```bash
npm run tooling
```

This will list what would change. Review breaking changes before upgrading.

## Lockfile

This project uses `package-lock.json` to lock exact versions. Always commit changes to the lockfile after installing dependencies.

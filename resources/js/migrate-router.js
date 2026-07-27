/**
 * One-time migration script: Replace react-router-dom with Inertia equivalents.
 * Run with: node resources/js/migrate-router.js
 *
 * Handles:
 *   - import { useNavigate, useParams, Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
 *   - const navigate = useNavigate()
 *   - navigate('/path') → router.visit('/path')
 *   - useParams() → usePage() URL parsing
 *   - <Link to="/path"> → <Link href="/path"> (Inertia Link)
 *   - useLocation() → usePage().url
 *   - useSearchParams() → usePage().props / URL parsing
 */

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'Pages');
const featuresDir = path.join(__dirname, 'features');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Skip if no react-router-dom usage
    if (!content.includes('react-router-dom')) return;

    const lines = content.split('\n');
    const newLines = [];
    let needsRouterImport = false;
    let hasInertiaLink = false;
    let hasInertiaRouter = false;
    let hasUsePage = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Replace react-router-dom imports
        if (line.includes("from 'react-router-dom'") || line.includes('from "react-router-dom"')) {
            modified = true;
            // Extract what's being imported
            const match = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]react-router-dom['"]/);
            if (match) {
                const imports = match[1].split(',').map(s => s.trim());
                // Determine what Inertia imports we need
                if (imports.some(i => i === 'useNavigate' || i === 'useLocation' || i === 'useParams' || i === 'useSearchParams')) {
                    needsRouterImport = true;
                }
                if (imports.some(i => i === 'Link' || i === 'NavLink')) {
                    hasInertiaLink = true; // Inertia has <Link>
                }
            }
            // Skip this line - we'll add the proper imports later
            continue;
        }

        // Replace const navigate = useNavigate()
        if (line.includes('const navigate = useNavigate()') || line.includes('const navigate = useNavigate(')) {
            modified = true;
            continue; // Remove the line
        }

        // Replace const { id } = useParams() - keep the variable but remove the hook
        // We'll handle this by replacing the pattern later
        if (line.includes('useParams') && !line.includes('import')) {
            modified = true;
            // Keep the destructuring but comment it, we'll replace usage
            continue; // Remove the line, we'll get ID from props/URL
        }

        // Replace const location = useLocation()
        if (line.includes('const location = useLocation()')) {
            modified = true;
            continue; // Remove - we use usePage().url instead
        }

        // Replace const [searchParams] = useSearchParams()
        if (line.includes('useSearchParams')) {
            modified = true;
            continue; // Remove - we use URL search params from Inertia
        }

        // Replace navigate(...) calls
        if (line.includes('navigate(')) {
            // Only replace if it's a function call, not a variable declaration
            if (!line.trimStart().startsWith('const') && !line.trimStart().startsWith('let') && !line.trimStart().startsWith('var')) {
                modified = true;
                line = line.replace(/\bnavigate\(/g, 'router.visit(');
            }
        }

        // Replace <Link to="/path"> with <Link href="/path"> (Inertia Link uses href)
        if (line.includes('<Link ') && line.includes(' to=')) {
            modified = true;
            line = line.replace(/ to=\{?\/?'/g, " href='/");
            // Handle dynamic to={`...`}
            line = line.replace(/\bto=\{/g, 'href={');
        }

        // Replace <NavLink ...> with <Link ...> (Inertia doesn't have NavLink)
        if (line.includes('<NavLink ')) {
            modified = true;
            line = line.replace(/<NavLink /g, '<Link ');
        }

        // Replace .pathname on location
        if (line.includes('location.pathname')) {
            modified = true;
            line = line.replace(/location\.pathname/g, 'url');
        }

        // Replace `location` variable usage
        if (line.includes('location') && !line.includes('const location') && !line.includes('.href') && !line.includes('import')) {
            // Only replace standalone location references (not full paths)
            modified = true;
            line = line.replace(/\blocation\b(?!\.)/g, 'url');
        }

        newLines.push(line);
    }

    if (!modified) return;

    // Add Inertia imports
    const inertiaImports = [];
    if (needsRouterImport || hasInertiaLink) {
        inertiaImports.push("import { router" + (needsRouterImport || hasInertiaLink ? "" : "") + " } from '@inertiajs/react'");
    }
    // Actually simplify: always import { Link, router } from '@inertiajs/react'
    // and { usePage } when needed

    // Find the right insertion point (after other imports)
    let insertionIdx = -1;
    for (let i = 0; i < newLines.length; i++) {
        if (newLines[i].trim().startsWith('import ')) {
            insertionIdx = i;
        }
    }

    // Add necessary Inertia imports after the last import
    if (insertionIdx >= 0) {
        // Remove any existing Inertia import if we're replacing it
        const finalLines = [];
        let hasRouterImport = false;

        for (let i = 0; i < newLines.length; i++) {
            const line = newLines[i];
            if (line.includes("@inertiajs/react")) {
                // Skip existing import, we'll add our own
                continue;
            }
            finalLines.push(line);
        }

        let output = finalLines.join('\n');

        // Add router import
        if (!output.includes("from '@inertiajs/react'")) {
            output = output.replace(/(import\s+.*['"];?\s*$)/m, (match) => {
                return match + "\nimport { router } from '@inertiajs/react'";
            });
        }

        // Also add usePage if needed
        if (needsRouterImport && !output.includes('usePage')) {
            // Check if file uses things like location, useParams etc.
            if (output.includes('url') || output.includes('usePage')) {
                // already handled
            }
            // Add usePage import for URL-based navigation
        }

        fs.writeFileSync(filePath, output, 'utf8');
        console.log(`  ✅ Updated: ${path.relative(__dirname, filePath)}`);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath);
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

console.log('Migrating Pages directory...');
walkDir(pagesDir);
console.log('Migrating Features directory...');
walkDir(featuresDir);
console.log('Done!');
console.log('');
console.log('⚠️  Manual review needed:');
console.log('  - useParams() variables were removed — get ID from URL: const { url } = usePage(); const id = url.split(\"/\").pop()');
console.log('  - useSearchParams() was removed — use window.location.search or Inertia props');
console.log('  - Verify <Link href={...}> renders correctly');
console.log('  - Verify all router.visit() calls have correct paths');

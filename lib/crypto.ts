// Simple browser-side hashing for demo only (not for production)
export async function hashPassword(pw: string): Promise<string> {
    const enc = new TextEncoder().encode(pw)
    const buf = await crypto.subtle.digest('SHA-256', enc)
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

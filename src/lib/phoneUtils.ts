// Memory cache for mapped LIDs to actual phone numbers
const lidPhoneCache = new Map<string, string>();

function getNodeFsAndPath() {
  if (typeof window !== 'undefined') return null;
  try {
    const fs = eval('require')('fs');
    const path = eval('require')('path');
    return { fs, path };
  } catch {
    return null;
  }
}

/**
 * Resolves a WhatsApp JID or phone identifier (which might be an internal LID like 190254552186900@lid)
 * to the actual international phone number (e.g. 923115308767).
 */
export function resolvePhoneFromJidOrNumber(jidOrPhone: string): string {
  if (!jidOrPhone) return '';

  const clean = jidOrPhone.split('@')[0].split(':')[0].replace(/\D/g, '');
  if (!clean) return '';

  // Check memory cache
  if (lidPhoneCache.has(clean)) {
    return lidPhoneCache.get(clean)!;
  }

  const node = getNodeFsAndPath();
  if (node) {
    try {
      const authDir = node.path.join(process.cwd(), '.baileys_auth_session');
      if (node.fs.existsSync(authDir)) {
        // 1. Check reverse mapping file in .baileys_auth_session
        const revFile = node.path.join(authDir, `lid-mapping-${clean}_reverse.json`);
        if (node.fs.existsSync(revFile)) {
          try {
            const content = JSON.parse(node.fs.readFileSync(revFile, 'utf8'));
            if (content && typeof content === 'string') {
              const mapped = content.replace(/\D/g, '');
              if (mapped) {
                lidPhoneCache.set(clean, mapped);
                return mapped;
              }
            }
          } catch {}
        }

        // 2. Scan forward mapping files: lid-mapping-<phone>.json with content = clean
        const files = node.fs.readdirSync(authDir);
        for (const file of files) {
          if (file.startsWith('lid-mapping-') && !file.includes('_reverse') && file.endsWith('.json')) {
            try {
              const content = node.fs.readFileSync(node.path.join(authDir, file), 'utf8').replace(/["\s]/g, '');
              if (content === clean) {
                const phoneFromFilename = file.replace('lid-mapping-', '').replace('.json', '').replace(/\D/g, '');
                if (phoneFromFilename) {
                  lidPhoneCache.set(clean, phoneFromFilename);
                  return phoneFromFilename;
                }
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error('[PhoneUtils] Error resolving LID mapping:', err);
    }
  }

  // Fallback: return raw clean digits
  lidPhoneCache.set(clean, clean);
  return clean;
}

/**
 * Normalizes phone number into full Pakistani format (e.g. 923115308767) and extracts the last 9 digits.
 */
export function normalizePhoneNumber(phone: string): { full: string; last9: string } {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '92' + clean.slice(1);
  }
  const last9 = clean.slice(-9);
  return { full: clean, last9 };
}

/**
 * Determines whether two phone numbers refer to the same subscriber.
 */
export function arePhoneNumbersEqual(phoneA: string, phoneB: string): boolean {
  if (!phoneA || !phoneB) return false;

  const resolvedA = resolvePhoneFromJidOrNumber(phoneA);
  const resolvedB = resolvePhoneFromJidOrNumber(phoneB);

  const normA = normalizePhoneNumber(resolvedA);
  const normB = normalizePhoneNumber(resolvedB);

  if (normA.full === normB.full) return true;
  if (normA.last9.length >= 7 && normA.last9 === normB.last9) return true;

  return false;
}

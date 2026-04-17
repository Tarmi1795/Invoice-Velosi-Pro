export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function normalizeStr(str: string): string {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[\s\-_]+/g, "");
}

export interface MatchCandidate {
  id?: string;
  employee_no?: string;
  name: string;
  [key: string]: any;
}

export function suggestMatch(
  value: string,
  candidates: MatchCandidate[]
): (MatchCandidate & { distance: number; isExact: boolean }) | null {
  if (!value) return null;
  const normVal = normalizeStr(value);
  if (!normVal) return null;
  
  let bestMatch = null;
  let bestDist = Infinity;
  
  for (const c of candidates) {
    if (!c.name) continue;
    const normC = normalizeStr(c.name);
    
    // Try exact core match check first
    if (normVal === normC) {
      return { ...c, distance: 0, isExact: true };
    }
    
    const dist = levenshteinDistance(normVal, normC);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = { ...c, distance: dist, isExact: false };
    }
    
    // Additional heuristic: if one string contains the other perfectly and they share > 50% length
    if ((normC.includes(normVal) || normVal.includes(normC)) && normVal.length > 3) {
       const charDiff = Math.abs(normC.length - normVal.length);
       if (charDiff <= 5 && charDiff < bestDist) {
           bestDist = charDiff; // Override distance to prefer inclusions
           bestMatch = { ...c, distance: charDiff, isExact: false };
       }
    }
  }
  
  // Dynamic threshold: Allow 3 changes, or 30% of length, whichever is larger
  const threshold = Math.max(3, Math.floor(normVal.length * 0.3));
  if (bestDist <= threshold) {
    return bestMatch;
  }
  return null;
}

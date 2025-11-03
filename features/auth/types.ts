// features/auth/types.ts
export type Role =
    | 'applicant'          // Students applying (new/renewal)
    | 'clientAdmin'        // Organization staff
    | 'coordinator'        // ISTS program coordinator
    | 'evaluator'          // External reviewers
    | 'support'            // Support representatives
    | 'systemAdmin'        // Technical platform admins
export interface User { id: string; email: string; name: string; role: Role }

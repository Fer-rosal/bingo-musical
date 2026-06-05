# Data Governance & Security Compliance

## Overview

Bingo Musical complies with:
- ✅ **RGPD** - Reglamento General de Protección de Datos (UE 2016/679)
- ✅ **LOPD-GDD** - Ley Orgánica de Protección de Datos - Garantía de Derechos Digitales (España, Ley 3/2018)
- ✅ **LSSI-CE** - Ley de Servicios de la Sociedad de la Información (España, Ley 34/1988)

---

## Data Minimization Principle

### ✅ DATA WE COLLECT (Only what's necessary)

| Data | Purpose | Legal Basis | Retention |
|------|---------|------------|-----------|
| **Email** | Authentication, notifications | Contractual (Art. 6.1.b RGPD) | While active + 30 days |
| **Display Name** | UX personalization (optional) | Consent (Art. 6.1.a RGPD) | While active + 30 days |
| **Spotify ID** | Access playlists for games | Consent (Art. 6.1.a RGPD) | While active + 30 days |
| **Consent Records** | Legal compliance | Legal obligation (Art. 6.1.c RGPD) | 3 years |
| **Created/Updated Timestamps** | Security, auditing | Legitimate interest (Art. 6.1.f RGPD) | While active + 90 days |

### ❌ DATA WE NEVER COLLECT

| What | Why Not |
|------|---------|
| **Passwords** | Firebase Auth handles securely (hashed, salted, impossible for us to access) |
| **IP Addresses** | Unnecessary tracking risk; Vercel/Firebase log this for infrastructure only |
| **Device Info** | Privacy risk; not needed for game functionality |
| **Detailed Activity Logs** | Excessive surveillance; unnecessary for service |
| **Location Data** | Completely unnecessary; privacy violation |
| **Payment Info** | Uses external processors (Stripe if needed) - we never see card data |
| **Phone Numbers** | Not required for any feature |
| **Age/Gender/Ethnicity** | Discriminatory data collection we refuse |

---

## Password Security

### How Passwords Are Handled (Firebase Auth)

```
User enters password
     ↓
Sent over HTTPS to Firebase (encrypted in transit)
     ↓
Firebase applies: PBKDF2 + SHA-256 + salt + pepper
     ↓
Hash stored in Firebase Auth (we NEVER see the password)
     ↓
User cannot reset via us (Firebase resets or user verifies email)
```

**Key Points:**
- ✅ Passwords are salted (random salt per user)
- ✅ Passwords are hashed (not encrypted - cannot be reversed)
- ✅ Passwords are peppered (additional server-side secret)
- ✅ We have ZERO access to passwords
- ✅ Even if our database is breached, passwords are secure
- ✅ Password reset requires email verification (MFA alternative)

### In Our Code

```typescript
// lib/auth.ts - NO password handling
interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  spotifyId?: string;
  // ❌ NO password field ever
  consent: UserConsent; // Only consent tracking
}
```

---

## Consent Management

### Explicit Consent Flow (RGPD Art. 7)

```
User visits login page
     ↓
ConsentModal.tsx appears
     ↓
User sees 3 REQUIRED checkboxes:
  1. RGPD policy accepted
  2. Privacy policy accepted
  3. Terms & conditions accepted
     ↓
Optional checkbox:
  4. Marketing emails (can be unchecked)
     ↓
Buttons disabled until all 3 required are checked
     ↓
User clicks "Aceptar y Continuar"
     ↓
Consent sent to: POST /api/auth/spotify-login
     ↓
Backend validates: if (!rgpd || !privacy || !terms) reject 400
     ↓
If valid: store in secure httpOnly cookie
     ↓
Firestore stores: consent object with timestamp, version, checkbox states
     ↓
Redirect to Spotify OAuth
```

### Consent Record Structure

```typescript
interface UserConsent {
  rgpdAgreed: boolean;          // RGPD policy
  privacyAgreed: boolean;       // Privacy policy
  termsAgreed: boolean;         // Terms of service
  marketingOptIn: boolean;      // Newsletters (optional)
  consentDate: Timestamp;       // When accepted
  consentVersion: string;       // "1.0" - for future updates
}
```

### Consent Versions (Future Changes)

If we update policies:
1. Create new consent version (e.g., "2.0")
2. Store old consents as-is (historical record)
3. Require re-acceptance of new consent
4. Email users 30 days before enforcement

---

## User Rights (RGPD Articles 12-23)

### 1. Right of Access (Art. 15)
**Request:** User can request copy of all their data
**Implementation:** GET /api/auth/delete-account?uid={uid}
**Response Time:** 30 days (RGPD requirement)
**What We Provide:**
- Profile data (email, name, Spotify ID)
- Consent records
- Game history
- All timestamps

### 2. Right to Rectification (Art. 16)
**Request:** Correct inaccurate or incomplete data
**How:** User can update display name in settings (future feature)
**What's Correctable:** Display name, email, marketing preference
**What's Not:** Consent date (immutable for audit), user ID

### 3. Right to Erasure / "Right to be Forgotten" (Art. 17)
**Request:** User requests permanent deletion
**Implementation:** POST /api/auth/delete-account
**Process:**
1. User submits deletion request
2. We verify authentication
3. Delete from Firestore: profile, game data, consent preferences
4. Fire base Auth: Delete user account
5. Return confirmation

**What Gets Deleted:**
- User profile
- Game records
- Marked cartóns
- All personal data

**What We Keep (Legal Exception Art. 17.3):**
- Consent record (3 years - legal requirement)
- Minimal audit log (90 days - security requirement)
- Anonymized game statistics (cannot be linked to user)

**Response Time:** Within 30 days (RGPD requirement)

### 4. Right to Restrict Processing (Art. 18)
**Request:** "Don't use my data for X"
**Implementation:** User can disable marketing emails, opt-out of analytics
**How Implemented:**
- Consent preference: marketingOptIn boolean
- Settings page: future toggle for preferences

### 5. Right to Data Portability (Art. 20)
**Request:** Get data in portable format (e.g., CSV, JSON)
**Implementation:** GET /api/auth/delete-account?uid={uid}&format=json
**What's Provided:** All user data in structured format
**Format:** JSON or CSV (user selects)

### 6. Right to Object (Art. 21)
**Request:** "Don't process my data for this reason"
**Implementation:** User can decline marketing, analytics, non-essential features
**Default:** Minimum required processing, rest is opt-in

---

## Data Breaches & Security Incidents (RGPD Art. 33-34)

### Breach Notification Process

If we discover unauthorized data access:

1. **Immediate Actions (within 24 hours)**
   - Isolate affected systems
   - Log all actions
   - Notify security team

2. **Authority Notification (within 72 hours)**
   - Report to Spain's AEPD (Autoridad de Protección de Datos)
   - Provide: nature of breach, data affected, impact, measures taken

3. **User Notification**
   - Email affected users within 24 hours
   - Subject: "Notificación de Incidente de Seguridad"
   - Include: what data, when discovered, what we're doing
   - Provide resources (password reset, fraud monitoring)

4. **Documentation**
   - Keep breach register (Art. 33.5)
   - Document findings and remediation

---

## Third-Party Data Processing

### Data Processors (RGPD Art. 28)

We use processors for cloud infrastructure - all have signed Data Processing Agreements:

| Processor | Purpose | Data Shared | Location | Safeguards |
|-----------|---------|-------------|----------|-----------|
| **Google Firebase** | Database, Auth | User ID, email, consent, game data | EU/US | DPA, encryption, audit logs |
| **Spotify** | Music API | Spotify ID, playlist access | US | OAuth token, no storage | 
| **Vercel** | Hosting, CDN | Request logs, errors | US | Encryption, DPA, 90-day retention |
| **SendGrid** (if email) | Transactional email | Email only (no history) | US | DPA, no permanent storage |

### Sub-processors

Users can view full list of sub-processors at: /processors

**Note:** We do NOT use:
- ❌ Google Analytics (tracking)
- ❌ Facebook Pixel (tracking)
- ❌ Third-party ad networks
- ❌ Data brokers
- ❌ Any processor without DPA

---

## Data Security Measures

### Infrastructure Security

```
HTTPS TLS 1.2+        → Encryption in transit
Firebase encryption   → Encryption at rest
httpOnly cookies      → Cannot be accessed by JS (XSS protection)
Secure cookies        → HTTPS only (no HTTP interception)
CSRF tokens          → Prevent cross-site forgery
Rate limiting        → Prevent brute force
```

### Application Security

```
Input validation     → No SQL injection, XSS
Password hashing     → Firebase (we never see passwords)
No sensitive logging → Don't log passwords, tokens, emails
Audit logs          → Security events tracked
Access control      → Only host can modify game state
```

### Firestore Security

```
Database Rules       → Only authenticated users access own data
Encryption at rest  → Google managed keys
Automatic backups   → 7-day retention
Point-in-time recovery → Can restore deleted data (audit trail)
```

---

## International Data Transfers

### Where Data Flows

```
User Browser (Spain)
     ↓ (HTTPS)
Vercel CDN (EU)
     ↓ (HTTPS)
Firebase (may route to US)
     ↓
Spotify API (US)
```

### Legal Basis for US Transfers

- ✅ **SCCs (Standard Contractual Clauses)** - Firebase/Google have SCCs approved by EU
- ✅ **Adequacy Decision pending** - US-EU agreements in place
- ✅ **Privacy Shield alternative** - Data minimization (no sensitive data)

### User Controls

- User can request EU-only storage (future feature)
- Can export data and delete (right to portability)
- Can change location if supported

---

## Compliance Checklist

### During Development
- [ ] Privacy impact assessment (DPIA) completed
- [ ] Consent mechanisms implemented
- [ ] Data minimization enforced
- [ ] Security measures in place
- [ ] Third-party DPAs obtained
- [ ] Audit logging configured

### Before Production
- [ ] Legal review (privacy lawyer)
- [ ] Security audit (penetration testing)
- [ ] Privacy notice posted
- [ ] Terms & conditions approved
- [ ] AEPD notification prepared (if required)
- [ ] Employee training completed

### Ongoing
- [ ] Monthly security updates
- [ ] Quarterly privacy audit
- [ ] Annual DPA reviews
- [ ] Breach incident plan testing
- [ ] Staff training on data handling
- [ ] User consent preferences honored

---

## Contact & References

### Delegado de Protección de Datos (DPD)
**Email:** privacy@bingomusical.es
**Response Time:** Within 5 business days

### Spain's Data Protection Authority
**Name:** Autoridad de Protección de Datos (AEPD)
**Website:** www.aepd.es
**Email:** info@aepd.es
**For:** Complaints about our practices

### Legal Documents
- [Privacy Policy](/privacy)
- [Terms of Service](/terms)
- [Data Processing Agreement](/legal/dpa) (available to users on request)

---

## Document Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-06-05 | Initial document | Security Team |

**Last Reviewed:** 2026-06-05
**Next Review:** 2026-12-05
**Status:** ✅ Active & Compliant

---

## Disclaimer

This document is a summary of our data governance practices. For legal advice specific to your situation, consult a qualified data protection attorney (abogado especializado en protección de datos).

Spain's AEPD website: https://www.aepd.es
GDPR official text: https://eur-lex.europa.eu/eli/reg/2016/679/oj

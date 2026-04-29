# Research Plan: Vault Creation Drop-off & Verifier Comprehension

**Issue:** [#55](https://github.com/Disciplr-Org/Disciplr-Frontend/issues/55)  
**Status:** Draft  
**Owner:** Design Team  

---

## 1. Background & Context
We have noticed a significant drop-off during the "Create Vault" flow. Initial feedback suggests users are confused by the "Verifier" role and the implications of the multi-sig/time-lock mechanism. This research aims to identify friction points and validate whether users understand why a verifier is needed.

## 2. Research Objectives
- Identify specific steps in the vault creation flow where users hesitate or abandon.
- Evaluate user comprehension of the "Verifier" role.
- Determine if the value proposition of a "Time-locked Capital Vault" is clear.
- Validate the clarity of WCAG-compliant UI components (contrast, label clarity).

## 3. Methodology
- **Type:** Moderated Usability Testing.
- **Participants:** 5–8 participants (mix of crypto-native and newcomers).
- **Format:** 45-minute remote sessions via Zoom/Google Meet.
- **Tooling:** [Figma Prototype (Insert Node ID here)](https://www.figma.com/file/placeholder)

## 4. Success Metrics
- **Task Success Rate:** % of participants who successfully create a vault without assistance.
- **Verifier Comprehension Score:** Qualitative rating (1-5) based on their explanation of the verifier's role.
- **Time on Task:** Average time spent on the "Create Vault" screen.
- **System Usability Scale (SUS):** Goal score > 75.

## 5. Moderated Session Script

### A. Introduction (5 mins)
- Greeting and consent.
- Explain the purpose: "We're testing a new way to save money securely."
- Privacy note: "Your data is handled according to our privacy policy (no PII shared or stored)."

### B. Scenario: Creating a Vault (20 mins)
- **Task:** "You want to save 50 USDC for a month. You need to ensure you can't touch it unless a trusted friend (the Verifier) agrees, or the time expires. Go through the process of creating this vault."
- **Observe:** Where do they click? Do they read the tooltips? Do they hesitate at the Verifier address field?

### C. The "Verifier" Deep Dive (10 mins)
- **Question:** "In your own words, what do you think the Verifier does?"
- **Question:** "What happens if your Verifier loses their wallet?"

### D. Debrief (10 mins)
- Overall impression.
- What was the most confusing part?
- Scale of 1-10: How much do you trust this system?

## 6. Recruiting & Privacy
- **Recruiting:** Reach out via Discord/Email list.
- **Privacy:**
    - No real wallet addresses required for testing (use testnet/mock addresses).
    - Session recordings will be deleted after 30 days.
    - Anonymized notes only.

## 7. Accessibility Targets (WCAG 2.1 AA)
- **Contrast:** Minimum 4.5:1 for text (Check `design-system/tokens/colors.json`).
- **Focus Order:** Logical tab order through the form.
- **Touch Targets:** Minimum 44x44px for action buttons.
- **Labelling:** Clear ARIA labels for complex inputs.

---

## 8. Appendix: Traceability
- **Design System:** References `design-system/tokens/spacing.json` for form layouts.
- **Motion:** Success animations follow `design-system/tokens/motion.json`.

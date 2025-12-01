Information Security Policy
===========================

Owner and Contact
-----------------
- Security Owner: Brad (Founder), brad@axite.ai
- Security Contact (monitored): security@axite.ai
- Escalation: security@axite.ai for 24x7 notifications; Sev1 incidents also page the on-call lead.

Purpose and Scope
-----------------
This policy defines how AskMyMoney protects the confidentiality, integrity, and availability of systems and data that store or process customer financial information (including Plaid-derived data), company data, and supporting infrastructure. It applies to all workforce members, contractors, systems, and third parties with access to production or sensitive data.

Governance and Risk Management
------------------------------
- Conduct an annual risk assessment and whenever material changes occur; document risks, owners, and mitigation plans.
- Review this policy, standards, and procedures at least annually; require acknowledgement from all workforce members.
- Maintain a current asset inventory (endpoints, servers, cloud resources, third-party services) with owners and data classifications.
- Track exceptions with documented compensating controls and target remediation dates.

Identity and Access Management
------------------------------
- Enforce single sign-on (SSO) with phishing-resistant MFA (e.g., WebAuthn/passkeys or hardware keys) for all workforce access to production, CI/CD, cloud console, and databases.
- Enforce phishing-resistant MFA for customer authentication before Plaid Link is surfaced in the application where supported UX exists.
- Apply least privilege, role-based access, and just-in-time elevation for administrative actions.
- Require unique accounts; prohibit shared credentials.
- Terminate access within 24 hours of role change or departure.
- Rotate API keys and secrets regularly; prefer short-lived tokens (OAuth/JWT) for service-to-service auth.

Secrets and Key Management
--------------------------
- Store secrets (including Plaid access tokens, database credentials, encryption keys) in a managed secrets service; never commit secrets to source control.
- Encrypt sensitive tokens at rest with AES-256-GCM (see `lib/services/encryption-service.ts`).
- Rotate encryption keys on a defined cadence and after suspected compromise; maintain a runbook for key rotation.

Network and Infrastructure Security
-----------------------------------
- Enforce TLS 1.2+ for all data in transit; HSTS enabled on public endpoints.
- Restrict administrative access to production via SSO + MFA and IP/network controls (security groups/firewalls).
- Maintain hardened base images; disable unused services and enforce secure configurations via IaC.
- Enable logging for authentication, authorization, admin actions, and data access; ship logs to centralized monitoring with retention aligned to legal requirements.
- Backups: enable encrypted backups for databases and critical storage; test restore at least quarterly.

Data Protection and Privacy
---------------------------
- Classify data (Public, Internal, Confidential, Restricted). Plaid-derived financial data and PII are Restricted.
- Encrypt Restricted data in transit (TLS 1.2+) and at rest (database encryption plus application-level AES-256-GCM for Plaid tokens).
- Minimize data collection; store only what is necessary for product functions.
- Follow the Data Retention and Disposal Policy for retention periods and secure disposal.
- Support user consent and withdrawal of consent; honor data subject rights requests within required timelines.

Application and Secure Development
----------------------------------
- Enforce code review for all changes to production code and infrastructure as code.
- Run static analysis, dependency vulnerability scanning, and secret scanning in CI.
- Separate environments (dev, staging, prod) with distinct credentials and access controls; no production data in lower environments.
- Protect CI/CD with SSO + MFA; require signed artifacts or integrity checks before deploy.

Vulnerability Management
------------------------
- Run scheduled vulnerability scans on endpoints (laptops/contractor machines) and production assets; track and remediate findings within SLA (e.g., Critical: 7 days, High: 14 days, Medium: 30 days).
- Continuously monitor for end-of-life software and upgrade or replace before support ends.
- Subscribe to vendor security advisories (including Plaid) and apply patches promptly.

Logging, Monitoring, and Detection
----------------------------------
- Collect security-relevant logs (authn/authz events, admin actions, data access, network ingress/egress).
- Monitor for anomalous access and excessive failures; alert on high-risk events.
- Enable tamper-resistant log storage and time synchronization (NTP).

Incident Response
-----------------
- Maintain an incident response plan with roles, contact methods, runbooks, and communication templates.
- Classify incidents by severity; require 24x7 response for Sev1 and Sev2.
- Preserve evidence (logs, snapshots) and follow chain-of-custody where applicable.
- Conduct post-incident reviews with remediation tracking and deadlines.

Business Continuity and Disaster Recovery
-----------------------------------------
- Maintain documented BCP/DR plans covering loss of cloud region, database corruption, and third-party outages.
- Test backup restore and failover procedures at least annually; record RPO/RTO results.

Third-Party and Vendor Management
---------------------------------
- Maintain an inventory of vendors with data classification, purpose, and owner.
- Perform security and privacy due diligence before onboarding; require DPAs and security addenda where applicable.
- Review vendor posture annually and after material changes; maintain termination/exit plans.

Physical Security
-----------------
- Rely on cloud provider physical controls for production systems; collect and review SOC2/ISO attestations annually.
- For workforce endpoints, require full-disk encryption, screen lock, and device management with EDR.

Change Management
-----------------
- Require documented change records for production changes (code, infra, config).
- Risk-assess changes; include rollback plans and testing evidence.
- Prohibit emergency changes without post-change review.

Training and Awareness
----------------------
- Require annual security, privacy, and acceptable-use training; track completion.
- Provide role-based training for engineers (secure coding, secrets handling, MFA expectations).

Compliance and Policy Review
----------------------------
- Review and approve this policy at least annually or after significant changes to systems, regulations, or risk posture.
- Violations are subject to disciplinary action up to termination and legal remedies.

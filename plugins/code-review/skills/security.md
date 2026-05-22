Run a focused security audit on the current codebase or a specific file.

Arguments: $ARGUMENTS (optional: file path or directory)

Steps:
1. Determine scope: argument path, or current project if empty.
2. Scan for OWASP Top 10 vulnerabilities relevant to the language/framework detected:
   - A01 Broken Access Control
   - A02 Cryptographic Failures (weak algos, hardcoded secrets, unencrypted storage)
   - A03 Injection (SQL, command, LDAP, XPath, template injection)
   - A05 Security Misconfiguration (debug modes, default creds, exposed stack traces)
   - A06 Vulnerable Components (obvious outdated/known-bad patterns)
   - A07 Auth Failures (missing auth checks, session fixation, weak passwords)
   - A09 Logging Failures (sensitive data in logs, missing audit trails)
3. Also check for:
   - Hardcoded secrets, API keys, passwords
   - Path traversal vulnerabilities
   - Insecure direct object references
   - Missing input validation at system boundaries
4. For each finding:
   - Severity: 🔴 Critical / 🟡 Medium / 🔵 Low
   - File + approximate line
   - CWE or OWASP category
   - Recommended fix
5. End with a risk summary.

This is a static analysis — flag likely issues for human review, not definitive vulnerabilities.

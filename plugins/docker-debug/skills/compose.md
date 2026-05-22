Analyze and fix a docker-compose.yml file in the current project.

Steps:
1. Find docker-compose.yml (or docker-compose.yaml, compose.yml) in the current directory or parent.
2. Parse and audit for common issues:
   - Missing `depends_on` for services that need ordering
   - Hardcoded secrets instead of env_file or secrets
   - Missing resource limits (memory, CPU)
   - `latest` image tags (not reproducible)
   - Host-mode networking security risks
   - Missing healthchecks on critical services
   - Volume mounts that could cause permission issues
   - Ports exposed to 0.0.0.0 unnecessarily
3. If the user ran `docker compose up` and it failed, also run:
   - `docker compose config` to validate the file
   - `docker compose ps` to see service states
4. Report findings with severity and exact line references.
5. Offer to apply fixes — show the diff first, then ask for confirmation.

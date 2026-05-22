Diagnose a failing or misbehaving Docker container and suggest fixes.

Arguments: $ARGUMENTS (container name or ID, optional)

Steps:
1. If no argument given, run `docker ps -a` to list containers and ask which to diagnose.
2. Gather information:
   - `docker inspect <container>` — config, mounts, env vars, restart policy
   - `docker logs --tail 100 <container>` — recent output and errors
   - `docker stats <container> --no-stream` — CPU/memory usage
3. Identify the failure mode:
   - Exit code analysis (e.g. 137 = OOM kill, 1 = app error, 125/126/127 = Docker/entrypoint issue)
   - Pattern match logs for common errors (port conflicts, permission denied, missing env vars, OOM)
   - Check if healthcheck is defined and failing
4. Provide a diagnosis:
   - Root cause (be specific, quote the relevant log line)
   - Fix recommendation with exact commands or config changes
   - Preventive suggestion if applicable
5. If it's a networking issue, also run `docker network inspect` for the relevant network.

Do not restart or modify containers without user confirmation.

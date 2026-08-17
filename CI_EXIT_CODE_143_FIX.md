# CI Exit Code 143 Fix — Backend CI

## The Error

```
✅ Backend server started successfully
{"message":"✅ HR Dashboard Backend - Server is running!",...}
Error: Process completed with exit code 143.
```

The Backend CI step was **reporting success** (server started, MongoDB connected, HTTP response received) but then **exiting with code 143**.

---

## Root Cause

**Exit code 143 = 128 + 15 = SIGTERM**

Here is what was happening step by step:

### 1. The CI script starts the server in the background

```bash
node server.js &
SERVER_PID=$!
```

### 2. The loop detects the server is running

```bash
for i in $(seq 1 15); do
  if curl -s http://localhost:5000/ > /dev/null 2>&1; then
    echo "✅ Backend server started successfully"
    ...
```

This part works perfectly — the server starts, MongoDB connects, the HTTP request succeeds.

### 3. The CI kills the server

```bash
kill $SERVER_PID 2>/dev/null
```

This sends **SIGTERM** (signal 15) to the Node.js process.

### 4. `wait` returns 143

```bash
wait $SERVER_PID 2>/dev/null
```

The `wait` command returns the **exit status of the waited process**. When a process is killed by SIGTERM, its exit status is `128 + signal_number = 128 + 15 = 143`.

### 5. `set -e` causes immediate exit

**This is the critical part.** GitHub Actions runs every bash step with:

```bash
set -eo pipefail
```

This means: **if any command returns a non-zero exit code, the script immediately exits with that code.**

So when `wait $SERVER_PID` returns 143, `set -e` triggers and the script exits with 143 **before reaching `exit 0`**.

```
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null    ← returns 143
                                   set -e triggers here
                                   script exits with 143
exit 0                          ← NEVER REACHED
```

---

## The Fix

Added `|| true` after `wait` to prevent the SIGTERM exit code from triggering `set -e`:

```bash
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null || true
exit 0
```

**How `|| true` works:**
- `wait $SERVER_PID` returns 143 (failure)
- `|| true` catches the failure and replaces it with exit code 0 (success)
- `set -e` sees exit code 0, does NOT trigger
- `exit 0` is reached and executes normally

This is the **standard and documented** way to handle intentionally-killed background processes in bash scripts that run under `set -e`.

---

## Why This Is Correct

| Approach | Verdict | Reason |
|----------|---------|--------|
| `wait ... \|\| true` | ✅ **Used** | Standard bash pattern. Explicitly documents that the non-zero exit is expected and intentional. |
| Remove `set -e` | ❌ | Would hide ALL errors in the script, including actual failures. |
| Use `trap` | ❌ | Overkill for this simple case. |
| Don't kill the server | ❌ | The server would keep running and GitHub Actions would eventually kill it with SIGKILL (exit 137), which is worse. |
| Use `kill -0` to check | ❌ | Doesn't solve the core issue of `wait` returning 143. |

---

## Files Modified

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | Added `\|\| true` after both `wait $SERVER_PID` calls in the Backend startup step |

---

## Verification

After this fix, the Backend CI step should:

1. Start the Node.js server in the background ✅
2. Wait for MongoDB to be ready (via service container health check) ✅
3. Detect the server is responding on port 5000 ✅
4. Print the success message ✅
5. Kill the server with SIGTERM ✅
6. Wait for the process to exit (returning 143) ✅
7. `|| true` prevents `set -e` from triggering ✅
8. `exit 0` is reached ✅
9. Step passes with exit code 0 ✅

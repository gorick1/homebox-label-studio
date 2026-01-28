# Login Error Fix - Summary

## Problem

You were getting a 500 error when trying to login to the label designer.

## Root Cause

The Homebox API returns a 500 status code when authentication fails (instead of the standard 401). This wasn't being handled gracefully, and the error message wasn't helpful.

## What Was Fixed

### 1. **Better Error Handling** (src/lib/api.ts)
   - Now catches 500 errors and translates them to a user-friendly message
   - Displays: "Invalid username or password. Please check your credentials and try again."
   - Better error messages for other failure scenarios

### 2. **Improved Login UI** (src/pages/Login.tsx)
   - Changed label from "Email" to "Username" 
   - Added helpful hint: "Your Homebox username (not email address)"
   - Changed input type to `text` instead of `email` for username
   - Uses proper autocomplete attribute

### 3. **Documentation**
   - Created comprehensive LOGIN_TROUBLESHOOTING.md guide
   - Includes credential checking procedures
   - Network diagnostic steps

## How to Login

1. **Navigate to**: https://labels.garrettorick.com
2. **Enter your Homebox username** (NOT email address)
3. **Enter your password**
4. **Click Sign In**

## If You Still Get an Error

**Most Common Issue: Wrong Credentials**
- Double-check your Homebox username (case-sensitive)
- Verify password by logging into Homebox directly at https://homebox.garrettorick.com
- Usernames are different from email addresses

**To Find Your Username:**
1. Login to Homebox directly: https://homebox.garrettorick.com
2. Go to user profile/settings
3. Your username is displayed there

**To Check if Services are Running:**
```bash
# Check all containers
sudo docker compose ps

# Should show: homebox, label-designer, caddy all running

# Check logs for errors
sudo docker compose logs homebox --tail=20
sudo docker compose logs label-designer --tail=20
```

## Changes Made

| File | Change | Impact |
|------|--------|--------|
| `src/lib/api.ts` | Better error handling for 500 status | Users see helpful error message |
| `src/pages/Login.tsx` | Username field + helper text | Clearer what credential is needed |
| `docs/LOGIN_TROUBLESHOOTING.md` | New guide | Easy debugging reference |

## Container Status

All containers rebuilt and running:
- ✅ homebox (Inventory service)
- ✅ label-designer (React app with fixes)
- ✅ caddy (Reverse proxy)
- ✅ homebox-companion (Support service)
- ✅ homebox-print-addon (Print server)

## Try Now

1. Clear your browser cache (or use incognito)
2. Go to https://labels.garrettorick.com
3. Enter your Homebox username (not email)
4. Enter your password
5. Click Sign In

You should now see a helpful error message if credentials are wrong, instead of just "500 error".

---

## For Reference

**If you need to debug further:**
- See `docs/LOGIN_TROUBLESHOOTING.md` for complete troubleshooting guide
- Check container logs: `sudo docker compose logs --tail=50`
- Test API directly from inside container: See troubleshooting guide

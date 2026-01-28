# Login Troubleshooting Guide

## Error: "500 Internal Server Error" When Logging In

This typically means one of two things:

### Issue 1: Invalid Username or Password (Most Common)

**Symptoms:**
- "Invalid username or password" error displayed on login page
- Nginx logs show 500 error from Homebox API

**Solution:**
1. Make sure you're using the correct Homebox username (not email necessarily)
2. Verify your password is correct
3. Try logging into Homebox directly at https://homebox.garrettorick.com to confirm credentials work
4. Note: Usernames are case-sensitive

**Note about Homebox API behavior:**
The Homebox API returns a 500 status code for invalid credentials instead of the standard 401. This has been fixed in the label designer to provide a clearer error message.

---

### Issue 2: Homebox Service Not Running

**Check if Homebox is healthy:**
```bash
sudo docker compose ps

# Should show:
# homebox                 ... Up ...
```

**Check Homebox logs for errors:**
```bash
sudo docker compose logs homebox --tail=30
```

**If Homebox crashed:**
```bash
sudo docker compose up -d homebox
```

---

### Issue 3: Network/Proxy Issues

**Check if label-designer can reach Homebox:**
```bash
sudo docker compose exec -T label-designer sh -c \
  "wget -O - --post-data='{\"username\": \"admin\", \"password\": \"password\"}' \
   --header='Content-Type: application/json' \
   http://homebox:7745/api/v1/users/login 2>&1" | head -20
```

**Check Nginx proxy configuration:**
```bash
# Look for /homebox/ location block
cat nginx.conf | grep -A 5 "/homebox/"
```

---

## How to Find Your Homebox Username

If you're not sure of your username:

1. **Access Homebox directly:**
   - Go to https://homebox.garrettorick.com
   - Login with your credentials
   - Your username is shown in the top-right user menu

2. **Check Homebox container logs:**
   ```bash
   sudo docker compose logs homebox | grep -i "user\|login"
   ```

3. **Default credentials (if you haven't changed them):**
   - Username: `admin`
   - Password: check your initial setup notes

---

## Login Flow Diagram

```
1. User enters username + password in label designer
                           ↓
2. Label designer sends POST to /homebox/api/v1/users/login
                           ↓
3. Nginx proxies to http://homebox:7745/api/v1/users/login
                           ↓
4. Homebox validates credentials
                           ↓
   Success: Returns token + 200 OK
   Failure: Returns 500 (should be 401, Homebox quirk)
                           ↓
5. Label designer stores token in localStorage
                           ↓
6. All subsequent requests include token in headers
```

---

## Error Messages and Meanings

| Message | Cause | Solution |
|---------|-------|----------|
| "Invalid username or password" | Wrong credentials | Verify Homebox login works |
| "Authentication failed: 500" | Homebox error | Check Homebox logs |
| "Network error" | Can't reach Homebox | Check Docker network |
| "No authentication token received" | Homebox not configured | Check Homebox setup |

---

## Testing Authentication Manually

**From label-designer container:**
```bash
sudo docker compose exec -T label-designer sh -c \
  "wget -O - --post-data='{\"username\": \"YOUR_USERNAME\", \"password\": \"YOUR_PASSWORD\"}' \
   --header='Content-Type: application/json' \
   http://homebox:7745/api/v1/users/login 2>&1"
```

**Expected response (on success):**
```json
{
  "token": "eyJ...",
  "expiresAt": "...",
  ...
}
```

**If you get a 500 error:**
- Try credentials with the Homebox web UI first
- Check Homebox container is running: `sudo docker compose ps homebox`
- Check Homebox logs: `sudo docker compose logs homebox --tail=50`

---

## Complete Credential Check

```bash
# 1. Verify Homebox is running
sudo docker compose ps homebox

# 2. Check Homebox is healthy
sudo docker compose logs homebox | tail -10

# 3. Try to authenticate from label-designer
sudo docker compose exec -T label-designer sh -c \
  "wget -qO - --post-data='{\"username\": \"admin\", \"password\": \"password\"}' \
   --header='Content-Type: application/json' \
   http://homebox:7745/api/v1/users/login"

# 4. Should return JSON with token if successful
```

---

## Quick Debug Checklist

- [ ] Username is correct (check Homebox user profile)
- [ ] Password is correct (test on Homebox web UI)
- [ ] Homebox container is running (`docker compose ps`)
- [ ] Homebox is healthy (check logs, no crashes)
- [ ] Network connectivity (can reach http://homebox:7745)
- [ ] Browser allows localStorage (no incognito/private mode)

---

## Still Having Issues?

Check these files for clues:

```bash
# Label designer logs
sudo docker compose logs label-designer --tail=50

# Homebox logs
sudo docker compose logs homebox --tail=50

# All service logs
sudo docker compose logs --tail=50
```

Common patterns in logs:
- `invalid username or password` → Bad credentials
- `connection refused` → Service not running
- `500 Internal Server Error` → Homebox issue or invalid credentials

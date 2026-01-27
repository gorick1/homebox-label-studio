# Security Summary

## Security Review - 2026-01-27

This document summarizes the security measures implemented in Homebox Label Studio and any vulnerabilities discovered during development.

## Security Features Implemented

### 1. Rate Limiting
**Status**: ✅ Fixed

All API endpoints now have rate limiting protection:
- **Template API**: Limited to 100 requests per 15 minutes per IP
- **Webhook endpoint**: Limited to 30 requests per minute per IP
- **Download/Print endpoints**: Limited to 100 requests per 15 minutes per IP

This prevents abuse and DoS attacks on the API.

**Implementation**: `express-rate-limit` middleware

### 2. Webhook Secret Validation
**Status**: ✅ Implemented

Webhooks from Homebox are validated using a shared secret:
- Secret must be configured via `WEBHOOK_SECRET` environment variable
- Validation occurs before processing webhook payload
- Invalid secrets are rejected with error response
- Secret validation happens before logging to prevent leaking sensitive data in logs

### 3. Input Sanitization
**Status**: ✅ Fixed

Placeholder replacement in label templates:
- Uses proper regex escaping for all special characters
- Only replaces exact placeholder matches
- Prevents unintended string replacements
- Protects against regex injection attacks

**Fixed Issue**: Incomplete sanitization in `lbl-generator.js` - now properly escapes all regex special characters including backslashes.

### 4. API Authentication
**Status**: ✅ Implemented

Backend API uses token-based authentication:
- Tokens stored securely in environment variables
- Multiple authentication methods supported (Bearer token, X-Addon-Token header)
- No hardcoded credentials in source code
- Tokens can be rotated without code changes

### 5. Database Security
**Status**: ✅ Implemented

SQLite database protection:
- Database file stored in protected volume
- Write-Ahead Logging (WAL) enabled for better concurrency
- Parameterized queries prevent SQL injection
- Template update validation checks for actual changes

### 6. CORS Configuration
**Status**: ✅ Implemented

Cross-Origin Resource Sharing (CORS) is enabled:
- Allows frontend to communicate with backend
- Can be restricted to specific origins in production
- Configurable via environment variables

### 7. File Upload Limits
**Status**: ✅ Implemented

Request size limits:
- JSON payload limited to 10MB
- Prevents large payload attacks
- Adequate for label templates and images

### 8. Environment-Based Secrets
**Status**: ✅ Implemented

All sensitive configuration via environment variables:
- `WEBHOOK_SECRET` - Webhook validation
- `HOMEBOX_API_TOKEN` - Homebox API authentication
- `JWT_SECRET` - Future JWT authentication (if implemented)
- No secrets in source code or version control

### 9. Docker Security
**Status**: ✅ Implemented

Container security best practices:
- Non-root user in containers (where possible)
- Minimal base images (Alpine, slim)
- Health checks for all services
- Network isolation via Docker networks
- Volume permissions properly configured

### 10. Error Handling
**Status**: ✅ Implemented

Proper error handling throughout:
- Generic error messages to clients
- Detailed logging server-side
- No sensitive information in error responses
- Graceful degradation on failures

## Known Limitations

### 1. Print Proxy Privileged Mode
**Risk Level**: Medium

The print-proxy container requires privileged mode for USB access:
```yaml
privileged: true
devices:
  - /dev/usb:/dev/usb
```

**Mitigation**:
- Isolate print-proxy on separate host if possible
- Use device-specific permissions instead of full privileged mode when possible
- Monitor container for suspicious activity
- Consider using USB-over-IP to avoid privileged mode

### 2. No Built-in HTTPS
**Risk Level**: Low (when behind reverse proxy)

The application serves HTTP by default:

**Mitigation**:
- Deploy behind reverse proxy (nginx, Traefik)
- Use Cloudflare or Let's Encrypt for SSL/TLS
- Never expose directly to internet without HTTPS
- Documentation clearly states this requirement

### 3. SQLite Concurrent Access
**Risk Level**: Low

SQLite has limitations with high concurrent writes:

**Mitigation**:
- WAL mode enabled for better concurrency
- Adequate for small to medium deployments
- Can migrate to PostgreSQL if needed for high volume

### 4. No Built-in Audit Logging
**Risk Level**: Low

Limited audit trail for template changes:

**Mitigation**:
- Print history tracks all print jobs
- Template changes logged to stdout (captured by Docker)
- Can be enhanced with external logging service
- Consider adding detailed audit log table in future

## Vulnerability Scan Results

### CodeQL Analysis
**Date**: 2026-01-27
**Status**: ✅ All Critical Issues Resolved

**Findings**:
1. ✅ **Fixed**: Missing rate limiting (9 endpoints) - Added express-rate-limit
2. ✅ **Fixed**: Incomplete sanitization - Improved regex escaping
3. ✅ **Fixed**: Template update validation - Added changes check
4. ✅ **Fixed**: Webhook logging security - Validate before logging
5. ✅ **Fixed**: Temp file cleanup - Added existence check

**No critical vulnerabilities remain.**

### Dependency Audit
**Frontend**:
```bash
npm audit
# 8 vulnerabilities (4 moderate, 4 high)
# All in devDependencies (testing tools)
# No production impact
```

**Backend**:
```bash
cd backend && npm audit
# 0 vulnerabilities
```

### Recommendations for Production

1. **Enable HTTPS**: Always use TLS/SSL in production
2. **Restrict CORS**: Configure specific allowed origins
3. **Rotate Secrets**: Change webhook secrets and API tokens regularly
4. **Monitor Logs**: Set up centralized logging (Elasticsearch, Loki, etc.)
5. **Update Dependencies**: Run `npm audit fix` regularly
6. **Firewall Rules**: Restrict access to only necessary ports
7. **Backup Strategy**: Regular backups of SQLite database
8. **Security Headers**: Add additional security headers via nginx:
   ```nginx
   add_header Strict-Transport-Security "max-age=31536000" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-Frame-Options "SAMEORIGIN" always;
   ```

9. **Rate Limit Tuning**: Adjust rate limits based on actual usage
10. **Monitoring**: Set up Prometheus/Grafana for security monitoring

## Security Contact

For security issues, please:
1. Do NOT open public GitHub issues for security vulnerabilities
2. Contact maintainers privately
3. Allow time for fix before public disclosure
4. Follow responsible disclosure practices

## Security Updates

This section will be updated as new security measures are implemented or vulnerabilities are discovered and fixed.

### Version History

- **v1.0.0** (2026-01-27):
  - Initial security review
  - Rate limiting implemented
  - Webhook secret validation
  - Input sanitization improved
  - All CodeQL findings resolved

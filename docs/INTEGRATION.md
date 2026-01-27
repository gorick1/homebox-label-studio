# Homebox Integration Guide

This guide explains how to integrate Homebox Label Studio with your Homebox instance to enable automatic label printing.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Actions                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │                                      │
    ┌────▼─────┐                         ┌─────▼──────┐
    │ Homebox  │                         │  Homebox   │
    │  Web UI  │                         │ Companion  │
    └────┬─────┘                         └─────┬──────┘
         │                                      │
         │         Create Item                  │ Scan & Create
         └──────────────┬─────────────────────┘
                        │
                   ┌────▼─────┐
                   │ Homebox  │
                   │   API    │
                   └────┬─────┘
                        │
                        │ Webhook: Item Created
                        ▼
              ┌─────────────────────┐
              │ Label Studio        │
              │ Backend             │
              │                     │
              │ 1. Receive webhook  │
              │ 2. Fetch item data  │
              │ 3. Get template     │
              │ 4. Generate label   │
              └────────┬────────────┘
                       │
                       │ Send .lbl file
                       ▼
              ┌─────────────────────┐
              │  Print Proxy        │
              │  (DYMO Printer)     │
              └─────────────────────┘
```

## Prerequisites

- Homebox instance running (v0.10.0 or later)
- Label Studio deployed and accessible
- Print server configured
- Admin access to Homebox

## Step 1: Configure Label Studio

1. **Set environment variables** in `.env`:

```env
# Backend Configuration
AUTO_PRINT_ON_CREATE=true
WEBHOOK_SECRET=your-secure-random-secret
HOMEBOX_API_TOKEN=your-homebox-api-token

# API URLs (adjust for your setup)
HOMEBOX_API_URL=http://homebox:7745
PRINT_PROXY_URL=http://print-proxy:5000
```

2. **Generate a secure webhook secret**:
```bash
openssl rand -hex 32
```

3. **Get your Homebox API token**:
   - Log into Homebox
   - Go to User Settings → API Tokens
   - Create a new token
   - Copy the token value

4. **Restart Label Studio backend**:
```bash
docker-compose restart backend
```

## Step 2: Configure Homebox Webhooks

### Option A: Using Environment Variables (Recommended)

Add to your Homebox docker-compose or environment:

```yaml
environment:
  - HBOX_WEBHOOK_URL=http://backend:3001/webhook/item-created
  - HBOX_WEBHOOK_SECRET=your-secure-random-secret
  - HBOX_WEBHOOK_EVENTS=item.created
```

### Option B: Using Homebox UI (if available)

1. Log into Homebox as admin
2. Navigate to Settings → Integrations
3. Add new webhook:
   - **URL**: `http://backend:3001/webhook/item-created`
   - **Secret**: Your webhook secret
   - **Events**: Select "Item Created"
   - **Active**: Yes

### Option C: Using Homebox API

```bash
curl -X POST http://homebox:7745/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_HOMEBOX_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://backend:3001/webhook/item-created",
    "secret": "your-secure-random-secret",
    "events": ["item.created"],
    "active": true
  }'
```

## Step 3: Create Default Label Template

1. **Access Label Studio** at http://localhost:8080

2. **Design your label**:
   - Choose label size (DYMO 30334, 30252, etc.)
   - Add text elements with placeholders:
     - `{item_name}` - Item name
     - `{location}` - Location path
     - `{asset_id}` - Asset ID
     - `{quantity}` - Quantity
   - Add QR code with: `https://homebox.example.com/item/{item_id}`
   - Add barcode with: `{asset_id}`

3. **Save the template**:
   - Click "Save Template"
   - Give it a descriptive name
   - Click "Set as Default"

## Step 4: Test the Integration

### Manual Test via API

```bash
# Test webhook endpoint
curl -X POST http://localhost:3001/webhook/item-created \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your-secure-random-secret",
    "item": {
      "id": "test-item-123",
      "name": "Test Item",
      "description": "This is a test",
      "location": {
        "name": "Test Location",
        "path": "Storage > Shelf A"
      },
      "quantity": 5,
      "assetId": "TEST-001"
    }
  }'
```

### Test by Creating Item in Homebox

1. Go to Homebox UI
2. Create a new item
3. Fill in required fields
4. Save the item
5. Check Label Studio logs:
```bash
docker-compose logs -f backend
```

You should see:
```
Webhook received: {...}
Auto-printed label for item xxx
```

## Step 5: Monitor and Troubleshoot

### Check Print History

```bash
curl http://localhost:3001/api/print-history
```

Or view in Label Studio UI → Print History

### Common Issues

#### Webhook Not Received

**Symptoms**: No logs in backend when creating items

**Solutions**:
1. Verify Homebox webhook configuration
2. Check network connectivity between containers:
```bash
docker-compose exec homebox ping backend
```
3. Verify webhook URL is correct
4. Check Homebox logs for webhook errors

#### Authentication Errors

**Symptoms**: "Failed to fetch item" in logs

**Solutions**:
1. Verify `HOMEBOX_API_TOKEN` is correct
2. Check token hasn't expired
3. Ensure token has read permissions

#### Template Not Found

**Symptoms**: "No template available for printing"

**Solutions**:
1. Create at least one template in Label Studio
2. Set a template as default
3. Or specify `templateId` in webhook payload

#### Print Failures

**Symptoms**: Label generated but not printed

**Solutions**:
1. Check print-proxy logs:
```bash
docker-compose logs -f print-proxy
```
2. Verify DYMO printer is connected and recognized
3. Test printer directly:
```bash
lpstat -p -d  # List printers
```

## Advanced Configuration

### Custom Template per Item Type

You can specify different templates based on item properties:

```javascript
// In Homebox custom integration script
{
  "templateId": item.labels.includes("electronics") 
    ? "tpl_electronics" 
    : "tpl_default"
}
```

### Batch Printing

To print multiple labels at once:

```bash
curl -X POST http://localhost:3001/api/batch-print \
  -H "Content-Type: application/json" \
  -d '{
    "itemIds": ["item1", "item2", "item3"],
    "templateId": "tpl_default",
    "copies": 2
  }'
```

### Webhook Retry Logic

Homebox typically retries failed webhooks. Configure retry behavior:

```yaml
environment:
  - HBOX_WEBHOOK_RETRY_COUNT=3
  - HBOX_WEBHOOK_RETRY_DELAY=5
```

### Conditional Printing

Disable auto-print and manually trigger:

```env
AUTO_PRINT_ON_CREATE=false
```

Then print via API when needed:
```bash
curl -X POST http://localhost:3001/api/print-label \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "item_123",
    "templateId": "tpl_default"
  }'
```

## Security Considerations

1. **Use strong webhook secrets**:
   - Minimum 32 characters
   - Random generation
   - Rotate periodically

2. **Network isolation**:
   - Keep services on internal Docker network
   - Only expose necessary ports
   - Use reverse proxy for external access

3. **API token security**:
   - Store in environment variables
   - Never commit to version control
   - Use least-privilege principle

4. **SSL/TLS**:
   - Use HTTPS for external webhooks
   - Configure Cloudflare or Let's Encrypt
   - Validate SSL certificates

## Monitoring and Logging

### Enable Debug Logging

```env
LOG_LEVEL=debug
```

### Prometheus Metrics

Add to docker-compose.yml:
```yaml
backend:
  environment:
    - ENABLE_METRICS=true
  ports:
    - "9090:9090"  # Metrics endpoint
```

### Log Aggregation

Ship logs to external service:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Review print history: http://localhost:3001/api/print-history
3. Test connectivity between services
4. Consult API documentation in `docs/API.md`
5. Open GitHub issue with logs and configuration

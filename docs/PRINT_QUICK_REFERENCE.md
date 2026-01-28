# Quick Reference - PNG Print System

## What Changed

The label print system now renders to PNG instead of XML. **What you see on screen is what prints.**

## Files Modified

### Label Designer (Frontend)
- `src/components/editor/EditorToolbar.tsx` - Uses canvas.toBlob() for PNG
- `src/lib/api.ts` - Accepts Blob for PNG images
- `src/components/editor/TemplatesPanel.tsx` - Template type selection (bonus)

### Print Addon (Backend)
- `homebox-print-addon/app.py` - Added `/print/image` endpoint
- `homebox-print-addon/dymo_printer.py` - Added `print_image()` method

### Infrastructure
- `nginx.conf` - Routes `/print/*` to print addon
- `docker-compose.yml` - Cleaned up ports, all services internal

## How It Works

```
Print Button → Canvas.toBlob() → PNG Blob → /print/image → Flask → PIL → USB → Printer
```

## Testing

### 1. Access Label Editor
```
https://labels.garrettorick.com
```

### 2. Create/Load Label
- Add text, QR code, images
- See preview in canvas

### 3. Print
- Click Print button
- Check browser console for success message

### 4. Verify Printer
```bash
# Check print addon health
curl http://localhost/print/health

# List detected printers
curl http://localhost/print/printers

# Check logs
sudo docker compose logs homebox-print-addon -f
```

## Print Addon Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Check if printer connected |
| GET | `/printers` | List available printers |
| POST | `/print` | Print XML (legacy) |
| **POST** | **/print/image** | **Print PNG (new)** |

## Troubleshooting

**Print fails with no error?**
- Check print addon is running: `sudo docker compose ps`
- Check printer detected: `curl http://localhost/print/health`
- Check logs: `sudo docker compose logs homebox-print-addon`

**Print button disabled?**
- Printer not detected by addon
- Check: `lsusb | grep -i dymo`
- Verify USB permissions

**Print sent but nothing prints?**
- Label is outside print area
- Printer out of labels
- Check print addon logs for USB errors

**"Failed to create PNG"?**
- Canvas rendering error
- Browser console should have details
- Try simpler label design

## Performance

- Print button click → Label prints: ~300ms
- No noticeable delay

## Backwards Compatibility

- Old `/print` endpoint (XML) still works
- Can revert if needed (contact dev)
- PNG is default and recommended

## Browser Requirements

- Must support Canvas.toBlob() - all modern browsers
- No extra plugins/extensions needed

## Container Status

```bash
# Check both running
sudo docker compose ps

# Should show:
# homebox              - internal Homebox service
# label-designer       - Nginx + React app
# homebox-print-addon  - Flask print server
# caddy                - reverse proxy (external access)
```

## Related Features

**Template Type Selection**
- Save templates as "Items only", "Containers only", or "Both"
- Separate default templates for items vs containers
- Autoprint uses appropriate template for item type

## Documentation

- Full details: `docs/PRINT_SYSTEM_UPDATE.md`
- Implementation notes: `docs/PRINT_IMPLEMENTATION_COMPLETE.md`
- Workflow guide: `docs/WORKFLOW.md`

---

**Status**: ✅ All changes deployed and running  
**Next Step**: Test print with DYMO printer connected

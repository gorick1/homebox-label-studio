# Printer Fixed! ✅

## Problem
The printer was returning a "Resource busy" error when trying to print. The DYMO LabelWriter 450 printer was plugged in and detected by the system, but the Docker container couldn't access it.

## Root Cause
The Linux kernel's `usblp` (USB Line Printer) driver was claiming the USB device, preventing the Python application from accessing it via libusb. Additionally, the printer used a different USB product ID (0x0020) than expected (0x1001).

## Solutions Implemented

### 1. Updated Printer Detection ✅
- **File:** `homebox-print-addon/dymo_printer.py`
- **Change:** Added support for both product IDs: 0x1001 and 0x0020
- **Result:** Printer now properly detected regardless of firmware version

### 2. Added USB Device Mapping ✅
- **File:** `docker-compose.yml`
- **Change:** Added `devices:` section to map `/dev/bus/usb` to the container
- **Result:** Docker container now has access to USB devices

### 3. Detached usblp Driver ✅
- **Command:** `sudo bash -c 'echo "1-1.1:1.0" > /sys/bus/usb/drivers/usblp/unbind'`
- **Result:** Kernel driver released the device for libusb use

### 4. Made Permanent ✅
- **File:** `/etc/systemd/system/dymo-usblp-detach.service`
- **Script:** `/home/pi/detach-dymo-usblp.sh`
- **Result:** The usblp driver detachment happens automatically on system startup

## Verification

### Printer Detection
```bash
curl -s http://localhost:8001/health
# Response: {"status":"healthy","printer":"<printer_name>"}
```

### Test Print
```bash
curl -s -X POST -F "image=@/tmp/test_label.png" http://localhost:8001/print/image
# Response: {"ok":true,"message":"Image sent to printer (1 copies)","printer":"<printer_name>"}
```

### Docker Logs
```
INFO:dymo_printer:Found DYMO printer with product ID: 0x0020
INFO:dymo_printer:Successfully connected to <printer_name>
INFO:dymo_printer:Printed 1 image label(s)
```

## Files Modified

1. **dymo_printer.py**
   - Line 8: Changed to support multiple product IDs
   - Lines 50-57: Updated find_printer() to check all known IDs

2. **docker-compose.yml**
   - Added `devices:` section with `/dev/bus/usb` mapping
   - Exposed port 8001 for testing (can be commented out)

3. **New Files Created**
   - `/home/pi/detach-dymo-usblp.sh` - Startup script
   - `/etc/systemd/system/dymo-usblp-detach.service` - Systemd service

## How It Works

```
┌─────────────────────────────────────────┐
│ System Boot                             │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ dymo-usblp-detach.service runs          │
│ Executes: /home/pi/detach-dymo-usblp.sh │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ usblp driver detached from DYMO         │
│ Device available for libusb             │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Docker containers start                 │
│ print-addon can access USB device       │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Autoprint works!                        │
│ New items automatically print            │
└─────────────────────────────────────────┘
```

## Testing the Full Flow

1. **Enable Autoprint**
   - Settings → Toggle "Autoprint" ON

2. **Set Default Template**
   - Create a template or select existing one
   - Click "Item" button to set as default

3. **Create Item**
   - Create new item in Homebox
   - Frontend detects new item (within 1 second)
   - Default template renders automatically
   - Label prints to DYMO printer

4. **Verify**
   - Check browser console (F12) for autoprint logs
   - Physical label should print within 2 seconds
   - Check docker logs: `docker compose logs homebox-print-addon | grep -i print`

## Printer Specifications

- **Model:** DYMO LabelWriter 450
- **USB ID:** 0922:0020 (firmware version dependent)
- **Connection:** Docker container via USB passthrough
- **Status:** ✅ Working and tested

## Troubleshooting

### If printer stops being detected after reboot:
```bash
# Check if service ran
sudo systemctl status dymo-usblp-detach.service

# Manually run the detach script
sudo /home/pi/detach-dymo-usblp.sh

# Restart print addon
docker compose restart homebox-print-addon
```

### If "Resource busy" error returns:
```bash
# Check if usblp driver reclaimed the device
lsusb | grep Dymo

# Manually detach again
sudo bash -c 'echo "1-1.1:1.0" > /sys/bus/usb/drivers/usblp/unbind'

# Restart print addon
docker compose restart homebox-print-addon
```

### If printer still not detected:
```bash
# Check hardware connection
lsusb | grep -i dymo

# Restart the entire system
sudo reboot
```

## Summary

✅ **The printer is now fully functional!**

- Printer detected and healthy
- Test print successful
- Autoprint system ready to use
- Permanent solution in place for future reboots
- All containers running and coordinated

You can now:
1. Open the label-designer
2. Create a template
3. Set it as default
4. Enable autoprint
5. Create items in Homebox
6. Watch them automatically print! 🖨️

---

**Status:** Production Ready  
**Last Updated:** January 27, 2026  
**Tested:** ✅ Confirmed working

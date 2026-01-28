# CUPS IPP Server Setup

The CUPS server has been added to your docker-compose.yml. It provides IPP (Internet Printing Protocol) support which Home Assistant can discover.

## Starting CUPS

```bash
cd /home/pi/homebox-label-studio
sudo docker compose up -d cups
```

## Configuring the DYMO Printer in CUPS

1. **Access CUPS Web Interface**: Open `http://localhost:631` in your browser

2. **Add Printer**:
   - Go to "Administration" > "Add Printer"
   - Select your DYMO 30334 printer from USB devices
   - Set name to `DYMO-450` or similar
   - Make it "Shared" so it's discoverable by Home Assistant

3. **Allow Remote Access** (for Home Assistant):
   - CUPS by default only allows localhost access
   - To allow network access, the CUPS container needs updated configuration

## For Home Assistant Integration

Home Assistant can discover IPP printers on the network. Add the printer by:

1. In Home Assistant, go to Settings > Integrations > "Create Automation"
2. Search for "Printing" or "IPP"
3. It should discover `DYMO-450 @ print-server` on port 631

## Troubleshooting

If Home Assistant can't see the printer:
- Ensure CUPS container is running: `sudo docker compose ps cups`
- Check CUPS logs: `sudo docker logs cups-server`
- Make sure the DYMO printer is connected via USB
- Try accessing `http://<pi-ip>:631` directly from another machine

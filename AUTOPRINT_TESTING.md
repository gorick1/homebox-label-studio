# Autoprint Testing Guide

## Quick Start

1. **Open the label-designer**
   - Go to http://localhost/
   - Login with your credentials

2. **Create a template**
   - Create a simple label template with text elements
   - Use placeholders like `{item_name}`, `{item_id}`, `{location}`, `{quantity}`
   - Example: "Item: {item_name} (ID: {item_id})"

3. **Set default templates**
   - In the toolbar, you should see "Item" and "Container" buttons
   - Click "Item" to set this template as the default for items
   - Create another template and set it as "Container" default for locations

4. **Enable autoprint**
   - Go to settings (gear icon in the toolbar)
   - Toggle "Autoprint" ON
   - The setting will auto-save

5. **Create items to test**
   - Create items in Homebox (or via companion API)
   - Once an item is created, the frontend will:
     - Detect it within 1 second
     - Check if autoprint is enabled
     - Render the default item template with the item's data
     - Automatically send it to the DYMO printer

## How It Works

### Frontend Polling (Every 1 second)
```
1. Get autoprint setting from localStorage
2. If autoprint is disabled → skip
3. Fetch list of items from Homebox API
4. Compare with previously tracked items
5. For each NEW item detected:
   - Get the default template for that item type
   - Render template to canvas with item data
   - Convert canvas to PNG
   - Send PNG to /print/image endpoint
   - Log success/failure
```

### Data Substitution
The following placeholders are automatically replaced:
- `{item_name}` → Item name from Homebox
- `{item_id}` → Item ID from Homebox
- `{location}` → Location name (for items only)
- `{quantity}` → Item quantity (for items only)
- `{description}` → Item description

### Backend Integration
When items/locations are created in the companion:
1. Creation succeeds normally
2. Companion calls `/api/autoprint/trigger` endpoint (logs event)
3. Frontend detects new item via polling
4. Frontend renders and prints if autoprint is enabled

## Troubleshooting

### Autoprint not triggering
- Check if autoprint is enabled in settings (look for "Autoprint" toggle)
- Check if a default template is set for items (click "Item" button in toolbar)
- Check browser console (F12) for error messages
- Verify the item appears in Homebox (it may take a few seconds)

### Label not printing
- Check if DYMO printer is connected and online
- Check print addon logs: `docker compose logs homebox-print-addon`
- Verify the template has a text element with the item name

### Template not rendering
- Verify the template has at least one element
- Check that placeholders are valid (check list above)
- Check browser console for canvas rendering errors

## Browser Console
Open browser developer tools (F12) and check the Console tab for autoprint logs:
```
"New item detected: "Test Item""
"Autoprinting item "Test Item" with template "Item Label""
"Successfully printed item "Test Item""
```

## Logs to Check

### Label-designer container
```bash
docker compose logs label-designer -f
```

### Companion container (autoprint events)
```bash
docker compose logs homebox-companion -f | grep -i autoprint
```

### Print addon (printing status)
```bash
docker compose logs homebox-print-addon -f
```

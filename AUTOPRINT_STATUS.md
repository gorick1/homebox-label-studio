# Autoprint System Implementation Summary

## Current Status: PARTIALLY COMPLETE ✅ (Foundation Ready) 

The autoprint system foundation has been implemented with persistence and backend integration ready. Users can enable/disable autoprint in settings, and the system is configured to support automatic printing when items/locations are created.

## What's Implemented ✅

### Frontend (Label Designer)

1. **Settings Persistence** ✅
   - Settings stored in localStorage with key `editor_settings`
   - Contains: `autoprint` (boolean), `snapToGrid` (boolean), `showGrid` (boolean)
   - Auto-saves whenever settings change via useEffect hook
   - Survives page refreshes

2. **Settings UI** ✅
   - EditorSettingsPanel with toggle for autoprint
   - Already existed from previous implementation
   - Now automatically persists changes

3. **Autoprint Trigger Function** ✅
   - `triggerAutoprint(itemId, type)` function created in api.ts
   - Calls `/api/autoprint/trigger` endpoint on companion
   - Takes item ID and type ('item' or 'location')
   - Returns success/failure response

### Backend (Homebox Companion)

1. **Autoprint API Route** ✅
   - Created `/api/autoprint/trigger` POST endpoint
   - Registered in API router
   - Accepts: item_id, type, token
   - Validates item/location exists in Homebox

2. **Autoprint Integration** ✅
   - Item creation now calls `trigger_autoprint()` after successful item create
   - Location creation now calls `trigger_autoprint()` after successful location create
   - Errors in autoprint don't block item/location creation (graceful failure)

3. **Autoprint Function** ✅
   - Accepts token, item_id, item_type, and Homebox client
   - Fetches item/location details from Homebox API
   - Logs autoprint event for monitoring
   - Currently logs ready state (see "What's Next" below)

## Architecture Overview

```
User Creates Item/Location in Companion
    ↓
Companion creates item/location in Homebox
    ↓
Companion calls trigger_autoprint() 
    ↓
Logs autoprint event with item details
    ↓
Frontend detects new item via Homebox polling (Future)
    ↓
Frontend renders default template and prints (Future)
```

## What's NOT Implemented ❌

### Backend Rendering (Complex - Skipped for Now)
The original plan was for the companion to:
1. Fetch default template from label-designer localStorage
2. Render template with item data to PNG
3. Send PNG to print addon

**Why skipped:** Label-designer is a Vite React app without a backend API, making it difficult for the companion to access localStorage or call rendering services. This would require:
- Adding a backend API server to label-designer (Node.js/Express)
- Exposing template rendering as HTTP endpoint
- Complex cross-service communication

### Frontend Auto-Detection
Frontend currently doesn't detect new items and auto-trigger printing. This would require:
- Frontend to periodically poll Homebox API for new items
- Compare against cached list to detect new ones
- Trigger autoprint when new item detected and autoprint is enabled

## What Works Now

1. **Manual Autoprint (User Initiated)**
   - Users can manually click print in the label-designer
   - Renders with selected template and prints to DYMO

2. **Autoprint Settings**
   - Users can enable/disable autoprint in settings
   - Setting persists across browser sessions

3. **Companion Integration**
   - Items created in companion are logged for autoprint tracking
   - Error handling doesn't block item creation

4. **Print Addon**
   - PNG-to-DYMO printing works correctly
   - `/print/image` endpoint functional

## Files Modified

### Frontend Changes

**src/lib/api.ts**
- Added EditorSettings interface
- Added getSettings() function
- Added saveSettings() function  
- Added triggerAutoprint(itemId, type) function
- Added SETTINGS_STORAGE_KEY constant
- Added companionUrl to API_CONFIG

**src/hooks/useLabelEditor.ts**
- Added useEffect hook to auto-save settings
- Changed state initialization to use getSettings()
- Type changed to EditorSettings interface

### Backend Changes

**homebox-companion/server/api/__init__.py**
- Added import for autoprint router
- Added autoprint router to API

**homebox-companion/server/api/autoprint.py** (NEW FILE)
- Created with async trigger_autoprint() function
- Created /api/autoprint/trigger POST endpoint
- Fetches item/location from Homebox
- Logs autoprint event

**homebox-companion/server/api/items.py**
- Modified create_items() to call trigger_autoprint() after item creation
- Error handling prevents autoprint failures from blocking item creation

**homebox-companion/server/api/locations.py**
- Modified create_location() to call trigger_autoprint() after location creation
- Error handling prevents autoprint failures from blocking location creation

## Testing

To test the current implementation:

1. **Check Settings Persistence**
   ```
   1. Navigate to label-designer settings
   2. Enable autoprint toggle
   3. Refresh page
   4. Verify toggle is still enabled
   ```

2. **Check Backend Integration**
   ```
   1. Create item in companion
   2. Check companion logs: docker compose logs homebox-companion | grep -i autoprint
   3. Should see: "Autoprint ready for item: {item_name} (ID: {id})"
   ```

3. **Check Manual Print**
   ```
   1. Open label-designer
   2. Create template
   3. Set as default (Item or Container)
   4. Print button should work as before
   ```

## Next Steps (Priority Order)

### Option 1: Frontend-Based Autoprint (Recommended for Now)
1. Add frontend hook to detect new items from Homebox
2. When autoprint is enabled and new item detected:
   - Get default template ID from localStorage
   - Get item details from Homebox API
   - Render template with item data
   - Call /print/image to print
3. Benefits: No backend changes needed, works immediately

### Option 2: Backend Rendering (More Complex)
1. Add Express/Node backend to label-designer container
2. Expose `/api/templates/defaults/{type}` endpoint
3. Expose `/api/render-png` endpoint that:
   - Takes template and item data
   - Renders to PNG using canvas/headless browser
   - Returns PNG bytes
4. Update companion autoprint.py to:
   - Fetch default template from new endpoint
   - Call render-png endpoint  
   - Send PNG to print addon
5. Add item creation trigger that calls autoprint from companion

## Configuration

**localStorage Keys**
- `label_templates` - Stores all templates as JSON
- `default_item_template_id` - ID of default template for items
- `default_container_template_id` - ID of default template for locations
- `editor_settings` - Autoprint and other settings

**API Endpoints**
- `POST /api/autoprint/trigger` - Trigger autoprint for an item/location
- `GET/POST /api/items` - Item creation (now triggers autoprint)
- `GET/POST /api/locations` - Location creation (now triggers autoprint)

## Docker Build Info

Last successful build:
- label-designer: Rebuilt with settings persistence
- homebox-companion: Rebuilt with autoprint integration
- Build time: ~140 seconds
- All services running and healthy

## Known Limitations

1. Autoprint only logs event, doesn't actually print automatically
2. Frontend doesn't detect new items for auto-printing
3. No UI indication of autoprint status
4. No error feedback to user if autoprint fails

## Future Improvements

1. Add UI status indicator showing "Autoprint: enabled/disabled"
2. Add WebSocket support for real-time item creation notifications
3. Add audio/visual feedback when autoprint completes
4. Add autoprint history/log viewing
5. Add per-template autoprint rules (e.g., only print items in certain locations)
6. Integrate with Homebox webhooks when available

# Setting Default Templates for Printing

## What's Fixed

The default template feature now works properly. You can now:
1. Set a template as the default for **Items**
2. Set a template as the default for **Containers**
3. Get clear feedback when setting defaults
4. Defaults are saved locally so they persist across sessions

## How to Use

### Step 1: Create a Template
1. Go to the label designer
2. Design your label (add text, QR codes, etc.)
3. Click the **+** button in the Templates panel
4. Enter a name (e.g., "Standard Item Label")
5. Choose "Use For": Items / Containers / Both
6. Click "Save Template"

### Step 2: Set as Default
1. Find the template in the Templates list
2. Hover over the template
3. You'll see two buttons appear:
   - **Check mark (left)** - Set as Item default
   - **Check mark (right)** - Set as Container default
4. Click the appropriate button
5. You'll see a confirmation message

### Step 3: Verify Default
1. The template will now show badges:
   - **"Item Default"** - Used for new items
   - **"Container Default"** - Used for new containers
2. When autoprinting is enabled, these defaults will be used automatically

## Default Buttons

| Button | Purpose |
|--------|---------|
| ⭐ (Star) | Mark as favorite |
| ✓ (Left Check) | Set as default for **Items** |
| ✓ (Right Check) | Set as default for **Containers** |
| 🗑️ (Trash) | Delete template |

## Error Handling

If you see an error message:
- **"Failed to set default"** → Check browser console for details
- But the default **will still be saved locally** (in browser storage)
- Defaults persist across sessions even if backend isn't available

## Using Defaults for Autoprinting

Once you've set defaults:
1. Enable autoprint in Settings
2. Create a new item in Homebox
3. The **Item Default** template will be used automatically
4. Create a container in Homebox
5. The **Container Default** template will be used automatically

## Where Defaults Are Stored

Defaults are saved in your browser's localStorage:
- **Item default ID**: `default_item_template_id`
- **Container default ID**: `default_container_template_id`

This means:
- ✅ Defaults persist across page refreshes
- ✅ Defaults survive container restarts
- ✅ Defaults work without backend API
- ⚠️ Defaults are per-browser (not synced across devices)

## Tips

### Multiple Templates
- Create separate templates for different label styles
- Set different defaults for items vs containers
- Switch between them by loading and then clicking default

### Template Naming
- Use clear names: "Standard Item", "Small Container", etc.
- Include the intended use in the name: "4x6 Item Label"
- Avoid generic names like "Template 1"

### Resetting Defaults
- To reset, simply click the button again (it will unset the default)
- Or delete the template to clear that default

## Troubleshooting

### "Failed to set default" message
- This is a warning, but defaults still save locally
- Check browser Developer Tools → Application → localStorage
- Should see `default_item_template_id` or `default_container_template_id`

### Default doesn't appear to work
- Make sure you've actually clicked the default button
- Check that the badge appears ("Item Default" or "Container Default")
- Clear browser cache and reload if needed

### Defaults disappeared
- Likely browser cache cleared
- Recreate defaults if needed (only takes one click)
- Consider pinning important templates to avoid losing them

## Related Features

- **Template Usage Types**: Choose "Items only", "Containers only", or "Both" when saving
- **Autoprinting**: Uses defaults to automatically print labels when items are created
- **Template Favorites**: Star templates you use frequently for easy access

## FAQ

**Q: Can I have different defaults per user?**
A: Currently, defaults are per-browser. If you want per-user defaults, set them after logging in.

**Q: What if I set a template as default for both items AND containers?**
A: That's fine! One template can be the default for both - just click both default buttons.

**Q: Do I need a backend API for this to work?**
A: No! Defaults are stored locally in your browser. A backend API would be nice for syncing across devices, but it's not required.

**Q: Will I lose defaults if I clear browser data?**
A: Yes, clearing localStorage will clear the defaults. The templates themselves are fine, just the default assignment is lost.

**Q: Can I set a default without saving it as a template first?**
A: No, you must first save the design as a template, then set it as default.

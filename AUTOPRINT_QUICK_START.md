# Autoprint Quick Reference

## Enable Autoprint

1. Open label-designer: http://localhost/
2. Click settings (gear icon) 
3. Toggle "Autoprint" ON
4. Close settings (auto-saves)

## Create a Template

1. Click "Templates" panel on left
2. Click "New Template"
3. Design your label with text elements
4. Use placeholders: `{item_name}`, `{item_id}`, `{location}`, `{quantity}`, `{description}`
5. Click "Save Template" when done

## Set Default Templates

After creating templates:

1. **For Items**: 
   - Select the template in Templates panel
   - Click the **"Item"** button in toolbar
   - This template will auto-print for new items

2. **For Locations** (Containers):
   - Select the template in Templates panel  
   - Click the **"Container"** button in toolbar
   - This template will auto-print for new locations

## Test It

1. Make sure autoprint is **ON** in settings
2. Make sure you have default templates set (Item and/or Container)
3. Create a new item in Homebox
4. Label should print automatically within 1-2 seconds
5. Check browser console (F12) for logs

## What Happens

When you create an item in Homebox:
1. ✅ Item created successfully in Homebox
2. ✅ Companion detects item creation
3. ✅ Frontend polls and detects new item
4. ✅ Renders default template with item data
5. ✅ Sends to DYMO printer
6. ✅ Label prints

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Not printing | Check autoprint ON in settings |
| Still not printing | Check default template is set (Item button) |
| Template shows wrong data | Make sure placeholders are correct |
| Printer offline | Check DYMO printer connection |
| Errors in console | Take a screenshot of error for support |

## Commands

```bash
# Check all services are running
docker compose ps

# View autoprint logs
docker compose logs label-designer -f | grep -i autoprint

# Check printer logs
docker compose logs homebox-print-addon -f

# Restart label-designer
docker compose up -d label-designer

# View browser console (in-app)
Press F12 → Console tab
```

## Browser Console Commands

When you have label-designer open and browser console active (F12):

```javascript
// Check if autoprint is enabled
localStorage.getItem('editor_settings')
// Should show: {"autoprint":true,...}

// Check default templates
localStorage.getItem('default_item_template_id')
localStorage.getItem('default_container_template_id')

// View all items that will trigger autoprint
// (will show in console as they're detected)
```

## It's Working! 🎉

You'll see these messages in browser console when autoprint works:

```
New item detected: "My Item Name"
Autoprinting item "My Item Name" with template "My Template"
Successfully printed item "My Item Name"
```

---

**That's it!** Autoprint is ready to use. Just create items in Homebox and watch them print! 🖨️

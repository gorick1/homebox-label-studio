import { useEffect, useRef } from 'react';
import { fetchHomeboxItems, getDefaultTemplateId, getSettings, printLabel, getTemplate } from '@/lib/api';
import { useCallback } from 'react';

interface TrackedItem {
  id: string;
  type: 'item' | 'location';
}

/**
 * Hook that monitors Homebox for new items/locations and triggers autoprint
 * when a new item is detected and autoprint is enabled.
 * 
 * Checks every second for new items.
 */
export function useAutoprintMonitor() {
  const trackedItemsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  const renderAndPrint = useCallback(async (item: any, type: 'item' | 'location') => {
    try {
      // Get the appropriate default template
      const templateId = getDefaultTemplateId(type === 'location' ? 'container' : 'item');
      if (!templateId) {
        console.log(`No default ${type} template set, skipping autoprint`);
        return;
      }

      const template = await getTemplate(templateId);
      if (!template) {
        console.error(`Template ${templateId} not found`);
        return;
      }

      console.log(`Autoprinting ${type} "${item.name}" with template "${template.name}"`);

      // Render the template with the item data
      const canvas = document.createElement('canvas');
      const dpi = 300;
      const width = (template.size.width * dpi) / 25.4; // Convert from inches to pixels
      const height = (template.size.height * dpi) / 25.4;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }

      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      // Set up scaling for DPI
      ctx.scale(dpi / 96, dpi / 96);

      // Render each element in the template
      for (const element of template.elements) {
        // Convert inches to pixels
        const x = (element.position.x * dpi) / 25.4;
        const y = (element.position.y * dpi) / 25.4;
        const w = (element.size.width * dpi) / 25.4;
        const h = (element.size.height * dpi) / 25.4;

        if (element.type === 'text') {
          const textElement = element as any;
          ctx.font = `${textElement.font.size}px ${textElement.font.family}`;
          const color = textElement.color;
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
          
          // Substitute placeholders
          let text = textElement.content
            .replace('{item_name}', item.name || '')
            .replace('{item_id}', item.id || '')
            .replace('{location}', item.location?.name || '')
            .replace('{quantity}', item.quantity || '1')
            .replace('{description}', item.description || '');
          
          ctx.fillText(text, x, y + h);
        } else if (element.type === 'qrcode') {
          // For QR codes, we'd need a library like qrcode.js
          // For now, just note it
          console.log('QR Code rendering not yet implemented in autoprint');
        } else if (element.type === 'barcode') {
          // Barcode rendering would also need a library
          console.log('Barcode rendering not yet implemented in autoprint');
        }
      }

      // Convert canvas to PNG and print
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Failed to create canvas blob');
          return;
        }

        try {
          await printLabel(blob);
          console.log(`Successfully printed ${type} "${item.name}"`);
        } catch (err) {
          console.error(`Failed to print ${type}:`, err);
        }
      }, 'image/png');

    } catch (err) {
      console.error(`Error rendering/printing ${type}:`, err);
    }
  }, []);

  useEffect(() => {
    // Poll for new items every second
    const pollInterval = setInterval(async () => {
      try {
        const settings = getSettings();
        if (!settings.autoprint) {
          return; // Autoprint disabled
        }

        // Get current items from Homebox
        const items = await fetchHomeboxItems();
        
        // Check for new items
        for (const item of items) {
          if (!trackedItemsRef.current.has(item.id)) {
            // New item detected!
            if (isInitializedRef.current) {
              // Only trigger autoprint after initial load
              console.log(`New item detected: "${item.name}"`);
              // Determine if this is an item or location based on the data
              const isLocation = item.type === 'location' || !item.location;
              const itemType = isLocation ? 'location' : 'item';
              await renderAndPrint(item, itemType);
            }
            trackedItemsRef.current.add(item.id);
          }
        }

        // Remove deleted items from tracking
        const currentIds = new Set(items.map(item => item.id));
        trackedItemsRef.current.forEach(id => {
          if (!currentIds.has(id)) {
            trackedItemsRef.current.delete(id);
          }
        });

        // Mark as initialized after first poll
        isInitializedRef.current = true;

      } catch (err) {
        console.error('Error polling for new items:', err);
      }
    }, 1000); // Poll every second

    return () => clearInterval(pollInterval);
  }, [renderAndPrint]);
}

# Homebox Workflow Guide

## Overview

This document describes how the complete Homebox system works together to create a seamless inventory management experience with automatic label printing.

## Workflow Steps

### 1. Item Creation via Companion

The Homebox Companion provides an AI-powered interface for creating inventory items.

**User Action:**
```
User: "Add a box of pens to my inventory"
```

**Companion Processing:**
1. AI analyzes the user's natural language input
2. Extracts relevant information (item name, quantity, category, etc.)
3. Formats the data for Homebox API
4. Makes POST request to Homebox API: `POST /api/v1/items`

### 2. Homebox Stores Item

**Homebox Processing:**
1. Receives POST request from Companion
2. Validates item data
3. Stores item in database
4. Returns item details with generated ID
5. Triggers webhook/event for new item creation

### 3. Print Addon Detects New Item

The Print Addon listens for new item creation events.

**Detection Methods:**
- **Webhook**: Homebox sends webhook to Print Addon when item is created
- **Polling**: Print Addon periodically checks for new items
- **Event Stream**: Print Addon subscribes to Homebox event stream

### 4. Label Template Application

**Template Selection:**
- If item has custom template specified, use that
- Otherwise, use `DEFAULT_LABEL_TEMPLATE` from environment

**Data Merging:**
The Print Addon merges item data with template.

### 5. Label Printing

**Print Job Creation:**
1. Print Addon generates print-ready label format
2. Sends print job to DYMO printer

### 6. Label Designer (Customization)

Users can create custom label templates via the Label Designer UI.

## Configuration

### Environment Variables

**Homebox Companion:**
- `HBC_LLM_API_KEY`: OpenAI API key
- `HBC_HOMEBOX_URL`: Homebox API URL
- `HBC_LLM_MODEL`: AI model to use

**Homebox Print Addon:**
- `HOMEBOX_API_URL`: Homebox API URL
- `DYMO_PRINTER_NAME`: Name of DYMO printer
- `DEFAULT_LABEL_TEMPLATE`: Default template ID

**Label Designer:**
- `VITE_API_URL`: Print Addon API URL

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed troubleshooting steps.

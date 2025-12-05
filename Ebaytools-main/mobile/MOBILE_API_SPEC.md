# eBay Tools Mobile Data Exchange Specification

## Overview

This document defines the data exchange format between the eBay Tools Android app and the desktop applications. The format is designed to be simple, extensible, and work across different transfer methods (USB, cloud storage, email).

## Data Structure

### Manifest File (manifest.json)

The manifest file contains metadata about the export and all collected items.

```json
{
  "version": "1.0",
  "app_version": "1.0.0",
  "device_info": {
    "model": "Pixel 6",
    "android_version": "13",
    "app_version": "1.0.0"
  },
  "created_date": "2025-01-23T10:30:00Z",
  "export_id": "exp_20250123_103000",
  "items": [
    {
      "id": "item_001",
      "title": "Vintage Camera",
      "category": "Electronics",
      "condition": "Used",
      "notes": "Working condition, minor scratches on body",
      "price": "$150",
      "location": "Seattle, WA",
      "photos": [
        "photos/item_001_1.jpg",
        "photos/item_001_2.jpg",
        "photos/item_001_3.jpg"
      ],
      "metadata": {
        "captured_date": "2025-01-23T09:15:00Z",
        "gps_location": {
          "latitude": 47.6062,
          "longitude": -122.3321,
          "accuracy": 10
        },
        "voice_note": "audio/item_001_voice.m4a",
        "barcode": "1234567890",
        "custom_fields": {
          "brand": "Canon",
          "model": "AE-1"
        }
      }
    }
  ]
}
```

### Item Structure

Each item in the manifest contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier for the item |
| title | string | Yes | Item title/name |
| category | string | No | Category classification |
| condition | string | No | Item condition (New, Used, etc.) |
| notes | string | No | Text notes about the item |
| price | string | No | Suggested price |
| location | string | No | Item location |
| photos | array | Yes | Array of photo file paths (relative to manifest) |
| metadata | object | No | Additional metadata |

### Metadata Structure

Optional metadata that can be captured:

| Field | Type | Description |
|-------|------|-------------|
| captured_date | string | ISO 8601 timestamp of when item was captured |
| gps_location | object | GPS coordinates where photos were taken |
| voice_note | string | Path to voice recording file |
| barcode | string | Scanned barcode/QR code data |
| custom_fields | object | Key-value pairs for custom data |

## File Organization

### Standard Export Structure

```
mobile_export/
├── manifest.json
├── photos/
│   ├── item_001_1.jpg
│   ├── item_001_2.jpg
│   └── item_002_1.jpg
└── audio/
    └── item_001_voice.m4a
```

### ZIP Export

All files should be compressed into a single ZIP file:
- Filename: `ebay_tools_export_YYYYMMDD_HHMMSS.zip`
- Must include manifest.json at root level
- Maintain folder structure

## Transfer Methods

### 1. Direct File Transfer (USB/File Manager)
- Export to device storage
- Transfer via USB cable or file manager
- Import folder or ZIP in desktop app

### 2. Cloud Storage Integration
- Export to Google Drive, Dropbox, etc.
- Desktop app imports from cloud folder
- Automatic sync possible

### 3. QR Code Transfer (Small Collections)
- Encode manifest.json in QR code
- Photos uploaded to temporary cloud storage
- Desktop app scans QR and downloads

### 4. Email Export
- ZIP file attached to email
- Size limit considerations
- Desktop app imports from email attachment

## Photo Requirements

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### Recommended Settings
- Resolution: 1920x1920 max (to reduce file size)
- Quality: 85% JPEG compression
- Orientation: EXIF data should be included

## Android App Features

### Core Features
1. **Photo Capture**
   - Multiple photos per item
   - Built-in camera integration
   - Gallery selection

2. **Data Entry**
   - Title and category
   - Voice-to-text for notes
   - Barcode scanning
   - Custom fields

3. **Organization**
   - Projects/collections
   - Item templates
   - Bulk operations

4. **Export Options**
   - Export single item
   - Export collection
   - Export all items

### Optional Features
1. **Cloud Sync**
   - Direct integration with desktop
   - Real-time sync
   - Conflict resolution

2. **Advanced Capture**
   - Video clips
   - 360° photos
   - Document scanning

3. **AI Features**
   - On-device description generation
   - Auto-categorization
   - Price suggestions

## Desktop Integration

### Import Process
1. Desktop app reads manifest.json
2. Validates data structure
3. Shows preview of items
4. User selects items to import
5. Creates queue or gallery entries

### Data Mapping

| Mobile Field | Setup Queue Field | Gallery Field |
|--------------|-------------------|---------------|
| title | temp_title | title |
| notes | temp_description | description |
| category | category | category |
| photos | photos | photos |
| price | price | price |
| location | - | location |

## Security Considerations

1. **Data Privacy**
   - No personal data in exports
   - Optional GPS stripping
   - Secure transfer methods

2. **File Validation**
   - Verify manifest structure
   - Validate photo files
   - Sanitize text inputs

## Version Compatibility

- Version 1.0: Initial specification
- Future versions must be backward compatible
- Desktop app should handle multiple versions

## Example Implementation

### Android (Kotlin)
```kotlin
data class ExportItem(
    val id: String,
    val title: String,
    val category: String?,
    val notes: String?,
    val photos: List<String>,
    val metadata: ItemMetadata?
)

data class ExportManifest(
    val version: String = "1.0",
    val created_date: String,
    val items: List<ExportItem>
)
```

### Desktop (Python)
```python
def import_mobile_data(manifest_path):
    with open(manifest_path, 'r') as f:
        manifest = json.load(f)
    
    # Validate version
    if manifest.get('version') != '1.0':
        raise ValueError(f"Unsupported version: {manifest.get('version')}")
    
    # Process items
    for item in manifest.get('items', []):
        process_item(item)
```

## Future Enhancements

1. **Incremental Sync**
   - Track changes since last sync
   - Differential updates
   - Conflict resolution

2. **Bidirectional Sync**
   - Push processed data back to mobile
   - Update status on mobile
   - Price/description sync

3. **Multi-user Support**
   - User identification
   - Permissions
   - Collaborative features
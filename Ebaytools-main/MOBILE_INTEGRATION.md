# eBay Tools Mobile Integration Guide

## Overview

The eBay Tools ecosystem now includes mobile integration, allowing you to collect photos and item information on your Android device and seamlessly import them into the desktop applications for processing.

## System Architecture

```
          
  Android App                Desktop Apps   
                                            
  Photo Capture  Export     Mobile Import 
  Data Entry     ------->   Setup Tool    
  Organization    JSON/     Gallery Tool  
  Export          ZIP       Processor     
          
```

## Mobile App Features

### Core Functionality
- Capture multiple photos per item
- Quick data entry with voice-to-text
- Organize items into named queues
- Voice input for queue and item names
- Queue statistics (items, photos, sync status)
- Continuous capture workflow
- JSON export with full metadata

### Export Options
1. **ZIP File** - Complete package with photos and metadata
2. **Folder Export** - Direct folder structure for USB transfer
3. **Cloud Storage** - Google Drive, Dropbox integration
4. **Share** - Email, messaging apps

## Desktop Integration

### Mobile Import Tool

Launch the Mobile Import tool:

**Windows:**
```bash
python -m ebay_tools.apps.mobile_import
```

**Mac/Linux:**
```bash
python3 -m ebay_tools.apps.mobile_import
```

### Import Options

1. **Import ZIP** - Select exported ZIP file from mobile
2. **Import Folder** - Select extracted export folder
3. **Import JSON** - Import manifest.json directly

### Import Workflow

1. **Select Source**
   - Browse for mobile export (ZIP/folder/JSON)
   - Tool reads manifest and displays items

2. **Preview Items**
   - See all items with photo counts
   - Select/deselect items to import
   - View item details

3. **Export To:**
   - **Setup Queue** - Creates queue file for eBay Tools processor
   - **Gallery** - Creates gallery file for HTML gallery creator
   - **Selected Export** - Re-export selected items

## Data Exchange Format

### Manifest Structure (v2.0)
```json
{
  "version": "2.0",
  "exportDate": "2025-01-23T10:30:00.000Z",
  "deviceInfo": {
    "manufacturer": "Samsung",
    "model": "Galaxy S21",
    "androidVersion": "12"
  },
  "queues": [
    {
      "id": 1,
      "name": "Estate Sale Items",
      "createdAt": "2025-01-23T09:00:00.000Z",
      "updatedAt": "2025-01-23T10:30:00.000Z",
      "isSynced": false,
      "items": [
        {
          "id": 1,
          "name": "Vintage Camera",
          "description": "Nikon F3 with 50mm lens, working condition",
          "createdAt": "2025-01-23T09:15:00.000Z",
          "updatedAt": "2025-01-23T09:20:00.000Z",
          "images": [
            {
              "id": 1,
              "imagePath": "/storage/emulated/0/Android/data/com.ebaytools.companion/files/Pictures/IMG_001.jpg",
              "orderIndex": 0
            },
            {
              "id": 2,
              "imagePath": "/storage/emulated/0/Android/data/com.ebaytools.companion/files/Pictures/IMG_002.jpg",
              "orderIndex": 1
            }
          ]
        }
      ]
    }
  ]
}
```

### File Organization
```
mobile_export/
 manifest.json       # Item metadata
 photos/            # Item photos
    item_001_1.jpg
    item_001_2.jpg
 audio/             # Voice notes (optional)
     item_001.m4a
```

## Mobile App Setup

### Requirements
- Android 7.0 (API 24) or higher
- Camera permission
- Storage permission

### Installation
1. Download APK from releases (when available)
2. Enable "Install from Unknown Sources"
3. Install APK
4. Grant required permissions

### First Use
1. Open eBay Tools Companion app
2. Choose "Start New Queue" or "Add to Existing Queue"
3. Name your queue (text or voice input)
4. Enter item name/description (text or voice)
5. Take photos - keep adding until done with item
6. Tap "Next Item" for another item or "Done" to finish
7. View queue statistics and export when ready

## Workflow Examples

### Example 2: Quick Garage Sale Gallery

**On Mobile:**
1. Quick capture mode
2. Photo + title + price for each item
3. Export to cloud storage

**On Desktop:**
1. Import from cloud folder
2. Export directly to Gallery
3. Generate HTML gallery
4. Share link with buyers

## Advanced Features

### Batch Operations
- Select multiple items for bulk edit
- Apply categories to groups
- Set common attributes

### Templates
- Create item templates
- Quick apply common settings
- Custom field definitions

### Cloud Sync (Future)
- Real-time sync with desktop
- Automatic imports
- Bi-directional updates

## Tips and Best Practices

### Photo Tips
- Use good lighting
- Capture multiple angles
- Include size reference
- Show any defects clearly

### Organization
- Use descriptive project names
- Consistent naming conventions
- Regular exports/backups

### Performance
- Compress photos on mobile
- Export in batches for large collections
- Clear completed projects

## Troubleshooting

### Import Issues

**"No manifest.json found"**
- Ensure complete export from mobile
- Check ZIP integrity
- Verify folder structure

**"Photos not found"**
- Check relative paths in manifest
- Ensure photos exported with manifest
- Verify file permissions

### Mobile App Issues

**Camera not working**
- Check camera permissions
- Restart app
- Clear app cache

**Export failing**
- Check storage space
- Verify write permissions
- Try different export method

## Security and Privacy

### Data Protection
- All data stored locally
- No cloud sync without explicit action
- GPS data optional and removable

### Permissions
- Camera: Required for photo capture
- Storage: Required for saving photos
- Location: Optional for GPS tagging
- Microphone: Optional for voice notes

## Future Roadmap

### Planned Features
1. iOS companion app
2. Direct Wi-Fi transfer
3. Cloud sync service
4. Barcode price lookup
5. ML-powered categorization
6. Batch editing tools

### Integration Goals
- Seamless desktop sync
- Real-time collaboration
- Template marketplace
- API for third-party apps

## Developer Information

### Contributing
- Android app is open source
- Contributions welcome
- See mobile/android/README.md

### API Documentation
- Data format spec: mobile/MOBILE_API_SPEC.md
- Integration examples included
- Extensible design

## Support

For mobile integration issues:
1. Check this guide first
2. See app logs for errors
3. Report issues on GitHub
4. Include manifest.json in reports

The mobile integration makes eBay Tools even more powerful by enabling on-the-go item collection with seamless desktop processing.### Example 2: Quick Garage Sale Gallery

**On Mobile:**
1. Quick capture mode
2. Photo + title + price for each item
3. Export to cloud storage

**On Desktop:**
1. Import from cloud folder
2. Export directly to Gallery
3. Generate HTML gallery
4. Share link with buyers

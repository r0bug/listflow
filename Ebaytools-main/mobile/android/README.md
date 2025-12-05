# eBay Tools Android Companion App

## Overview

This Android app serves as a mobile companion to eBay Tools desktop application, allowing users to capture photos and item information on the go, then export for processing on desktop.

## Features

### Core Functionality
- 📸 **Multi-photo capture** per item
- 📝 **Quick data entry** with voice-to-text
- 📁 **Project organization** for different collections
- 📤 **Multiple export options** (USB, cloud, email)
- 🏷️ **Barcode scanning** for quick SKU entry
- 📍 **Location tagging** (optional)

### Key Features

1. **Photo Management**
   - Capture multiple photos per item
   - Reorder and delete photos
   - Auto-compression for smaller file sizes
   - EXIF data preservation

2. **Data Collection**
   - Title and description
   - Category selection
   - Condition notes
   - Price suggestions
   - Custom fields

3. **Export Options**
   - Export as ZIP file
   - Direct folder export
   - Cloud storage integration
   - Share via email/messaging

## Project Structure

```
app/
├── src/main/java/com/ebaytools/companion/
│   ├── MainActivity.kt
│   ├── data/
│   │   ├── models/
│   │   │   ├── Item.kt
│   │   │   ├── Project.kt
│   │   │   └── ExportManifest.kt
│   │   ├── database/
│   │   │   ├── AppDatabase.kt
│   │   │   └── ItemDao.kt
│   │   └── repository/
│   │       └── ItemRepository.kt
│   ├── ui/
│   │   ├── camera/
│   │   │   └── CameraFragment.kt
│   │   ├── items/
│   │   │   ├── ItemListFragment.kt
│   │   │   └── ItemDetailFragment.kt
│   │   ├── export/
│   │   │   └── ExportFragment.kt
│   │   └── settings/
│   │       └── SettingsFragment.kt
│   └── utils/
│       ├── ImageUtils.kt
│       ├── ExportUtils.kt
│       └── PermissionUtils.kt
├── res/
│   ├── layout/
│   ├── values/
│   └── drawable/
└── AndroidManifest.xml
```

## Development Setup

### Requirements
- Android Studio Arctic Fox or later
- Kotlin 1.5+
- Min SDK: 24 (Android 7.0)
- Target SDK: 33 (Android 13)

### Dependencies
```gradle
dependencies {
    implementation 'androidx.core:core-ktx:1.10.1'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.9.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    
    // Camera
    implementation 'androidx.camera:camera-camera2:1.2.3'
    implementation 'androidx.camera:camera-lifecycle:1.2.3'
    implementation 'androidx.camera:camera-view:1.2.3'
    
    // Database
    implementation 'androidx.room:room-runtime:2.5.2'
    implementation 'androidx.room:room-ktx:2.5.2'
    kapt 'androidx.room:room-compiler:2.5.2'
    
    // Image handling
    implementation 'com.github.bumptech.glide:glide:4.15.1'
    
    // Barcode scanning
    implementation 'com.google.mlkit:barcode-scanning:17.1.0'
    
    // JSON
    implementation 'com.google.code.gson:gson:2.10.1'
}
```

## User Interface

### Main Screens

1. **Home/Project List**
   - List of projects/collections
   - Quick add button
   - Export options

2. **Item List**
   - Grid/list view of items
   - Search and filter
   - Bulk operations

3. **Item Detail**
   - Photo carousel
   - Edit fields
   - Voice notes
   - Save/delete

4. **Camera Capture**
   - Multi-shot mode
   - Flash control
   - Gallery picker
   - Quick save

5. **Export**
   - Export preview
   - Format selection
   - Destination choice

## Data Storage

### Local Database (Room)
```kotlin
@Entity
data class Item(
    @PrimaryKey val id: String,
    val title: String,
    val category: String?,
    val condition: String?,
    val notes: String?,
    val price: String?,
    val location: String?,
    val createdDate: Long,
    val modifiedDate: Long
)

@Entity
data class Photo(
    @PrimaryKey val id: String,
    val itemId: String,
    val filePath: String,
    val orderIndex: Int,
    val isThubmnail: Boolean
)
```

### File Storage
- Photos: Internal app storage
- Exports: Shared storage for user access
- Temp files: Cache directory

## Export Implementation

### Create Export
```kotlin
fun exportItems(items: List<Item>, exportDir: File): File {
    // Create manifest
    val manifest = ExportManifest(
        version = "1.0",
        createdDate = ISO8601DateFormat.format(Date()),
        items = items.map { it.toExportItem() }
    )
    
    // Create export directory
    val exportName = "ebay_export_${timestamp}"
    val exportPath = File(exportDir, exportName)
    exportPath.mkdirs()
    
    // Copy photos
    items.forEach { item ->
        copyItemPhotos(item, exportPath)
    }
    
    // Write manifest
    val manifestFile = File(exportPath, "manifest.json")
    manifestFile.writeText(gson.toJson(manifest))
    
    // Create ZIP
    return createZip(exportPath)
}
```

## Permissions

Required permissions:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## Integration with Desktop

### Transfer Methods

1. **USB Transfer**
   - Save to Downloads folder
   - User transfers via cable
   - Desktop imports folder/ZIP

2. **Cloud Storage**
   - Google Drive API integration
   - Dropbox SDK
   - OneDrive support

3. **Direct Share**
   - Share intent for ZIP file
   - Email, messaging apps
   - Nearby Share

## UI Design Guidelines

### Material Design 3
- Dynamic color theming
- Rounded corners
- Elevated surfaces
- Clear typography

### Navigation
- Bottom navigation for main sections
- FAB for primary actions
- Gesture navigation support

### Accessibility
- Content descriptions
- Touch targets 48dp minimum
- High contrast mode support

## Testing

### Unit Tests
- ViewModel tests
- Repository tests
- Export logic tests

### Instrumented Tests
- UI flow tests
- Database tests
- Camera tests

### Manual Testing
- Multiple device sizes
- Different Android versions
- Export/import flow

## Release Process

1. Version bump in build.gradle
2. Generate signed APK/AAB
3. Test on multiple devices
4. Upload to Play Store (optional)
5. Direct APK distribution

## Future Features

1. **Cloud Sync**
   - Real-time sync with desktop
   - Conflict resolution
   - Offline support

2. **AI Integration**
   - On-device ML for categorization
   - Description suggestions
   - Price recommendations

3. **Advanced Capture**
   - Video support
   - Document scanning
   - 360° photos

4. **Social Features**
   - Share collections
   - Collaborate on projects
   - Templates sharing
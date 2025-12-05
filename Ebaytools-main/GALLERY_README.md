# eBay Tools - Gallery Creator

The Gallery Creator is a standalone module that creates beautiful, classified ad-style HTML galleries for your items. It uses AI to generate descriptions from photos and provides a complete workflow for managing and publishing your item listings.

## Features

- 📸 **Multi-photo support** - Add multiple photos per item
- 🤖 **AI-powered descriptions** - Automatically generate sales descriptions from photos
- 📝 **Full editing capabilities** - Edit all details during final review
- 🏷️ **Status management** - Track items as available, pending, or sold
- 🌐 **Static HTML output** - Creates a standalone HTML gallery
- 📱 **Responsive design** - Works on desktop and mobile devices
- 🔍 **Filter functionality** - Filter by status (available/pending/sold)
- 💾 **JSON data storage** - All data stored in editable JSON format

## Quick Start

### Launch the Gallery Creator

**Windows:**
```bash
ebay_gallery.bat
```

**Mac/Linux:**
```bash
./ebay_gallery.sh
```

**Python:**
```bash
python -m ebay_tools.apps.gallery_creator
```

## Workflow

### 1. Create a New Gallery

1. Launch the Gallery Creator
2. File → New Gallery
3. Set gallery title and default contact info

### 2. Add Items

1. Click "Add Item" to create a new listing
2. Fill in basic information:
   - Title
   - Price
   - Location
   - Contact info (can use defaults)
3. Add photos using "Add Photos" button
4. Generate description with AI or write manually
5. Save the item

### 3. Review and Edit

During the final review process, you can:
- Adjust prices
- Set location and contact information
- Mark items as available, pending, or sold
- Edit descriptions
- Reorder items
- Set thumbnail images

### 4. Export Gallery

1. Click "Export HTML" or use File → Export HTML
2. Choose location to save the gallery
3. The exporter will:
   - Create the HTML file
   - Copy all photos to a 'photos' folder
   - Generate responsive gallery with filters

### 5. Publish

Simply upload the HTML file and photos folder to any web server or open locally in a browser.

## Gallery Features

### Item Display
- Thumbnail view with title, price, and status
- Click any item to see full details
- Multiple photo carousel in detail view
- Contact information displayed

### Filtering
- Filter by status: All, Available, Pending, Sold
- Items marked as sold appear with reduced opacity

### Responsive Design
- Adapts to different screen sizes
- Mobile-friendly touch navigation
- Optimized image loading

## Data Management

### JSON Structure

All gallery data is stored in JSON format for easy editing:

```json
{
  "title": "Gallery Title",
  "contact_info": {
    "name": "Your Name",
    "phone": "Phone Number",
    "email": "Email",
    "location": "Default Location"
  },
  "items": [
    {
      "id": "unique_id",
      "title": "Item Title",
      "description": "Full description",
      "price": "$100",
      "location": "Item Location",
      "contact_info": "Contact details",
      "status": "available|pending|sold",
      "photos": ["path/to/photo1.jpg"],
      "thumbnail": "path/to/thumbnail.jpg",
      "created_date": "ISO date",
      "updated_date": "ISO date"
    }
  ]
}
```

### Manual Editing

You can edit the JSON file directly if needed:
1. Save your gallery (creates .json file)
2. Edit in any text editor
3. Reload in Gallery Creator

## Tips and Best Practices

### Photos
- Use high-quality photos (they'll be optimized)
- First photo becomes default thumbnail
- Add multiple angles for better presentation
- Supported formats: JPG, PNG, GIF, WebP

### Descriptions
- Let AI generate initial description from photos
- Edit to add specific details
- Include condition, features, and any flaws
- Keep it honest and compelling

### Pricing
- Set during review phase
- Use consistent format ($XXX or $X,XXX)
- Can use "Contact for price" for negotiable items

### Organization
- Order items by priority (drag and drop)
- Group similar items together
- Mark sold items promptly

## Customization

### Styling
The generated HTML includes embedded CSS that can be customized:
- Edit the generated HTML file
- Modify colors, fonts, layouts
- Add your own branding

### Templates
Future versions will support custom templates.

## Troubleshooting

### AI Description Not Working
- Check API configuration in main settings
- Ensure photos are added before generating
- Verify internet connection

### Photos Not Displaying
- Check file paths are correct
- Ensure photos exist in specified locations
- Verify photos were copied during export

### Export Issues
- Ensure write permissions in export directory
- Check disk space for photo copying
- Verify all paths are valid

## Integration with eBay Tools

The Gallery Creator integrates with the existing eBay Tools infrastructure:
- Uses same API configuration for AI
- Compatible with existing photo processing
- Can import items from processor queues (future feature)

## Future Enhancements

Planned features:
- Custom HTML templates
- Direct upload to web hosting
- Import from eBay Tools queues
- Bulk operations
- Email notifications for inquiries
- Analytics tracking
- Print-friendly version

## Support

For issues or suggestions:
- Check main [User Manual](eBay_Tools_User_Manual.md)
- Report issues on GitHub
- See error logs in application directory
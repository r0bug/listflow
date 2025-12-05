# ConsoleEbay Quick Installer

## Installation

Run the installer:
```bash
./install.sh
```

## Configuration

Edit the `.env` file in the installation directory with your:
- Segmind API key
- eBay API credentials
- Database connection string

## Running

After installation:
- Backend: `./start-backend.sh`
- Desktop: `./start-desktop.sh`
- CLI: `./console-ebay --help`

## Backups

Automatic backups are created in `~/ConsoleEbay_backups/` when upgrading.

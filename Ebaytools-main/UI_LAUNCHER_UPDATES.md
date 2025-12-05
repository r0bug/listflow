# eBay Tools UI Launcher Updates Summary

## Overview
Added comprehensive cross-launch functionality to all eBay Tools UI applications, allowing users to easily navigate between different tools without closing and reopening applications.

## Changes Made

### 1. Created Launcher Utilities Module (`ebay_tools/utils/launcher_utils.py`)
- **ToolLauncher** class that manages launching of all tools
- Centralized tool definitions with names and descriptions
- Helper methods for launching each tool with optional file arguments
- `create_tools_menu()` function to add standard Tools menu to any app
- `create_launch_buttons_frame()` for adding launch buttons to UI

### 2. Updated Main Tools with Cross-Launch Functionality

#### **setup.py** (Queue Setup)
- Added Tools menu with launch options for all other tools
- Launch methods that pass current queue file to relevant tools
- Import launcher utilities

#### **processor.py** (LLM Processor)
- Added complete menu bar with File, Process, Tools, and Help menus
- Added "Launch Setup" button next to existing "Launch Viewer" button
- Launch methods that pass current queue file to relevant tools

#### **viewer.py** (JSON Viewer)
- Enhanced Tools menu with launch options for all other tools
- Launch methods that pass current JSON file to relevant tools

#### **gallery_creator.py** (Gallery Creator)
- Added Tools menu to existing menu bar
- Launch options for all other tools

### 3. Created Main Launcher Application (`main_launcher.py`)
- Central hub for launching all eBay tools
- Organized tools into categories:
  - **Main Workflow**: Setup → Processor → Viewer
  - **Processing & Analysis**: Price Analyzer, Gallery Creator, Direct Listing
  - **Import/Export**: CSV Export, Mobile Import
- Visual workflow guidance with numbered steps
- Status bar showing launch status

### 4. Created Launch Scripts
- **ebay_tools_launcher.bat** - Windows batch file
- **ebay_tools_launcher.sh** - Unix/Linux/Mac shell script
- Both scripts launch the main launcher application

## Usage

### From Any Tool
Users can now:
1. Use the **Tools** menu to launch any other tool
2. Current file (queue/JSON) is automatically passed to the launched tool
3. Multiple tools can run simultaneously

### From Main Launcher
1. Run `ebay_tools_launcher.bat` (Windows) or `ebay_tools_launcher.sh` (Unix/Mac)
2. Click on any tool button to launch it
3. Follow the visual workflow guide for typical usage

### Workflow Example
1. Start with **Setup** to create a work queue
2. From Setup, launch **Processor** (queue file passed automatically)
3. From Processor, launch **Viewer** to review results
4. From Viewer, launch **CSV Export** or **Price Analyzer** as needed

## Benefits
- **Improved Workflow**: Seamless navigation between tools
- **Context Preservation**: Files automatically passed between tools
- **Convenience**: No need to manually open files in each tool
- **Discoverability**: Users can see all available tools from any tool
- **Flexibility**: Tools can be launched independently or as part of workflow

## Technical Implementation
- Uses `subprocess.Popen()` for non-blocking launches
- Passes file paths as command-line arguments
- Maintains independent processes for each tool
- Shared launcher utilities module for consistency
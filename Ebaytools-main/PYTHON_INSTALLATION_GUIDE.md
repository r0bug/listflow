# Python Installation Guide for eBay Tools

## ⚠️ CRITICAL: Microsoft Store Python Issues

The Microsoft Store version of Python is known to cause "failed to make path absolute" errors with eBay Tools and many other Python applications.

## ✅ RECOMMENDED SOLUTION

**Uninstall Microsoft Store Python and install the official version:**

### Step 1: Uninstall Microsoft Store Python
1. Open **Settings** > **Apps** > **Apps & features**
2. Search for "Python"
3. Uninstall any Python entries that show "Microsoft Corporation" as publisher
4. Also check **Microsoft Store** > **Library** and uninstall Python from there

### Step 2: Install Official Python
1. Go to **https://python.org/downloads/**
2. Download **Python 3.11.9** (recommended - more stable than 3.13)
3. **Run installer as Administrator**
4. **IMPORTANT**: Check these boxes during installation:
   - ✅ "Add Python to PATH"
   - ✅ "Install for all users"
   - ✅ "Install pip"

### Step 3: Verify Installation
1. Open **Command Prompt as Administrator**
2. Run: `python --version`
3. Should show: `Python 3.11.9` (not Microsoft Store version)
4. Run: `where python`
5. Should show path like: `C:\Program Files\Python311\python.exe`

### Step 4: Restart and Test
1. **Restart your computer**
2. Run eBay Tools installer again: `install.bat`
3. Test with: `ebay_processor.bat`

## 🔍 How to Identify Microsoft Store Python

**Microsoft Store Python paths look like:**
```
C:\Users\[username]\AppData\Local\Microsoft\WindowsApps\python.exe
```

**Official Python paths look like:**
```
C:\Program Files\Python311\python.exe
or
C:\Python311\python.exe
```

## 🚨 Why Microsoft Store Python Causes Issues

1. **Sandboxed Environment**: MS Store Python runs in a restricted container
2. **Path Resolution Problems**: Can't properly resolve module paths in batch files
3. **Permission Issues**: Limited access to system directories
4. **Incomplete Installation**: Missing some standard library components

## ✅ Alternative Solutions

If you must keep Microsoft Store Python:

### Option 1: Use Direct Python Execution
Instead of batch files, run:
```cmd
cd C:\Path\To\eBayTools
python -m ebay_tools.apps.processor
```

### Option 2: Use PowerShell
```powershell
cd C:\Path\To\eBayTools
python -m ebay_tools.apps.processor
```

### Option 3: Run from Python IDLE
1. Open Python IDLE
2. Run:
```python
import sys
sys.path.insert(0, r'C:\Path\To\eBayTools')
import ebay_tools.apps.processor
```

## 🎯 Best Practice for Development

**For any serious Python development, always use the official Python installer from python.org, not the Microsoft Store version.**

The Microsoft Store version is designed for simple scripts and learning, not for full applications like eBay Tools.
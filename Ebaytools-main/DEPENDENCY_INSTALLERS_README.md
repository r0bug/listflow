# eBay Tools Dependency Installers

## 📦 Complete Installation Package

This collection provides **comprehensive dependency installation scripts** for the eBay Tools application across all major platforms.

### 🚀 Available Installers

#### 1. **Universal Python Installer** - `install_dependencies.py`
**Cross-platform Python script with intelligent detection**

```bash
python install_dependencies.py
# or
python3 install_dependencies.py
```

**Features:**
- ✅ **Automatic platform detection** (Windows, macOS, Linux)
- ✅ **Python version verification** (requires 3.8+)
- ✅ **Smart package manager detection** (apt, yum, pacman, brew)
- ✅ **System dependency installation** 
- ✅ **Python package installation with error handling**
- ✅ **Comprehensive testing and verification**
- ✅ **Creates test script for validation**

---

#### 2. **Windows Batch Installer** - `install_dependencies.bat`
**Native Windows installation with GUI support**

```cmd
install_dependencies.bat
```

**Features:**
- 🪟 **Windows-optimized** with native batch scripting
- 🔍 **Multiple Python detection methods** (python, py, python3)
- 📦 **Automatic pip upgrade and package installation**
- 🧪 **Import verification testing**
- 🎨 **Colored console output and progress indicators**
- 📋 **Detailed error reporting and solutions**

---

#### 3. **Linux/macOS Shell Installer** - `install_dependencies.sh`
**Unix-based systems with package manager integration**

```bash
chmod +x install_dependencies.sh
./install_dependencies.sh
```

**Features:**
- 🐧 **Linux package manager support** (apt, yum, pacman)
- 🍎 **macOS Homebrew integration**
- 🎨 **Colored terminal output**
- 🔧 **System library installation** (tkinter, image processing)
- ✅ **Comprehensive testing with GUI validation**
- 📋 **Platform-specific troubleshooting**

---

## 🔧 What Gets Installed

### **Core Dependencies**
```
requests>=2.25.1      # HTTP requests for API calls
pillow>=8.2.0         # Image processing and manipulation
beautifulsoup4>=4.9.3 # HTML/XML parsing for web scraping
tkinter               # GUI framework (usually included with Python)
```

### **System Libraries** (Linux/macOS)
```
python3-tk            # Tkinter GUI support
python3-dev           # Python development headers
libjpeg-dev           # JPEG image support
libpng-dev            # PNG image support
libfreetype6-dev      # Font rendering
liblcms2-dev          # Color management
libwebp-dev           # WebP image support
```

### **Optional Enhancements**
```
lxml                  # Faster XML/HTML parsing
numpy                 # Numerical operations for image processing
certifi               # SSL certificates
urllib3               # Enhanced HTTP handling
charset-normalizer    # Character encoding detection
```

---

## 🎯 Installation Process

### **Automatic Detection & Installation**

1. **Python Version Check**
   - Verifies Python 3.8+ is installed
   - Provides download links if missing
   - Tests multiple Python command variations

2. **System Dependencies**
   - Detects operating system and package manager
   - Installs system libraries needed for GUI and image processing
   - Handles different Linux distributions automatically

3. **Python Packages**
   - Upgrades pip to latest version
   - Installs core packages with version requirements
   - Installs optional packages for enhanced functionality
   - Provides detailed error reporting

4. **Verification & Testing**
   - Tests all critical imports
   - Verifies GUI functionality works
   - Creates test scripts for ongoing validation
   - Reports any issues with solutions

---

## 🛠️ Platform-Specific Features

### **Windows (`install_dependencies.bat`)**
- Native batch scripting for Windows
- Handles Windows Python launcher (`py` command)
- Visual C++ Redistributable compatibility
- Windows-specific error messages and solutions
- Automatic Python download page opening

### **Linux (`install_dependencies.sh`)**
- **Ubuntu/Debian**: `apt-get` package management
- **RHEL/CentOS/Fedora**: `yum` package management  
- **Arch Linux**: `pacman` package management
- **Generic Linux**: Manual dependency guidance
- System library installation for image processing

### **macOS (`install_dependencies.sh`)**
- Homebrew package manager integration
- macOS-specific system libraries
- Xcode command line tools compatibility
- Apple Silicon (M1/M2) support

---

## 🔍 Verification & Testing

Each installer creates verification tools:

### **Automatic Import Testing**
```python
✅ tkinter GUI framework working
✅ requests HTTP library working  
✅ Pillow image processing working
✅ BeautifulSoup HTML parsing working
```

### **GUI Functionality Test**
- Creates test window to verify tkinter works
- Tests image processing capabilities
- Validates web request functionality
- Provides visual confirmation of success

### **Test Script Generation**
Each installer creates `test_ebay_tools.py`:
```bash
python test_ebay_tools.py
# Tests all functionality with GUI window
```

---

## 🚨 Troubleshooting

### **Common Issues & Solutions**

#### **Python Not Found**
```bash
# Windows
# Install from: https://www.python.org/downloads/
# Check "Add Python to PATH" during installation

# Ubuntu/Debian
sudo apt-get install python3 python3-pip

# macOS
brew install python3
```

#### **Permission Errors**
```bash
# Windows
# Run as Administrator

# Linux/macOS
sudo apt-get install python3-dev  # Install system packages
pip install --user package_name   # User-local installation
```

#### **GUI Not Working**
```bash
# Linux
sudo apt-get install python3-tk

# macOS  
brew install python-tk

# Windows
# Reinstall Python with tkinter support
```

#### **Image Processing Errors**
```bash
# Linux
sudo apt-get install libjpeg-dev libpng-dev libfreetype6-dev

# macOS
brew install jpeg libpng freetype

# Windows
# Usually handled automatically with Pillow
```

---

## 🎉 After Installation

### **Verify Installation**
```bash
python test_ebay_tools.py
```

### **Run eBay Tools Applications**
```bash
# Setup Tool
python -m ebay_tools.apps.setup

# Processor Tool  
python -m ebay_tools.apps.processor

# Viewer Tool
python -m ebay_tools.apps.viewer

# Price Analyzer
python -m ebay_tools.apps.price_analyzer
```

### **Windows Users**
Use the provided batch files:
```cmd
ebay_setup.bat
ebay_processor.bat
ebay_viewer.bat
ebay_price.bat
```

---

## 📋 Installer Comparison

| Feature | Python Script | Windows Batch | Unix Shell |
|---------|---------------|---------------|------------|
| **Cross-platform** | ✅ | ❌ | ❌ |
| **Native GUI** | ✅ | ✅ | ✅ |
| **System packages** | ✅ | ⚠️ | ✅ |
| **Error handling** | ✅ | ✅ | ✅ |
| **Progress indicators** | ✅ | ✅ | ✅ |
| **Verification tests** | ✅ | ✅ | ✅ |
| **Platform optimization** | ⚠️ | ✅ | ✅ |

**Recommendation:**
- **New users**: Use platform-specific installer (`.bat` for Windows, `.sh` for Linux/macOS)
- **Developers**: Use universal Python script for consistency
- **System administrators**: Use shell script for automated deployment

---

## 📞 Support

### **Installation Logs**
All installers provide detailed logging:
- Success/failure status for each package
- Specific error messages with solutions
- Platform-specific troubleshooting guidance

### **Manual Installation**
If automated installation fails:
```bash
# 1. Install Python 3.8+
# 2. Install system dependencies manually
# 3. Install Python packages:
pip install requests pillow beautifulsoup4 lxml numpy

# 4. Test installation:
python -c "import tkinter, requests, PIL, bs4; print('✅ All working')"
```

### **Virtual Environment Option**
For isolated installation:
```bash
python -m venv ebay_tools_env
source ebay_tools_env/bin/activate  # Linux/macOS
ebay_tools_env\Scripts\activate.bat  # Windows
pip install requests pillow beautifulsoup4
```

---

**🎯 These installers provide a complete, automated solution for getting eBay Tools running on any system with minimal user intervention and comprehensive error handling.**
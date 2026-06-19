---
name: setup-troubleshooting
description: Diagnose, configure, and automatically install all required development tools (such as Python 3, Node.js, NPM, and the Foundry VTT CLI) for the eskie-macro-pack workspace. Make sure to use this skill whenever you are asked to "set up the environment", "install developer tools", "troubleshoot setup", or when other developer skills fail due to missing dependencies.
compatibility: OS-agnostic, Python 3
---

# Setup Troubleshooting Skill

This skill guides the agent in diagnosing the development environment and automatically installing any missing tools required for the [eskie-macro-pack](file:///usr/local/google/home/aljames/jetski/eskie-macro-pack) scripts and workflows (e.g., Python 3, Node.js, NPM, and the Foundry VTT CLI).

## Script Usage

The diagnostics and automated installations are handled by the parameterized python script `setup.py`.

### 1. Run Diagnostics and Interactive Setup
Runs a complete check of your workspace tools. If any local node packages are missing, it will prompt you for permission to install them:
```bash
python3 .agent/skills/setup-troubleshooting/scripts/setup.py
```

### 2. Auto-Install Mode (For Headless / Agent Environments)
Automatically detects the operating system, package manager, and missing tools, and attempts to install them without interactive prompts (useful for agent execution):
```bash
python3 .agent/skills/setup-troubleshooting/scripts/setup.py --auto
```

---

## What the Setup Script Handles

1.  **OS & Python Detection:** Verifies the host OS and confirms Python 3 is active.
2.  **Node.js & NPM Check:** Checks if Node and NPM are available. If they are missing, it:
    *   Detects the system's package manager (e.g., `apt`, `brew`, `pacman`, `dnf`, `yum`).
    *   Prints the exact installation command.
    *   In `--auto` mode, runs the package manager command to install them.
3.  **Local Package Setup:** If Node is installed but the Foundry CLI is missing:
    *   Creates a default `package.json` in the project root if none exists to isolate dependencies.
    *   Runs `npm install --save-dev @foundryvtt/foundryvtt-cli` to install the CLI locally in `node_modules/`.

---

## Fallback Manual Installation Reference

If automated installation fails or you are on Windows, refer to these manual commands:

### 🍎 macOS
```bash
# Install Node.js & NPM
brew install node
```

### 🐧 Debian / Ubuntu (Linux)
```bash
# Install Node.js & NPM
sudo apt-get update && sudo apt-get install -y nodejs npm
```

### 🐧 Arch Linux
```bash
# Install Node.js & NPM
sudo pacman -S nodejs npm
```

### 🐧 Fedora / RedHat (Linux)
```bash
# Install Node.js & NPM
sudo dnf install -y nodejs npm
```

### 🏁 Windows
1.  Download and run the official installer from [Node.js Official Downloads](https://nodejs.org/en/download/).
2.  Restart your terminal and run `setup.py` again.

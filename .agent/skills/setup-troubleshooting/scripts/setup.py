import sys
import os
import subprocess
import platform
import shutil
import json
import argparse
from pathlib import Path

def check_command(cmd):
    path = shutil.which(cmd)
    if not path:
        return None
    try:
        result = subprocess.run([cmd, "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
        version = result.stdout.strip() or result.stderr.strip()
        # Clean up version string (e.g., v18.16.0 -> 18.16.0)
        version = version.split('\n')[0].strip()
        return version
    except Exception:
        return "Unknown Version"

def get_package_manager():
    if sys.platform == "darwin":
        return "brew"
    elif sys.platform.startswith("linux"):
        if shutil.which("apt-get"):
            return "apt"
        elif shutil.which("pacman"):
            return "pacman"
        elif shutil.which("dnf"):
            return "dnf"
        elif shutil.which("yum"):
            return "yum"
    return None

def install_node_instructions(pm):
    instructions = {
        "brew": "brew install node",
        "apt": "sudo apt-get update && sudo apt-get install -y nodejs npm",
        "pacman": "sudo pacman -S nodejs npm",
        "dnf": "sudo dnf install -y nodejs npm",
        "yum": "sudo yum install -y nodejs npm"
    }
    
    print("\nEMP | --- How to Install Node.js ---")
    if pm in instructions:
        print(f"We detected your package manager ('{pm}'). You can install Node.js by running:")
        print(f"  {instructions[pm]}")
    else:
        if sys.platform == "win32":
            print("Please download and run the official Node.js installer for Windows:")
            print("  https://nodejs.org/en/download/")
        else:
            print("Please install Node.js using your system's package manager or download it from:")
            print("  https://nodejs.org/")
    print("-----------------------------------\n")

def create_default_package_json(package_root):
    pkg_json_path = package_root / "package.json"
    if pkg_json_path.exists():
        return
        
    print("EMP | Creating a default package.json to manage local dependencies...")
    pkg_data = {
        "name": "eskie-macro-pack",
        "version": "1.0.0",
        "description": "Eskie Macro Pack developer workspace",
        "private": True,
        "devDependencies": {}
    }
    
    with open(pkg_json_path, 'w', encoding='utf-8') as f:
        json.dump(pkg_data, f, indent=4)
    print(f"EMP | Created: {pkg_json_path}")

def run_setup(auto_install=False):
    print("=== Eskie Macro Pack Environment Diagnostics ===")
    
    # 1. Detect OS
    os_name = platform.system()
    os_release = platform.release()
    print(f"OS: {os_name} ({os_release})")
    
    # 2. Check Python
    print(f"Python: {sys.version.split()[0]} (Path: {sys.executable})")
    
    # 3. Check Node & NPM
    node_version = check_command("node")
    npm_version = check_command("npm")
    
    print(f"Node.js: {node_version if node_version else 'MISSING'}")
    print(f"NPM: {npm_version if npm_version else 'MISSING'}")
    
    # Identify project root
    package_root = Path(__file__).resolve().parents[4]
    
    # 4. Check local Foundry CLI installation
    cli_installed = False
    node_modules_cli = package_root / "node_modules" / "@foundryvtt" / "foundryvtt-cli"
    if node_modules_cli.exists():
        cli_installed = True
        print("Foundry VTT CLI: INSTALLED (Local node_modules)")
    else:
        # Check global or via npx execution
        npx_path = shutil.which("npx")
        if npx_path:
            try:
                # Check if we can run it
                res = subprocess.run(["npx", "@foundryvtt/foundryvtt-cli", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
                if res.returncode == 0:
                    cli_installed = True
                    print(f"Foundry VTT CLI: INSTALLED (npx cache / global, version {res.stdout.strip()})")
            except Exception:
                pass
                
    if not cli_installed:
        print("Foundry VTT CLI: MISSING")
        
    # 5. Troubleshooting Decisions
    pm = get_package_manager()
    
    if not node_version or not npm_version:
        print("\n[FAIL] Node.js or NPM is missing. The compendium packer/unpacker ('compendium-sync') cannot run without them.")
        install_node_instructions(pm)
        
        if auto_install and pm:
            print(f"EMP | Attempting to install Node.js automatically via '{pm}'...")
            try:
                if pm == "brew":
                    cmd = ["brew", "install", "node"]
                else:
                    # Linux package managers require sudo
                    cmd = ["sudo", "apt-get", "update"] if pm == "apt" else []
                    if cmd:
                        subprocess.run(cmd, check=True)
                    
                    if pm == "apt":
                        cmd = ["sudo", "apt-get", "install", "-y", "nodejs", "npm"]
                    elif pm == "pacman":
                        cmd = ["sudo", "pacman", "-S", "--noconfirm", "nodejs", "npm"]
                    elif pm == "dnf":
                        cmd = ["sudo", "dnf", "install", "-y", "nodejs", "npm"]
                    elif pm == "yum":
                        cmd = ["sudo", "yum", "install", "-y", "nodejs", "npm"]
                
                print(f"EMP | Running installation command: {' '.join(cmd)}")
                res = subprocess.run(cmd, check=True)
                if res.returncode == 0:
                    print("EMP | Node.js and NPM successfully installed! Please restart the setup script to verify.")
                    return True
                else:
                    print("EMP | Installation failed. Please run the command manually.")
            except Exception as e:
                print(f"EMP | Failed to run installation: {e}")
                print("Please install Node.js manually using the instructions above.")
        else:
            print("Please install Node.js and NPM, then run this setup script again.")
        return False
        
    # Node and NPM are present. Check if Foundry CLI is missing.
    if not cli_installed:
        print("\n[WARN] Foundry VTT CLI is missing. Local compendiums cannot be packed or unpacked.")
        
        if auto_install or input("\nWould you like to install the Foundry VTT CLI locally now? (y/n): ").lower().strip() == 'y':
            create_default_package_json(package_root)
            print("EMP | Installing @foundryvtt/foundryvtt-cli locally...")
            try:
                cmd = ["npm", "install", "--save-dev", "@foundryvtt/foundryvtt-cli"]
                print(f"EMP | Running: {' '.join(cmd)}")
                res = subprocess.run(cmd, cwd=str(package_root), check=True)
                if res.returncode == 0:
                    print("EMP | Successfully installed @foundryvtt/foundryvtt-cli!")
                    print("[PASS] Environment setup complete and fully functional!")
                    return True
                else:
                    print("EMP | Installation failed. Please run the npm command manually in your project root.")
            except Exception as e:
                print(f"EMP | Error running npm install: {e}")
        else:
            print("Skipped Foundry VTT CLI installation. Note that 'compendium-sync' will not function.")
        return False
        
    print("\n[PASS] All core development tools and dependencies are fully installed and configured!")
    print("You are ready to develop, lint, pack, and synchronize animations and compendiums.")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Diagnose and install required development tools for eskie-macro-pack.")
    parser.add_argument("--auto", action="store_true", help="Attempt to automatically install missing packages/tools without prompting")
    args = parser.parse_args()
    
    # If in non-interactive environment (like agent run), auto-install is set by --auto
    success = run_setup(auto_install=args.auto)
    sys.exit(0 if success else 1)

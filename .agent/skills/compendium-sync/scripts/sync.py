import sys
import subprocess
import argparse
import shutil
from pathlib import Path

def run_cli_command(action):
    # Check if node/npx are available
    npx_path = shutil.which('npx')
    node_path = shutil.which('node')
    
    if not npx_path or not node_path:
        print("EMP | Error: Node.js (and 'npx') must be installed to use the Foundry VTT CLI.")
        print("Please install Node.js from https://nodejs.org/ and ensure it is in your PATH.")
        return False
        
    # Determine the package root directory (the parent of .agent, which is two levels up from this script)
    # E.g. .agent/skills/compendium-sync/scripts/sync.py -> eskie-macro-pack/
    script_dir = Path(__file__).resolve().parent
    package_root = script_dir.parents[3] # sync.py (0) -> scripts (1) -> compendium-sync (2) -> skills (3) -> .agent (4) -> eskie-macro-pack (5)
    # Wait, let's double check the levels:
    # eskie-macro-pack/
    #   .agent/
    #     skills/
    #       compendium-sync/
    #         scripts/
    #           sync.py
    # So:
    # Path(__file__) is eskie-macro-pack/.agent/skills/compendium-sync/scripts/sync.py
    # parent 0: scripts/
    # parent 1: compendium-sync/
    # parent 2: skills/
    # parent 3: .agent/
    # parent 4: eskie-macro-pack/
    # Yes! It is exactly parents[4].
    package_root = Path(__file__).resolve().parents[4]
    
    print(f"EMP | Project root detected: {package_root}")
    
    # We want to run fvtt package unpack/pack.
    # Official package: @foundryvtt/foundryvtt-cli
    # Commands:
    # npx @foundryvtt/foundryvtt-cli package unpack --package=eskie-macros eskie-aa-integration
    # npx @foundryvtt/foundryvtt-cli package pack --package=eskie-macros eskie-aa-integration
    
    cmd = [
        "npx",
        "@foundryvtt/foundryvtt-cli",
        "package",
        action,
        "--package=eskie-macros",
        "eskie-aa-integration"
    ]
    
    print(f"EMP | Running command: {' '.join(cmd)}")
    
    try:
        # Run the command with working directory set to package root
        result = subprocess.run(
            cmd,
            cwd=str(package_root),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False
        )
        
        if result.stdout:
            print("EMP | Output:")
            print(result.stdout)
            
        if result.stderr:
            print("EMP | Warnings/Errors:")
            print(result.stderr)
            
        if result.returncode == 0:
            print(f"EMP | Successfully completed: fvtt package {action}")
            return True
        else:
            print(f"EMP | Command failed with exit code: {result.returncode}")
            return False
            
    except Exception as e:
        print(f"EMP | Error executing process: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Synchronize (pack/unpack) Foundry VTT compendium LevelDB files.")
    parser.add_argument("action", choices=["pack", "unpack"], help="Action to perform: 'pack' or 'unpack'")
    args = parser.parse_args()
    
    success = run_cli_command(args.action)
    sys.exit(0 if success else 1)

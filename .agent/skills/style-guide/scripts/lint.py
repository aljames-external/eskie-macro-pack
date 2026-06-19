import sys
import re
import argparse
from pathlib import Path

def lint_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.splitlines()
    errors = []

    # 1. Line-by-line checks (tabs, console log prefixes, deprecated API patterns)
    for i, line in enumerate(lines):
        line_num = i + 1
        
        # Check for tabs
        if '\t' in line:
            errors.append(f"Line {line_num}: Contains tabs instead of spaces.")
            
        # Check for missing EMP | prefix in console.log/warn/error/info
        log_match = re.search(r'console\.(log|warn|error|info)\s*\(\s*([\'"`])(.*?)\2', line)
        if log_match:
            msg = log_match.group(3)
            if not msg.startswith('EMP |'):
                errors.append(f"Line {line_num}: console statement missing 'EMP | ' prefix. Found: {msg}")

        # Check for simple deprecated API properties
        if '.data.name' in line:
            errors.append(f"Line {line_num}: Deprecated '.data.name' used. Use '.name' instead.")
        if '.document.data.width' in line:
            errors.append(f"Line {line_num}: Deprecated '.document.data.width' used. Use '.document.width' instead.")
        if 'warpgate.crosshairs.show' in line:
            errors.append(f"Line {line_num}: Deprecated 'warpgate.crosshairs.show' used. Use 'Sequencer.Crosshair.show' instead.")
        if 'warpgate.buttonDialog' in line:
            errors.append(f"Line {line_num}: Deprecated 'warpgate.buttonDialog' used. Import and use 'dialog.buttonDialog' instead.")
        if "'eskie-macro-pack'" in line or '"eskie-macro-pack"' in line:
            errors.append(f"Line {line_num}: Hardcoded module name 'eskie-macro-pack' used for flag scope. Import and use 'MODULE_ID' instead.")

    # 2. Match-based checks (copySprite, scaleToObject, sound safety)
    
    # 2a. copySprite rotation fix check
    copy_matches = re.finditer(r'\.copySprite\s*\(\s*([a-zA-Z0-9_]+)\s*\)', content)
    for match in copy_matches:
        token_var = match.group(1)
        line_num = content[:match.start()].count('\n') + 1
        
        # Extract the statement containing this match
        next_semi = content.find(';', match.start())
        if next_semi == -1:
            next_semi = len(content)
        prev_semi = content.rfind(';', 0, match.start())
        if prev_semi == -1:
            prev_semi = 0
        statement = content[prev_semi:next_semi]
        
        # Check if it has .spriteRotation(...) negating the same token
        rot_pattern = rf'\.spriteRotation\s*\(\s*-\s*{token_var}\.document\.rotation\s*\)'
        if not re.search(rot_pattern, statement):
            errors.append(
                f"Line {line_num}: Statement contains '.copySprite({token_var})' "
                f"but is missing the negation '.spriteRotation(-{token_var}.document.rotation)' "
                f"to correct VTT token rotation."
            )

    # 2b. scaleToObject scaling options check
    scale_matches = re.finditer(r'\.scaleToObject\s*\(', content)
    for match in scale_matches:
        line_num = content[:match.start()].count('\n') + 1
        
        # Extract the statement containing this match
        next_semi = content.find(';', match.start())
        if next_semi == -1:
            next_semi = len(content)
        prev_semi = content.rfind(';', 0, match.start())
        if prev_semi == -1:
            prev_semi = 0
        statement = content[prev_semi:next_semi]
        
        if 'considerTokenScale' not in statement:
            errors.append(
                f"Line {line_num}: '.scaleToObject(...)' is missing the option "
                f"'{{ considerTokenScale: true }}' to respect the token's natural scale."
            )

    # 2c. sound safety check
    sound_matches = re.finditer(r'\.sound\s*\(', content)
    for match in sound_matches:
        line_num = content[:match.start()].count('\n') + 1
        
        # Extract the statement containing this match
        next_semi = content.find(';', match.start())
        if next_semi == -1:
            next_semi = len(content)
        prev_semi = content.rfind(';', 0, match.start())
        if prev_semi == -1:
            prev_semi = 0
        statement = content[prev_semi:next_semi]
        
        if 'closest(' in statement:
            # Check if there is an outer 'if' block protecting this sound call
            is_protected = False
            start_look = max(0, line_num - 5)
            for j in range(start_look, line_num):
                look_line = lines[j]
                if 'if' in look_line and ('sound' in look_line or 'enabled' in look_line):
                    is_protected = True
                    break
            if not is_protected:
                errors.append(
                    f"Line {line_num}: '.sound()' statement uses 'closest()' but is not "
                    f"wrapped in an 'if (sound.enabled)' block. Missing files will cause immediate crashes!"
                )

    # 3. Check for settingsOverride inside create/play functions
    file_name = Path(file_path).name
    if not (file_name.startswith('_') or file_name == 'index.js'):
        func_matches = re.finditer(r'function\s+(create|play)\s*\([^)]*\)\s*\{', content)
        for match in func_matches:
            func_name = match.group(1)
            start_idx = match.end()
            body_snippet = content[start_idx:start_idx+500]
            if 'settingsOverride' not in body_snippet:
                func_line = content[:match.start()].count('\n') + 1
                errors.append(
                    f"Line {func_line}: Function '{func_name}' is missing the "
                    f"'config = settingsOverride(config);' initialization call at its beginning."
                )

    if errors:
        print(f"Linting errors found in {file_path}:")
        for error in errors:
            print(f"  - {error}")
        return False
    else:
        print(f"Linting passed for {file_path}")
        return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Lint eskie-macro-pack JS files for style guide adherence.")
    parser.add_argument("file", help="Path to the JS file to lint")
    args = parser.parse_args()
    
    if not Path(args.file).exists():
        print(f"Error: File {args.file} not found.")
        sys.exit(1)
        
    success = lint_file(args.file)
    sys.exit(0 if success else 1)

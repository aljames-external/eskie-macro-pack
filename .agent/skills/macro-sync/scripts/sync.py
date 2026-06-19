import sys
import re
import argparse
from pathlib import Path

def clean_code(code):
    # Remove imports
    code = re.sub(r'^import\s+.*?;?\s*$', '', code, flags=re.MULTILINE)
    # Remove exports at the bottom
    code = re.sub(r'^export\s+const\s+\w+\s*=\s*\{.*?\}\s*;?\s*$', '', code, flags=re.DOTALL | re.MULTILINE)
    code = re.sub(r'^export\s+async\s+function\s+\w+\(.*$', '', code, flags=re.MULTILINE)
    return code.strip()

def extract_helpers(content):
    # Find all helper functions (starting with function _ or similar)
    helpers = []
    matches = re.finditer(r'(function\s+_[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{(?:[^{}]*|\{(?:[^{}]*|\{[^{}]*\})*\})*\})', content)
    for m in matches:
        helpers.append(m.group(1))
    return "\n\n".join(helpers)

def compile_module_to_macro(module_path, output_path):
    with open(module_path, 'r', encoding='utf-8') as f:
        content = f.read()

    file_name = Path(module_path).stem
    macro_name = file_name.replace('_', '').replace('-', ' ')
    macro_name = ' '.join(word.capitalize() for word in macro_name.split())
    
    # 1. Detect function signature and variables
    # E.g., function create(token, config = {}) or create(source, target, config = {})
    sig_match = re.search(r'function\s+(?:create|play)\s*\(\s*([a-zA-Z0-9_,=\s{}]+)\s*\)', content)
    if not sig_match:
        print(f"EMP | Error: Could not find create/play function in {module_path}")
        return False
        
    args = [a.strip().split('=')[0].strip() for a in sig_match.group(1).split(',')]
    
    has_target = 'target' in args or 'targetTokens' in args
    
    # 2. Extract DEFAULT_CONFIG
    config_match = re.search(r'const\s+DEFAULT_CONFIG\s*=\s*(\{.*?\})\s*;', content, re.DOTALL)
    config_str = config_match.group(1) if config_match else "{}"
    
    # 3. Extract core sequence body inside create()
    # Find create function body
    create_match = re.search(r'function\s+create\s*\([^)]*\)\s*\{(.*?)\n\}', content, re.DOTALL)
    if not create_match:
        create_match = re.search(r'function\s+play\s*\([^)]*\)\s*\{(.*?)\n\}', content, re.DOTALL)
        
    if not create_match:
        print(f"EMP | Error: Could not extract function body from {module_path}")
        return False
        
    body = create_match.group(1).strip()
    
    # Clean up settingsOverride and config merging inside body
    body = re.sub(r'.*?settingsOverride.*?\n', '', body)
    body = re.sub(r'.*?foundry\.utils\.mergeObject.*?\n', '', body)
    
    # Replace closest(...) wraps in the body or keep them but we have our local closest definition!
    # Keeping closest() is great because our macro header defines a standalone closest() helper!
    
    # 4. Check if effect is persistent (contains .persist())
    is_persistent = '.persist(' in body or 'persist()' in body
    
    # 5. Extract helpers
    helpers_str = extract_helpers(content)
    
    # Assemble the standalone macro code
    macro_code = []
    macro_code.append(f"// Standalone Macro: {macro_name}")
    macro_code.append('if (!game.modules.get("sequencer")?.active) {')
    macro_code.append(f"    return ui.notifications.error(\"The '{macro_name}' macro requires the 'Sequencer' module to be installed and active!\");")
    macro_code.append("}\n")
    
    # Standalone closest helper
    macro_code.append("/**")
    macro_code.append(" * Safely resolves Free vs Patreon asset paths if the eskie module is active.")
    macro_code.append(" * Falls back to the default path if running as a standalone copy-paste macro.")
    macro_code.append(" */")
    macro_code.append("const closest = (path) => {")
    macro_code.append("    if (typeof eskie !== \"undefined\" && eskie.util?.file?.closest) {")
    macro_code.append("        return eskie.util.file.closest(path);")
    macro_code.append("    }")
    macro_code.append("    return path;")
    macro_code.append("};\n")
    
    # Setup variables
    macro_code.append("const token = canvas.tokens.controlled[0];")
    macro_code.append("if (!token) return ui.notifications.warn(\"Please select a token!\");\n")
    
    if has_target:
        macro_code.append("const target = game.user.targets.first();")
        macro_code.append("if (!target) return ui.notifications.warn(\"Please target a token!\");\n")
        
    macro_code.append(f"const id = \"{file_name}\";")
    macro_code.append("const label = `${id} - ${token.id}`;\n")
    
    # Inject config variables based on DEFAULT_CONFIG
    macro_code.append(f"// Configuration (derived from module DEFAULT_CONFIG)")
    # Flatten the config_str slightly or write it as a constant
    macro_code.append(f"const config = {config_str};\n")
    
    if is_persistent:
        macro_code.append("// Check if effect is already playing (Toggle logic)")
        macro_code.append("const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0;\n")
        macro_code.append("if (isPlaying) {")
        macro_code.append("    Sequencer.EffectManager.endEffects({ name: label, object: token });")
        macro_code.append("    // Also restore opacity if modified by standard patterns")
        macro_code.append("    let opacity = new Sequence().animation().on(token).opacity(1);")
        macro_code.append("    opacity.play();")
        macro_code.append("} else {")
        # Prepend indentation to the body lines for clean formatting
        indented_body = "\n".join("    " + line for line in body.splitlines())
        macro_code.append(indented_body)
        # Ensure it plays at the end of the body
        if not body.strip().endswith('.play()') and not body.strip().endswith('play();'):
            # If the body returns a sequence, play it
            # Let's see if the body has a return statement
            ret_match = re.search(r'return\s+([a-zA-Z0-9_]+)\s*;', body)
            if ret_match:
                seq_var = ret_match.group(1)
                macro_code.append(f"    {seq_var}.play();")
            else:
                macro_code.append("    seq.play();")
        macro_code.append("}")
    else:
        # One-shot play
        indented_body = "\n".join(body.splitlines())
        macro_code.append(indented_body)
        if not body.strip().endswith('.play()') and not body.strip().endswith('play();'):
            ret_match = re.search(r'return\s+([a-zA-Z0-9_]+)\s*;', body)
            if ret_match:
                seq_var = ret_match.group(1)
                macro_code.append(f"{seq_var}.play();")
            else:
                macro_code.append("seq.play();")
                
    # Append helpers
    if helpers_str:
        macro_code.append("\n\n// ==========================================")
        macro_code.append("// Helper Functions")
        macro_code.append("// ==========================================")
        macro_code.append(helpers_str)
        
    final_code = "\n".join(macro_code)
    
    # Ensure directory exists
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_code)
        
    print(f"EMP | Compiled and synchronized standalone macro: {output_path}")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Synchronize and compile modular effects to standalone macros.")
    parser.add_argument("module", help="Path to the modular effect JS file in src/animation/effects/")
    parser.add_argument("macro", help="Path to save the compiled standalone macro JS file in src/standalone-macros/")
    args = parser.parse_args()
    
    if not Path(args.module).exists():
        print(f"Error: Module file {args.module} not found.")
        sys.exit(1)
        
    success = compile_module_to_macro(args.module, args.macro)
    sys.exit(0 if success else 1)

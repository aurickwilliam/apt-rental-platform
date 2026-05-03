import os
import glob
import re
from collections import defaultdict
import subprocess

components_dir = 'apps/mobile/components'
app_dir = 'apps/mobile/app'

# Get all components
components = []
for root, _, files in os.walk(components_dir):
    for f in files:
        if f.endswith('.tsx'):
            components.append(os.path.join(root, f))

# Read all app files
app_files = {}
for root, _, files in os.walk(app_dir):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                app_files[path] = file.read()

def get_imports(content):
    # naive import extraction
    # import { X } from '@/components/.../X'
    imports = []
    lines = content.split('\n')
    for line in lines:
        if 'import ' in line and '@/components/' in line:
            # extract path
            match = re.search(r"from ['\"](@/components/[^'\"]+)['\"]", line)
            if match:
                imports.append(match.group(1))
    return imports

# Component name to relative path
comp_map = {}
for c in components:
    name = os.path.basename(c).replace('.tsx', '')
    rel_path = os.path.relpath(c, components_dir)
    comp_map[name] = {
        'path': c,
        'rel': rel_path,
        'used_in': []
    }

for app_file, content in app_files.items():
    imports = get_imports(content)
    for imp in imports:
        # extract component name (usually the last part)
        parts = imp.split('/')
        name = parts[-1]
        if name in comp_map:
            comp_map[name]['used_in'].append(app_file)

import shutil

moves = []

for name, info in comp_map.items():
    usages = info['used_in']
    if len(usages) == 0:
        continue
    
    # Check if all usages are in the same directory (or subdirectories of a specific page)
    # Actually, if it's only used in one specific page/flow, we can move it there.
    # Let's group by dirname
    dirnames = set(os.path.dirname(u) for u in usages)
    
    # If all usages are in the exact same directory, we move it there.
    if len(dirnames) == 1:
        target_dir = list(dirnames)[0]
        moves.append((info['path'], os.path.join(target_dir, 'components', name + '.tsx')))
        continue
        
    # Find common prefix of all usages
    common_prefix = os.path.commonpath(list(usages))
    if common_prefix.startswith(app_dir) and common_prefix != app_dir:
        # it's specific to a subsection (like apps/mobile/app/(auth) or apps/mobile/app/tenant)
        # Maybe we move it to common_prefix/components?
        moves.append((info['path'], os.path.join(common_prefix, 'components', name + '.tsx')))

print("Proposed moves:", len(moves))
for src, dst in moves:
    print(f"Move {src} to {dst}")

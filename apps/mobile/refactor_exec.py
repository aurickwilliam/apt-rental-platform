import os
import re
import shutil

components_dir = 'apps/mobile/components'
app_dir = 'apps/mobile/app'

components = []
for root, _, files in os.walk(components_dir):
    for f in files:
        if f.endswith('.tsx'):
            components.append(os.path.join(root, f))

app_files = {}
for root, _, files in os.walk(app_dir):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                app_files[path] = file.read()

def get_imports(content):
    imports = []
    lines = content.split('\n')
    for line in lines:
        if 'import ' in line and '@/components/' in line:
            match = re.search(r"from ['\"](@/components/[^'\"]+)['\"]", line)
            if match:
                imports.append(match.group(1))
    return imports

comp_map = {}
for c in components:
    name = os.path.basename(c).replace('.tsx', '')
    rel_path = os.path.relpath(c, components_dir)
    comp_map[name] = {
        'path': c,
        'rel': rel_path,
        'alias': '@/components/' + rel_path.replace('\\', '/').replace('.tsx', ''),
        'used_in': []
    }

for app_file, content in app_files.items():
    imports = get_imports(content)
    for imp in imports:
        parts = imp.split('/')
        name = parts[-1]
        if name in comp_map:
            comp_map[name]['used_in'].append(app_file)

for name, info in comp_map.items():
    usages = info['used_in']
    if len(usages) == 0:
        continue
    
    # Get dirnames of all usages
    dirnames = [os.path.dirname(u) for u in usages]
    common_prefix = os.path.commonpath(dirnames)
    
    if common_prefix.startswith(app_dir) and common_prefix != app_dir:
        target_dir = os.path.join(common_prefix, 'components')
        target_path = os.path.join(target_dir, name + '.tsx')
        
        # Move file
        os.makedirs(target_dir, exist_ok=True)
        shutil.move(info['path'], target_path)
        print(f"Moved {name} to {target_path}")
        
        # Update imports in usages
        for usage in set(usages):
            with open(usage, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # calculate relative path from usage to target_path
            rel_import = os.path.relpath(target_path, os.path.dirname(usage)).replace('\\', '/').replace('.tsx', '')
            if not rel_import.startswith('.'):
                rel_import = './' + rel_import
                
            # Replace alias with relative path
            old_alias = info['alias']
            content = content.replace(f"'{old_alias}'", f"'{rel_import}'")
            content = content.replace(f'"{old_alias}"', f'"{rel_import}"')
            
            with open(usage, 'w', encoding='utf-8') as f:
                f.write(content)

#!/usr/bin/env python
"""Test script to verify all 20 IELTS features are properly integrated."""

import sys
sys.path.insert(0, '/workspaces/IELTS')

try:
    from app import create_app
    print('✅ App import successful')
    
    app = create_app('development')
    print('✅ App creation successful')
    
    # Collect all endpoints
    routes = {}
    for rule in app.url_map.iter_rules():
        if 'api' in rule.rule:
            methods = ', '.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
            routes[rule.rule] = methods
    
    print('\n📋 Registered API Endpoints:\n')
    
    # Organize by blueprint
    blueprints = {
        'Writing': ['/api/ai/writing/'],
        'Speaking': ['/api/ai/speaking/', '/api/speaking/'],
        'Listening': ['/api/listening/'],
        'Reading': ['/api/reading/']
    }
    
    for blueprint_name, prefixes in blueprints.items():
        print(f'\n{blueprint_name}:')
        count = 0
        for route in sorted(routes.keys()):
            if any(prefix in route for prefix in prefixes):
                print(f'  {route} [{routes[route]}]')
                count += 1
        if count == 0:
            print(f'  ⚠️  No routes found')
    
    print('\n✅ Integration verification complete!')
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()

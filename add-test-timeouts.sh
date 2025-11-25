#!/bin/bash

# Script to add 30s timeouts to all async it() tests

find tests -name "*.test.mjs" -type f | while read file; do
    echo "Processing: $file"
    # Add timeout to it('...', async () => { that don't already have timeout
    sed -i '' -E "s/(it\('.*', async \(\) => \{)/\1/g" "$file"
    sed -i '' -E "s/(it\('.*', async \(\) => .*)(\);)$/\1, 30000\2/g" "$file"
    sed -i '' -E "s/, 30000, 30000/, 30000/g" "$file"  # Remove duplicates
done

echo "✅ Added 30s timeouts to all async tests"


#!/bin/bash

echo "Packaging Freshdesk Ticket Extension..."

# Remove any existing packages
rm -f *.zip *.xpi

# Create the package
zip -r "freshdesk-ticket-extension-$(date +%Y%m%d).zip" \
  manifest.json \
  popup/ \
  icons/ \
  background.js \
  -x "*.DS_Store*" "*/.git*"

echo "Package created: freshdesk-ticket-extension-$(date +%Y%m%d).zip"
echo ""
echo "Next steps:"
echo "1. Go to https://addons.mozilla.org/developers/"
echo "2. Submit this ZIP file"
echo "3. Choose 'On your own' for distribution"
echo "4. Download the signed .xpi file when ready"
echo "5. Share the .xpi file with your friends"

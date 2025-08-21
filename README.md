
# Freshdesk Ticket Extension

## What is this?
This is a Firefox extension that lets you quickly create Freshdesk tickets directly from your browser. You can select companies, contacts, add work notes, and track time - all without leaving Firefox!

## Manual Installation Steps

### Step 1: Download the Extension
1. Download the zip file from github and extract to a folder to your computer
2. Remember where you saved it (you'll need this folder to stay in place)

### Step 2: Install in Firefox
1. **Open Firefox**
2. **Type** `about:debugging` in the address bar and press Enter
3. **Click** "This Firefox" on the left sidebar
4. **Click** the "Load Temporary Add-on..." button
5. **Navigate** to the extension folder you downloaded
6. **Select** the `manifest.json` file and click "Open"
7. **Success!** You should see the extension listed and a new icon in your Firefox toolbar

### Step 3: Configure Your Freshdesk Settings
1. **Click** the extension icon in your Firefox toolbar (looks like a ticket/gear icon)
2. **Click** the settings gear (⚙️) in the top-right corner
3. **Fill in your Freshdesk information:**
   - **API Key**: Found in your Freshdesk profile → "Show API Key"
   - **Domain**: Just your company name (e.g., "mycompany" for mycompany.freshdesk.com)
   - **Agent ID**: Your agent ID from your Freshdesk profile URL (optional but recommended)
4. **Click** "Save Settings"
5. **Wait** for it to load your companies (this confirms everything is working)

### Step 4: Start Creating Tickets!


## Important Notes

⚠️ **Temporary Installation**: This installation method is temporary. The extension will be removed when you restart Firefox. You'll need to repeat Step 2 each time you restart Firefox.

🔒 **Your Data**: All your settings (API key, domain, etc.) are stored locally in Firefox. Nothing is sent anywhere except directly to your Freshdesk instance.

🔄 **Updates**: When I release updates, you'll need to download the new folder and repeat the installation steps.

## Troubleshooting

### Extension Icon Not Showing
- Make sure you selected the `manifest.json` file during installation
- Try refreshing the page or restarting Firefox

### "API Key Not Configured" Error
- Go to settings (gear icon) and make sure you've entered your API key and domain
- Test by clicking "Save Settings" - it should load your companies

### No Companies/Contacts Loading
- Double-check your API key and domain in settings
- Make sure your domain is just the name (not the full URL)
- Verify you have permission to access companies and contacts in Freshdesk

### Extension Disappeared After Restart
- This is normal for temporary installations
- Go back to `about:debugging` and reload the extension

## Getting Your Freshdesk API Key

1. **Log into** your Freshdesk account
2. **Click** your profile picture in the top-right
3. **Select** "Profile Settings"
4. **Look for** "Your API Key" section
5. **Click** "Show API Key"
6. **Copy** the key and paste it into the extension settings

## Need Help?

If you run into issues:
1. Check the browser console for error messages (F12 → Console tab)
2. Make sure your Freshdesk permissions allow API access
3. Contact me with any error messages you see

## Features

✅ Create tickets with custom subjects and descriptions   
✅ Add private work notes  
✅ Track time spent  
✅ Choose whether to send email notifications  
✅ Automatic ticket URL generation  
✅ Form validation and error handling  

Enjoy creating tickets faster! 🎫

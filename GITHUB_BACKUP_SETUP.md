# GitHub API Backup Setup Guide

Automatically backup your invoice data to a **separate private GitHub repository** using the GitHub API.

## Why This Approach?

✅ **Separate Repository** - Backups stored in a different repo from your code  
✅ **Private & Secure** - Your data stays in your private GitHub repo  
✅ **One-Click Backup** - No manual file saving or git commands  
✅ **Direct from Browser** - Uses GitHub API, no local Git needed  
✅ **Automatic** - Just click the button, data is pushed instantly  

## Setup Steps

### 1. Create a Private Backup Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new **private** repository
   - Name: `invoice-backups` (or any name you prefer)
   - **Privacy**: Private
   - **README**: Optional (can add one)
   - **Create the backups folder**: After creating, manually add a `backups/` folder (create a file like `backups/README.md`)

### 2. Generate a Personal Access Token (Fine-grained)

1. Go to: [GitHub Settings → Personal Access Tokens (fine-grained)](https://github.com/settings/personal-access-tokens/new)
2. Click **"Generate new token"**
3. Configure:
   - **Token name**: `invoice-generator-backup`
   - **Expiration**: Choose your preference (90 days, 1 year, or custom)
   - **Repository access**: Select "Only select repositories"
     - Choose your `invoice-backups` repository
   - **Permissions**:
     - Under "Repository permissions"
     - Find **"Contents"**
     - Set to: **Read and write**
4. Click **"Generate token"**
5. **IMPORTANT**: Copy the token immediately (starts with `github_pat_`)
   - You won't be able to see it again!

### 3. Configure in Invoice Generator

1. Open your invoice generator app
2. Go to **Settings** tab
3. Scroll to **"GitHub Backup (Private Repo)"** section
4. Fill in:
   - **GitHub Personal Access Token**: Paste your token
   - **Repository Owner**: Your GitHub username
   - **Repository Name**: `invoice-backups` (or whatever you named it)
   - **Branch**: `main` (or `master` if that's your default)
5. Click **"💾 Save Configuration"**

### 4. Test the Backup

1. Click **"🚀 Backup to GitHub Now"**
2. Wait for confirmation message
3. Check your `invoice-backups` repository on GitHub
4. You should see a new file in `backups/` folder!

## Usage

### Create a Backup

1. Open invoice generator → **Settings** tab
2. Click **"🚀 Backup to GitHub Now"**
3. Done! Check your GitHub repo to confirm

### Load Latest Backup

1. Open invoice generator → **Settings** tab  
2. Click **"⬇️ Load Latest Backup"**
3. Your data is instantly restored from the most recent backup!

**Note:** This automatically finds and loads the newest backup file from your GitHub repository.

### Restore from Backup

1. Go to your GitHub backup repository
2. Download any backup file from `backups/` folder
3. In invoice generator: **Settings** → **"⬆️ Import Backup"**
4. Select the downloaded JSON file

## Backup File Format

Files are saved as:
```
backups/invoice-backup-2025-11-19T21-57-30.json
```

Each contains:
- All invoice history
- Saved client profiles
- Saved issuer/sender profiles
- Last invoice number
- Timestamp

## Security Best Practices

✅ **Use Fine-Grained Tokens** - More secure than classic PATs  
✅ **Minimal Permissions** - Only "Contents: Read & Write" for one repo  
✅ **Set Expiration** - Tokens should expire (90 days recommended)  
✅ **Private Repository** - Never use a public repo for backups  
✅ **Regenerate Regularly** - Create new tokens periodically  

## Troubleshooting

**"Invalid GitHub token"**
- Check that your token hasn't expired
- Verify you copied the entire token (starts with `github_pat_`)
- Make sure the token has "Contents" write permission

**"Repository not found"**
- Verify owner and repo name are correct
- Check that the repository exists and is accessible
- Ensure your token has access to this specific repository

**"GitHub API error"**
- Check your internet connection
- Verify the branch name is correct (`main` or `master`)
- The `backups/` folder must exist in your repo

## Token Expiration

When your token expires:
1. Generate a new token (follow Step 2 above)
2. Update in Settings → GitHub Backup section
3. Click "Save Configuration"

## FAQ

**Q: Is my token safe?**  
A: It's stored in browser localStorage. Use fine-grained tokens with minimal permissions for best security.

**Q: Can I backup automatically?**  
A: Currently manual. You could set up a browser extension or script to automate it.

**Q: What if I lose access to GitHub?**  
A: Always keep local exports too! Use "Export Backup" button to download JSON files.

**Q: Can I use a classic token instead?**  
A: Yes, but fine-grained tokens are recommended for better security.

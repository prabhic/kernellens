# Branch Cleanup

This directory contains tools for cleaning up branches in the repository, keeping only the `main` branch.

## Current Branches

As of the cleanup preparation, the following branches exist:

**Remote branches:**
- `claude/kernel-lens-visualization-evolution-011CV3Cmv7nLPDo6jZMHVfMP`
- `claude/merge-user-overview-view-011CV3qqKTN7sV2hgXJCh6Hb`
- `claude/understand-codebase-011CV566ofojrTFH2wiQUz3F`
- `claude/user-overview-view-011CV2Y7PADRrivCR9ZrSdmM`
- `claude/visualize-kernel-execution-011CV2CLYcGqRBabRM7biquk`
- `claude/visualize-kernel-execution-011CV3V921gNFkrNzoaX6Wiu`
- `copilot/clear-all-branches`

## Cleanup Methods

### Method 1: GitHub Actions Workflow (Recommended)

A GitHub Actions workflow has been created at `.github/workflows/cleanup-branches.yml`.

To run it:
1. Go to the repository's Actions tab on GitHub
2. Select "Cleanup Branches" workflow
3. Click "Run workflow"
4. Choose whether to do a dry run (recommended first)
5. Click "Run workflow" button

The workflow will:
- Fetch all branches
- List branches to be deleted
- Delete all branches except `main`

### Method 2: Manual Script

A bash script `cleanup-branches.sh` is provided for local execution.

**Prerequisites:**
- Git repository with push access
- Authenticated git remote

**Usage:**
```bash
# Run from repository root
./cleanup-branches.sh
```

**Warning:** This will immediately delete all branches except main, both locally and remotely.

## Manual Cleanup (Alternative)

If you prefer to delete branches manually:

### Delete remote branches:
```bash
# List all remote branches
git ls-remote --heads origin

# Delete a specific remote branch
git push origin --delete <branch-name>

# Delete all branches except main (bash one-liner)
git branch -r | grep -v "main" | grep -v "HEAD" | sed 's/origin\///' | xargs -I {} git push origin --delete {}
```

### Delete local branches:
```bash
# Switch to main first
git checkout main

# Delete all local branches except main
git branch | grep -v "main" | xargs git branch -D
```

## Post-Cleanup

After running the cleanup:
- Only the `main` branch will remain
- All other branches will be permanently deleted
- Ensure any important code from deleted branches has been merged to main before cleanup

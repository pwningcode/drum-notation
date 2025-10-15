# GitHub Pages Deployment Guide

This guide will help you deploy your drum notation app to GitHub Pages at `drum.fvcsolutions.com`.

## Prerequisites

1. A GitHub repository with your code
2. A custom domain `drum.fvcsolutions.com` configured in your DNS settings
3. GitHub Pages enabled for your repository

## Configuration Steps

### 1. DNS Configuration

Configure your DNS settings to point `drum.fvcsolutions.com` to GitHub Pages:

```
Type: CNAME
Name: drum
Value: your-username.github.io
```

### 2. GitHub Repository Settings

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Go to **Settings** → **Actions** → **General**
5. Under **Workflow permissions**, select **Read and write permissions**
6. Check **Allow GitHub Actions to create and approve pull requests**
7. The workflow will automatically deploy when you push to the `main` branch

### 3. Custom Domain Setup

1. In your repository settings, go to **Pages**
2. Under **Custom domain**, enter `drum.fvcsolutions.com`
3. Check **Enforce HTTPS** (recommended)

## Deployment Methods

### Automatic Deployment (Recommended)

The project is configured with GitHub Actions for automatic deployment:

- **Trigger**: Pushes to the `main` branch
- **Workflow**: `.github/workflows/deploy.yml`
- **Output**: Deploys to `gh-pages` branch
- **Domain**: `drum.fvcsolutions.com`

### Manual Deployment

You can also deploy manually using npm scripts:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Project Configuration

The following files have been configured for GitHub Pages deployment:

### Vite Configuration (`vite.config.ts`)
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/drum-notation/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
```

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)
- Builds the project using Node.js 18
- Deploys to GitHub Pages using `peaceiris/actions-gh-pages`
- Configures custom domain `drum.fvcsolutions.com`

### CNAME File (`public/CNAME`)
Contains the custom domain: `drum.fvcsolutions.com`

### Package.json Scripts
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist",
    "predeploy": "npm run build"
  }
}
```

## Troubleshooting

### Build Issues
- Ensure all TypeScript errors are resolved
- Run `npm run build` locally to test the build process

### Deployment Issues
- Check GitHub Actions logs for deployment errors
- Verify DNS configuration for custom domain
- Ensure GitHub Pages is enabled in repository settings

### Custom Domain Issues
- DNS propagation can take up to 24 hours
- Verify CNAME record points to `your-username.github.io`
- Check that the custom domain is properly configured in GitHub Pages settings

### GitHub Actions Permission Issues
If you see errors like "Permission to [repo] denied to github-actions[bot]":
1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**
4. Save the changes and re-run the workflow

## Local Development

To run the project locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## File Structure

```
drum-notation/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/
│   └── CNAME                   # Custom domain configuration
├── src/                        # Source code
├── dist/                       # Built files (generated)
├── vite.config.ts              # Vite configuration for GitHub Pages
└── package.json                # Dependencies and scripts
```

## Support

If you encounter issues with deployment:

1. Check the GitHub Actions workflow logs
2. Verify your DNS configuration
3. Ensure all build steps complete successfully
4. Check that the custom domain is properly configured in GitHub Pages settings

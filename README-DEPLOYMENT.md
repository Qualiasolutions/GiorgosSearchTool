# Deploying GiorgosPowerSearch to the Web

This guide explains how to deploy GiorgosPowerSearch to Render.com, making it accessible on both desktop and mobile devices through a web browser.

## Prerequisites

- A GitHub account
- A Render.com account (free tier is sufficient)

## Step 1: Prepare Your Code Repository

1. Push your code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for web deployment"
   git remote add origin https://github.com/yourusername/giorgospowersearch.git
   git push -u origin main
   ```

## Step 2: Deploy to Render.com

### Option 1: Deploy Using render.yaml (Easiest)

1. Log in to [Render.com](https://render.com)
2. Click "New" and select "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file and set up the services
5. Click "Apply" to start the deployment

### Option 2: Manual Setup

If you prefer to set up services manually:

#### Deploy the Backend API

1. Log in to [Render.com](https://render.com)
2. Click "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `giorgospowersearch-api`
   - Environment: `Python 3`
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && python app.py`
   - Add environment variable:
     - `PORT`: `8080`
     - `PYTHON_VERSION`: `3.9.0`
5. Click "Create Web Service"

#### Deploy the Frontend

1. In Render.com, click "New" and select "Static Site"
2. Connect your GitHub repository
3. Configure the service:
   - Name: `giorgospowersearch-web`
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/build`
4. Add environment variables (if needed)
5. Under the "Redirects/Rewrites" tab, add:
   - Source: `/api/*`
   - Destination: `https://giorgospowersearch-api.onrender.com/api/:splat`
   - Type: Rewrite
   - Add another rule:
   - Source: `/*`
   - Destination: `/index.html`
   - Type: Rewrite
6. Click "Create Static Site"

## Step 3: Access Your Deployed Application

After deployment completes (which may take a few minutes):

1. Your frontend will be available at: `https://giorgospowersearch-web.onrender.com`
2. Share this URL with your friends, and they can access it from any device with a web browser

## Mobile Access

The web application is fully responsive and works on mobile devices. Users simply need to:

1. Open their mobile browser (Chrome, Safari, etc.)
2. Navigate to your application's URL
3. For easier access, they can add the website to their home screen:
   - On iOS: Tap the share icon and select "Add to Home Screen"
   - On Android: Tap the menu (three dots) and select "Add to Home Screen"

## Troubleshooting

- **API Connection Issues**: Ensure the frontend is correctly configured to use the deployed API URL
- **Deployment Failures**: Check the build logs in Render.com for specific errors
- **CORS Errors**: Confirm the CORS setup in the backend is correctly allowing your frontend domain

## Updating Your Deployment

When you push new changes to your GitHub repository, Render will automatically rebuild and deploy your application.

## Limitations of the Free Tier

- Services on the free tier may "spin down" after periods of inactivity
- Initial load after inactivity may be slow as the service spins up
- Limited compute resources and bandwidth 
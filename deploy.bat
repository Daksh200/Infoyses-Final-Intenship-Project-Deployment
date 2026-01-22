@echo off
echo 🚀 Fraud Detection App Deployment Script
echo ========================================

echo.
echo Step 1: Setting up Python virtual environment...
cd server
python -m venv venv
call venv\Scripts\activate.bat

echo.
echo Step 2: Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Step 3: Setting up Node.js dependencies...
cd ..
cd client
npm install

echo.
echo Step 4: Building frontend...
npm run build

echo.
echo ✅ Local setup complete!
echo.
echo Next steps:
echo 1. Set up Neon database at https://neon.tech
echo 2. Deploy backend to Render at https://render.com
echo 3. Deploy frontend to Vercel at https://vercel.com
echo.
echo Follow the detailed guide in TODO.md for deployment instructions.

pause

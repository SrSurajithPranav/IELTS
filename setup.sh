#!/bin/bash
# Quick start script for IELTS backend

echo "🚀 IELTS Backend Setup"
echo "===================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Create .env file
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "⚠️  Edit .env with your Cloudinary credentials"
fi

# Initialize database
echo "🗄️  Initializing database..."
python3 << EOF
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print("✅ Database initialized!")
EOF

echo ""
echo "✨ Setup complete! Run: python app.py"
echo "🌐 Access at: http://localhost:5000"

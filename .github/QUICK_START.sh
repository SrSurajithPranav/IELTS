#!/usr/bin/env bash
# Quick Start Guide - 20 IELTS Features

echo "🚀 IELTS 20-Feature Platform - Quick Start Guide"
echo "=================================================="
echo ""

# Check Python
echo "✓ Checking Python..."
if python --version 2>/dev/null; then
    echo "  Python: $(python --version)"
else
    echo "  ✗ Python not found"
    exit 1
fi

# Check Node.js
echo "✓ Checking Node.js..."
if node --version 2>/dev/null; then
    echo "  Node: $(node --version)"
    echo "  NPM: $(npm --version)"
else
    echo "  ✗ Node.js not found"
    exit 1
fi

echo ""
echo "📦 Setup Steps:"
echo "==============="

echo ""
echo "1️⃣  Virtual Environment (if needed)"
echo "   cd /workspaces/IELTS"
echo "   python -m venv venv"
echo "   source venv/bin/activate"

echo ""
echo "2️⃣  Install Python Dependencies"
echo "   pip install -r requirements.txt"

echo ""
echo "3️⃣  Install Node Dependencies"
echo "   npm install"

echo ""
echo "4️⃣  Start Backend"
echo "   source venv/bin/activate"
echo "   python app.py"

echo ""
echo "5️⃣  Start Frontend (in new terminal)"
echo "   npm run dev"

echo ""
echo "📋 Feature Component Imports:"
echo "=============================="

echo ""
echo "✍️  WRITING FEATURES:"
echo "import SentenceStarterLibrary from '../components/writing/SentenceStarterLibrary';"
echo "import EssayStructureChecker from '../components/writing/EssayStructureChecker';"
echo "import CohesiveDeviceAnalyzer from '../components/writing/CohesiveDeviceAnalyzer';"
echo "import ClicheDetector from '../components/writing/ClicheDetector';"
echo "import TimedWritingTest from '../components/writing/TimedWritingTest';"

echo ""
echo "🎙️  SPEAKING FEATURES:"
echo "import SpeakingTimer from '../components/speaking/SpeakingTimer';"
echo "import Part3DepthChecker from '../components/speaking/Part3DepthChecker';"
echo "import FillerWordDetector from '../components/speaking/FillerWordDetector';"

echo ""
echo "👂 LISTENING FEATURES:"
echo "import DictationDrill from '../components/listening/DictationDrill';"

echo ""
echo "📖 READING FEATURES:"
echo "import AWLHighlighter from '../components/reading/AWLHighlighter';"
echo "import NGFalseDrill from '../components/reading/NGFalseDrill';"

echo ""
echo "🧪 Test Integration"
echo "===================="
echo "   python test_integration.py"

echo ""
echo "📚 Full Documentation"
echo "====================="
echo "   See: .github/INTEGRATION_GUIDE.md"
echo "   See: .github/FEATURES_IMPLEMENTATION.md"

echo ""
echo "✅ All set! Start building with the 20 IELTS features."
echo ""

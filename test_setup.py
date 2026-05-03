"""
Simple test script to verify backend setup.
Run: python test_setup.py
"""
import sys
import os

def test_imports():
    """Test if all required modules can be imported."""
    print("Testing imports...")
    try:
        from flask import Flask
        print("✅ Flask")
        from flask_sqlalchemy import SQLAlchemy
        print("✅ Flask-SQLAlchemy")
        from flask_jwt_extended import JWTManager
        print("✅ Flask-JWT-Extended")
        from flask_cors import CORS
        print("✅ Flask-CORS")
        import cloudinary
        print("✅ Cloudinary")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_models():
    """Test if models can be imported."""
    print("\nTesting models...")
    try:
        from models.db import db
        print("✅ Database")
        from models.user import User
        print("✅ User")
        from models.plan import Plan
        print("✅ Plan")
        from models.task import Task
        print("✅ Task")
        from models.student_plan import StudentPlan
        print("✅ StudentPlan")
        from models.submission import Submission
        print("✅ Submission")
        from models.batch import Batch, BatchMember
        print("✅ Batch & BatchMember")
        return True
    except ImportError as e:
        print(f"❌ Model import error: {e}")
        return False

def test_app_creation():
    """Test if app can be created."""
    print("\nTesting app creation...")
    try:
        from app import create_app
        app = create_app('testing')
        print("✅ App created successfully")
        return True
    except Exception as e:
        print(f"❌ App creation error: {e}")
        return False

def test_database():
    """Test database initialization."""
    print("\nTesting database...")
    try:
        from app import create_app, db
        app = create_app('testing')
        with app.app_context():
            db.create_all()
            print("✅ Database tables created")
        return True
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def test_auth_routes():
    """Test if auth routes are registered."""
    print("\nTesting auth routes...")
    try:
        from app import create_app
        app = create_app('testing')
        routes = [rule.rule for rule in app.url_map.iter_rules()]
        required_routes = ['/api/auth/register', '/api/auth/login', '/api/auth/me']
        for route in required_routes:
            if any(route in r for r in routes):
                print(f"✅ {route}")
            else:
                print(f"❌ {route} not found")
                return False
        return True
    except Exception as e:
        print(f"❌ Route error: {e}")
        return False

if __name__ == '__main__':
    print("🧪 IELTS Backend Setup Test\n")
    
    results = []
    results.append(("Imports", test_imports()))
    results.append(("Models", test_models()))
    results.append(("App Creation", test_app_creation()))
    results.append(("Database", test_database()))
    results.append(("Routes", test_auth_routes()))
    
    print("\n" + "="*40)
    print("📊 Test Summary:")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {name}")
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Backend is ready.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Check setup.")
        sys.exit(1)

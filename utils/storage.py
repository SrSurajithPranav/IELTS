import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def upload_audio(file, folder='uploads'):
    """
    Upload audio to Cloudinary free tier.
    Free tier: 25GB storage, 25GB bandwidth/month.
    """
    try:
        result = cloudinary.uploader.upload(
            file,
            resource_type='video',  # Cloudinary uses 'video' for audio files
            folder=f'ielts/{folder}',
            allowed_formats=['mp3', 'wav', 'webm', 'ogg', 'm4a'],
        )
        return result.get('secure_url')
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return None

def delete_audio(public_id):
    try:
        cloudinary.uploader.destroy(public_id, resource_type='video')
    except Exception as e:
        print(f"Cloudinary delete error: {e}")

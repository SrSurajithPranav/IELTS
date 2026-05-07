import cloudinary
import cloudinary.uploader
import os

CONFIGURED = bool(os.getenv('CLOUDINARY_CLOUD_NAME'))

if CONFIGURED:
    cloudinary.config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET'),
        secure=True,
    )

LOCAL_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)

def upload_audio(file_obj, folder='uploads'):
    """
    Upload audio to Cloudinary. If Cloudinary is not configured, save locally.
    """
    if CONFIGURED:
        try:
            result = cloudinary.uploader.upload(
                file_obj,
                resource_type='video',
                folder=f'ielts/{folder}',
                allowed_formats=['mp3', 'wav', 'webm', 'ogg', 'm4a', 'aac'],
                overwrite=False,
            )
            return result.get('secure_url')
        except Exception as e:
            print(f'[Cloudinary] upload failed: {e}')

    try:
        filename = getattr(file_obj, 'filename', None) or 'audio.webm'
        safe_name = f"{folder}_{os.urandom(4).hex()}_{filename}"
        save_path = os.path.join(LOCAL_UPLOAD_DIR, safe_name)
        if hasattr(file_obj, 'save'):
            file_obj.save(save_path)
        else:
            with open(save_path, 'wb') as f:
                f.write(file_obj.read())
        return f'/uploads/{safe_name}'
    except Exception as e:
        print(f'[Storage] local save failed: {e}')
        return None

def delete_audio(public_id):
    try:
        cloudinary.uploader.destroy(public_id, resource_type='video')
    except Exception as e:
        print(f"Cloudinary delete error: {e}")

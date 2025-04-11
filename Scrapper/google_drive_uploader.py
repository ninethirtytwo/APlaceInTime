from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import os
import json

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_drive_service():
    """Get authenticated Google Drive service"""
    creds = None
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_info(
            json.loads(open('token.json').read()), SCOPES)
    
    # If credentials don't exist or are invalid, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    
    # Create Drive API client
    return build('drive', 'v3', credentials=creds)

def save_as_note(title, content, folder_id):
    """Save content as a text file (note) in Google Drive"""
    service = get_drive_service()
    
    # Create file metadata
    file_metadata = {
        'name': f"{title}.txt",
        'mimeType': 'text/plain'
    }
    
    if folder_id:
        file_metadata['parents'] = [folder_id]
    
    # Create temporary file
    temp_filename = f"temp_{title.replace(' ', '_')}.txt"
    with open(temp_filename, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Upload file
    media = MediaFileUpload(temp_filename, mimetype='text/plain')
    file = service.files().create(body=file_metadata,
                                 media_body=media,
                                 fields='id').execute()
    
    # Clean up temporary file
    os.remove(temp_filename)
    
    return file.get('id')
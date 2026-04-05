import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

TOKEN_PATH = "token.json"
CREDENTIALS_PATH = "credentials.json"


def get_gmail_service():
    creds = None

    # If saved credentials exist, use that
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

    # Requests credentials if no credentials or it's invalid
    if not creds or not creds.valid:
        # Credentials just expired, refresh them
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        # No credentials at all, so get full login info
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)
        # Save new credentials to file
        with open(TOKEN_PATH, "w") as token:
            token.write(creds.to_json())

    # Return gmail API client object
    return build("gmail", "v1", credentials=creds)

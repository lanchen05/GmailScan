from pathlib import Path
import pickle

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CREDENTIALS_FILE = PROJECT_ROOT / "credentials.json"
DEFAULT_TOKEN_FILE = PROJECT_ROOT / "token.pickle"


def _load_cached_credentials(token_path: Path):
    if not token_path.exists():
        return None

    with token_path.open("rb") as token_file:
        creds = pickle.load(token_file)

    if isinstance(creds, Credentials):
        return creds

    raise TypeError(f"Cached credentials in {token_path} are not a Google Credentials object.")


def _save_cached_credentials(token_path: Path, creds: Credentials):
    token_path.parent.mkdir(parents=True, exist_ok=True)
    with token_path.open("wb") as token_file:
        pickle.dump(creds, token_file)


def get_gmail_service(
    credentials_path: str | Path = DEFAULT_CREDENTIALS_FILE,
    token_path: str | Path = DEFAULT_TOKEN_FILE,
    scopes: list[str] | tuple[str, ...] = SCOPES,
):
    """
    Authenticate with Gmail and return an API service client.

    `credentials.json` and `token.pickle` default to the project root so the
    crawler works regardless of the current working directory.
    """
    credentials_path = Path(credentials_path).expanduser().resolve()
    token_path = Path(token_path).expanduser().resolve()

    creds = _load_cached_credentials(token_path)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not credentials_path.exists():
                raise FileNotFoundError(
                    "Missing Google OAuth client file. "
                    f"Expected credentials.json at {credentials_path}."
                )

            flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), list(scopes))
            creds = flow.run_local_server(port=0)

        _save_cached_credentials(token_path, creds)

    return build("gmail", "v1", credentials=creds)

LABEL_NAME = "GmailScan"


def get_or_create_label(service, name: str = LABEL_NAME) -> str:
    """
    Return the label ID for `name`.
    Reuses the existing label if found, otherwise creates it.
    """
    response = service.users().labels().list(userId="me").execute()
    for label in response.get("labels", []):
        if label["name"] == name:
            print(f'Using existing Gmail label "{name}" (id={label["id"]})')
            return label["id"]

    created = service.users().labels().create(
        userId="me",
        body={
            "name": name,
            "labelListVisibility": "labelShow",
            "messageListVisibility": "show",
        },
    ).execute()
    print(f'Created Gmail label "{name}" (id={created["id"]})')
    return created["id"]


def apply_label(service, message_id: str, label_id: str) -> None:
    """Add `label_id` to a Gmail message."""
    service.users().messages().modify(
        userId="me",
        id=message_id,
        body={"addLabelIds": [label_id]},
    ).execute()

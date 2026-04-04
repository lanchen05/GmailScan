# GmailScan

- Tasks
    - Utilize Gmail API to create to 'Email' files to parse through
        - 'Email' objects will be created and put into an arraylist
        - cap of 50-100 email objects in a list at any given time
        - use FIFO to handle arraylist scheduling

    - Create an algo that takes an 'Email' object and parse through the object
        - algo will be trained to look for keywords of sensitive information
            - includes "Password", "User ID", "Email Address", Personal Information etc.

    - Algo will then separate the 'Email Objects' into 2 different arraylists
        - ifSensitive list
        - !ifSensitve list

    - Once all files are gone through, will return the ifSensitive arraylist
        - translate the 'Email' objects back into the Gmail API
        - show which emails have sensitive information and which ones to delete

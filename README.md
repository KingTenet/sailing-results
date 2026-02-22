# App pre-requisites

```
yarn > 1.22.0
node > 17.3.0
```

# App installation

```
git clone git@github.com:KingTenet/sailing-results.git
cd sailing-results
yarn install
```

# Setup GCP credentials

The app authenticates with Google Sheets using a GCP service account. To set this up:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and select your project.
2. Navigate to **IAM & Admin > Service Accounts**.
3. Click **Create Service Account**, give it a name, and click **Done**.
4. Click on the new service account, go to the **Keys** tab, and click **Add Key > Create new key**.
5. Choose **JSON** and download the key file.
6. Rename the downloaded file to `read-write-dev.json` and place it in the project root.
7. Share your Google Sheet with the service account's `client_email` address, granting **Editor** access.

The `read-write-dev.json` file is gitignored and should never be committed.

# Building

To build the app with credentials from `read-write-dev.json`:

```
node build.js
```

# Documentation

See [docs/TECHNICAL_DEBT.md](docs/TECHNICAL_DEBT.md) for details on architectural decisions and known technical debt, including the usage of `google-auth-library` in the browser.


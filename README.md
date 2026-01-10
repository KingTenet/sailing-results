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

# Setup auth tokens in `auth.js`

```
cat << _EOF_ > auth.js
export const devReadWrite = {
    privateKey: <<INSERT PRIVATE KEY HERE>>,
    clientEmail: "read-write-dev@nhebsc-results.iam.gserviceaccount.com",
}
_EOF_
```

# Documentation

See [docs/TECHNICAL_DEBT.md](docs/TECHNICAL_DEBT.md) for details on architectural decisions and known technical debt, including the usage of `google-auth-library` in the browser.


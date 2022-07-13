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

# Scripts
## Import membership list
### Ensure that destination spreadhsheet does *NOT* have a sheet named "Active Membership"
```
rm -fr backend/ # This removes the local cache
node scripts/importActiveMembersList.js <<SOURCE_SPREADSHEET_URL>> <<DESTINATION_SPREADSHEET_URL>>

eg.
node scripts/importActiveMembersList.js https://docs.google.com/spreadsheets/d/1E_VGWu3QTFKxs2W9YkzvZVJvhVti05pmvpPSxk3L2js https://docs.google.com/spreadsheets/d/10eL8Nr1rVdVXxs-OIuoTsN3lrGYET4GaLY8-PHxISw0
```

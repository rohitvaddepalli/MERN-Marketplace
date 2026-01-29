# ⚠️ Critical: Storage Not Enabled Yet

The `gsutil ls` command returned **nothing**, which means **you have no Storage Buckets created yet!**

This is why the upload is failing. The "CORS error" is just a side effect of the system not finding a bucket to talk to.

### Step 1: Create the Bucket (Firebase Console)
1.  Go to your Firebase Console Storage section: [https://console.firebase.google.com/project/marketplace-2bd82/storage](https://console.firebase.google.com/project/marketplace-2bd82/storage)
2.  Click the **"Get started"** button.
3.  **Security Rules**: Choose **"Start in test mode"** (allows reads/writes for 30 days).
    *   *Click Next.*
4.  **Location**: Choose a location close to you (e.g., `asia-south1` or `us-central1`).
    *   *Click Done.*

### Step 2: Retry the Fix
**Wait 1 minute** after creating the bucket.

Then, go back to the **Google Cloud Shell** and run:

```bash
gsutil ls
```

Now you should see a name like `gs://marketplace-2bd82.appspot.com/`.

### Step 3: Run the CORS Fix
Copy the name from Step 2 and run:

```bash
echo '[{"origin": ["*"],"method": ["GET", "PUT", "POST", "DELETE", "OPTIONS"],"responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"],"maxAgeSeconds": 3600}]' > cors.json && gsutil cors set cors.json YOUR_BUCKET_NAME_HERE
```

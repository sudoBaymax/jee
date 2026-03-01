

## Fix Auth0 Callback URL Mismatch

### Problem
Auth0 rejects login because the app runs on the Lovable **preview** domain (`https://id-preview--a8fc9a29-3313-4784-b3e0-b799460356ee.lovable.app`) but only the **published** domain (`https://justenoughemotions.lovable.app`) is in Auth0's allowed URLs list.

### What you need to do in Auth0 Dashboard

Go to **Auth0 Dashboard -> Applications -> Your App -> Settings -> Application URIs** and add ALL of these origins (comma-separated) to each field:

**Allowed Callback URLs:**
```
https://justenoughemotions.lovable.app,https://id-preview--a8fc9a29-3313-4784-b3e0-b799460356ee.lovable.app,http://localhost:5173
```

**Allowed Logout URLs:**
```
https://justenoughemotions.lovable.app,https://id-preview--a8fc9a29-3313-4784-b3e0-b799460356ee.lovable.app,http://localhost:5173
```

**Allowed Web Origins:**
```
https://justenoughemotions.lovable.app,https://id-preview--a8fc9a29-3313-4784-b3e0-b799460356ee.lovable.app,http://localhost:5173
```

Hit **Save Changes**.

### Code change (minor cleanup)

No code changes are strictly required -- the current `redirect_uri: window.location.origin` is correct. However, I'll clean up the dead-code fallback message (the `if (!domain || !clientId)` block) since the values are now hardcoded and can never be falsy.

### Technical details

- `window.location.origin` dynamically picks up whichever domain the app is running on, so it works for both preview and published URLs
- The key Auth0 URL is the **preview** domain: `https://id-preview--a8fc9a29-3313-4784-b3e0-b799460356ee.lovable.app`
- The `Application Login URI` field in Auth0 is optional and unrelated to callback matching


# WHATSAPP BUSINESS SETUP

## Overview

SPIRIT AD AI uses the **WhatsApp Business Platform (Cloud API)** — the free official Meta API.  
You do NOT need a third-party BSP (like Twilio) to get started.

---

## 1. Meta Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com) and sign in
2. Click **My Apps → Create App**
3. Choose **Business** app type
4. Fill in app name (e.g. `Spirit AD AI`) and contact email
5. Click **Create App**

---

## 2. Add WhatsApp Product

In your app dashboard:
1. Click **Add Product**
2. Find **WhatsApp** → click **Set up**

---

## 3. Get Credentials

In **WhatsApp → API Setup**:

| Value | Environment Variable |
|---|---|
| **Temporary access token** | `WHATSAPP_ACCESS_TOKEN` |
| **Phone Number ID** | `WHATSAPP_PHONE_NUMBER_ID` |
| **WhatsApp Business Account ID** | `WHATSAPP_BUSINESS_ACCOUNT_ID` |

For production, generate a **Permanent System User Token**:
1. Go to **Business Settings → System Users**
2. Create a system user → Generate Token with `whatsapp_business_messaging` permission
3. Use this as `WHATSAPP_ACCESS_TOKEN`

---

## 4. Configure Webhook

In **WhatsApp → Configuration**:

1. Set **Callback URL** to:
   ```
   https://your-vercel-url.vercel.app/api/webhooks/whatsapp
   ```

2. Set **Verify token** — use any random string and add it to `.env.local`:
   ```
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-random-secret
   ```

3. Click **Verify and Save**

4. Subscribe to these webhook fields:
   - `messages`
   - `message_deliveries`
   - `message_reads`

---

## 5. Add Test Phone Number

In **WhatsApp → API Setup → To**:
1. Add your phone number to the allowed test numbers
2. Send a test message to verify the webhook receives it

---

## 6. Go Live Checklist

Before going live:
- [ ] App reviewed and approved by Meta
- [ ] Business verified in Meta Business Manager
- [ ] WhatsApp Business Account verified
- [ ] System User token generated (not temporary)
- [ ] Webhook deployed and verified
- [ ] Opt-in mechanism for customers configured

---

## 7. Message Templates (for outbound)

WhatsApp only allows free-form messages within a **24-hour conversation window**.  
For messages outside this window, you must use pre-approved **Message Templates**.

Create templates in **WhatsApp → Message Templates**.

---

## Webhook Payload Example

```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "2349037505632",
          "text": { "body": "How much is a crate of eggs?" },
          "id": "wamid.xxxx"
        }],
        "contacts": [{ "profile": { "name": "John Doe" } }],
        "metadata": { "phone_number_id": "your-phone-number-id" }
      }
    }]
  }]
}
```

The AI processes this and responds automatically via the official API.

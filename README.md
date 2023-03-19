# Peter Alerts
Web push Peter alerts inspired by https://github.com/kokoscript/PeterAlert

## What?
After registering, you'll get a notification every time someone else registers.

## Why?
To celebrate web push notifications being added to iOS 16.4

## How?
[Push API](https://web.dev/push-notifications-overview/) and Cloudflare Workers to deal with all the [nonsense](https://blog.mozilla.org/services/2016/08/23/sending-vapid-identified-webpush-notifications-via-mozillas-push-service/)

Can be deployed with `wrangler pages publish public/` assuming you have a Cloudflare account and [Wrangler](https://developers.cloudflare.com/workers/wrangler/) all set up.

`wranger.toml` doesn't seem to work, so you need to manually add a `PETERS` KV namespace and `SERVER_KEY` and `SUB` environment vars:
 - `SERVER_KEY` is a JWK and can be generated ala https://github.com/K0IN/Notify/blob/277ae6a8154480fcfd808d57afa63b3f946b7695/helper/browser.js
 - `SUB` is an email address Mozilla, Apple, or Google can use to contact you when they get sick of your shit.

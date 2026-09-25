# Thibodaux T-Box

Website for Thibodaux T-Box, an indoor golf simulator in Thibodaux, Louisiana.

## Pages

| URL | File |
| --- | --- |
| `/` | `index.html` (self-contained homepage) |
| `/memberships` | `memberships.html` |
| `/events` | `events.html` |
| `/gift-cards` | `gift-cards.html` |
| `/about` | `about.html` (about and contact) |
| any other path | `404.html` |

`vercel.json` turns on clean URLs, so `/memberships` serves `memberships.html`.

The inner pages share `assets/site.css` and `assets/site.js`. GSAP 3.12.5 and Lenis 1.1.14 load from CDNs on every page.

## Settings

Inner pages: the `SITE` object at the top of `assets/site.js`.

- `BOOKING_URL`: booking platform link for every Book Now and Book a Tee Time button
- `MEMBERSHIP_URL`: membership sign up (falls back to `BOOKING_URL`)
- `GIFT_CARD_URL`: gift card purchase (falls back to `BOOKING_URL`)
- `MEMBER_LOGIN_URL`: member login on the booking platform
- `FORM_ENDPOINT`: form service URL (for example Formspree) that emails event inquiries and contact messages to Lynn. Until it is set, the forms ask people to call.
- `FOUNDING_DEADLINE`: target opening day for the founding member countdown
- `PHONE`, `SOCIAL`: phone number for form messages, and Instagram and Facebook links

Homepage: the same `BOOKING_URL`, `MEMBER_LOGIN_URL`, `FOUNDING_DEADLINE` and `SOCIAL` settings sit at the top of the script in `index.html`. Keep both in sync.

The brand green is `--brand` at the top of the stylesheet.

## Assets

`assets/` holds the cropped logo files (`tbox-logo.png`, `tbox-logo-reverse.png`, `tbox-logo-cropped.png`), the nav lockups, the T mark, the favicon and the original logo upload.

## Tracking

Book Now, Join Now and gift card clicks, plus form submits, push events to `window.dataLayer` for GTM (and call the Meta Pixel when it is present). Paste the GTM container snippet where each page's head says so.

# EAS iOS Production Submission Details

**Date submitted:** 2026-06-09 (approx)

## Key Identifiers
- **ASC App ID:** 6778525849
- **EAS Project ID:** b7f3dc1f-e26b-4cb7-b8e2-9f91fe195ddf
- **Bundle Identifier:** com.zarathrift.app

## App Store Connect API Key (managed by EAS)
- Key Name: [Expo] EAS Submit RNNmFXGRPa
- Key ID: K26348TQFU
- Key Source: EAS servers (EAS manages the private key)

## Latest Production Build
- Archive URL (IPA): https://expo.dev/artifacts/eas/cbcFv5CGh1BGrSj3wQsGV8.ipa
- Submission Status: ✔ Scheduled iOS submission

## Notes
- Submitted using `eas submit --platform ios --profile production`
- This was the first production submission.
- The app uses background location (`UIBackgroundModes: location`) — this requires clear justification in App Store Connect → App Privacy and during review.
- Location feature: Only drivers (logged-in bike riders) share live GPS. Customers view the updates. Used to show real-time delivery progress for thrift orders.

## Useful Commands
- View builds: `npx eas build:list --platform ios`
- View submissions: `npx eas submit:list`
- New production build: `npx eas build --platform ios --profile production`

## App Store Connect
- Direct link: https://appstoreconnect.apple.com
- Search by ASC App ID: 6778525849

Keep this file for reference when requesting status, re-submitting, or contacting support.

---

# EAS Android Production Submission Details

**Date submitted:** 2026-06-09 (approx)

## Key Identifiers
- **EAS Project ID:** b7f3dc1f-e26b-4cb7-b8e2-9f91fe195ddf
- **Package Name:** com.zarathrift.app
- **Google Service Account:** play-console-service-account@my-expo-project-499013.iam.gserviceaccount.com (Key managed by EAS servers)

## Latest Production Build
- Build ID: 2ec98cf2-a581-40e3-9e63-655809fa5c2b
- App Version: 1.0.0
- Version Code: 2
- Build Date: 09/06/2026, 23:19:00
- Artifact: .aab (Android App Bundle)
- Release track: internal
- Submission Status: ✔ Submitted to Google Play Store

## Notes
- Submitted using `npx eas submit --platform android --profile production`
- This was the first Android production submission (after icon update and rebuild).
- The app uses background location for driver tracking — declare properly in Play Console content rating and privacy policy.
- Location feature: Only drivers share live GPS with customers for real-time delivery progress.
- New icon (ZARA THRIFT style) included in this build.
- Privacy Policy hosted on web app (deploy to make /privacy live).

## Useful Commands
- View builds: `npx eas build:list --platform android`
- View submissions: `npx eas submit:list`
- New production build: `npx eas build --platform android --profile production`

## Google Play Console
- Direct link: https://play.google.com/console
- App package: com.zarathrift.app
- After processing, manage in Play Console (store listing, releases, testing tracks).
- Start with Internal testing, then promote to Production.

## Store Listing Checklist (do in Play Console)
- App icon: 512x512 PNG (use your new generated icon, resize if needed)
- Feature graphic: 1024x500 PNG
- Screenshots: Prepare for phones (e.g. 1080x1920) and tablets (7" and 10"). Reuse/adapt from your prepared iPhone/iPad resized images in `zara photos/resized` and `ipad pictures` folders. Upload at least 2-8 per form factor.
- Short description: ~80 chars (reuse/adapt iOS promotional text)
- Full description: up to 4000 chars (reuse/adapt iOS description)
- Privacy Policy URL: https://yourdomain.com/privacy (deploy your Next.js web app first)
- Content rating: Complete the questionnaire (location for drivers, etc.)
- Pricing: Free (or set as needed)
- Category: Shopping (primary), Lifestyle (secondary)
- Target audience: General audience (or specify)
- Contact details, etc.

## Web App (for Privacy Policy & Contact)
- Privacy Policy: `app/privacy/page.tsx` (deploy to Vercel or similar)
- Contact Form: `app/contact/page.tsx`
- Update placeholders (phone, email, domain) with real info before deploying.
- Use the Privacy Policy URL in Play Console (and App Store Connect if not already).

## Next Steps
- Wait for build to appear in Play Console (check Test tracks).
- Complete store listing.
- Test with Internal track (add your email as tester).
- Promote to Production after review.
- Update this file with final Play Console details if needed.

---

**Combined Notes**
- Both iOS and Android submissions used the same EAS production profile and updated icon.
- Privacy Policy and contact form serve both platforms.
- Be aware of the "Zara" trademark warning in root README.md before public launch.
- Test thoroughly on both platforms.

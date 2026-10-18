# Manual testing still required

No real Android phone, iPhone or screen reader was available while preparing PR #1. Everything below was **not** done on a real device. The automated substitutes that did run are listed at the end, labelled as simulated or emulated.

Use the **PR preview build**, not production. Build it locally (`npm run build && npm run preview`, then open `http://<your-computer-ip>:4173/equanim/` from the phone on the same Wi-Fi). Use `npx vite preview --host` so the phone can reach it. Note that Chrome only offers installing on HTTPS or `localhost`, so the install steps (section 2) need either the live site after merge or a tunnel such as `adb reverse tcp:4173 tcp:4173` (Android over USB), which makes the phone see `http://localhost:4173/equanim/`.

Record the results in the PR. For each failure, note the step number, phone model, OS version and browser version, and attach a screenshot.

## 1 Android phone journey (Chrome on Android)

Before starting, if Equanim 1.0 is already used on this phone, **export a backup first**: Settings and Data › Export backup.

1. **Open.** Open the URL. Expected: Onboarding welcome, with no horizontal scrolling and no text cut off.
2. **Onboarding.** Go through all four steps and the sample journey. Expected: Back and Continue are reachable with your thumb, and the on-screen keyboard does not cover the name field when you type.
3. **Intention.** On Today, choose "Ask before assuming", edit the text, and tap Set intention. Expected: the saved intention shows, and the page does not jump.
4. **Scenario and feedback.** Practise › any scenario › tap two different responses. Expected: different feedback for each response. The reflection note field stays visible above the keyboard. Mark scenario complete works.
5. **Journal create and edit.** Journal › New entry › Incident reflection. Fill three fields, save, tap Edit, change one field, and save again. Expected: the changes persist, the keyboard never hides the Save button after scrolling, and there are no accidental taps on the bottom bar while typing.
6. **Library.** Open any reading and tap Mark as read. Expected: "Marked as read" replaces the button.
7. **Progress.** Expected: counts match what you did in steps 3–6.
8. **Reload.** Pull to refresh. Expected: everything is still there.
9. **Close and reopen.** Swipe Chrome away in the app switcher, then reopen the URL. Expected: everything is still there.
10. **Offline.** With the app opened once, turn on Airplane mode, then close and reopen the tab or the installed app. Expected: Equanim opens, you can add an intention, and readings open.
11. **Reconnect.** Turn Airplane mode off and reload. Expected: the intention written offline is still there, and no error appears.
12. **Narrow width and layout.**
    - Turn on Settings › Display › Font size: Largest, and Display size: Largest. Repeat steps 3–5.
    - Check every screen for clipped text, sideways scrolling, and content hidden behind the bottom navigation at the end of each page.
    - Check that dialogs (Erase all data, Install App guidance, Import) fit on screen and scroll.
    - Rotate to landscape once.

## 2 Install App (real browser prompt)

**Android Chrome (needs HTTPS or `adb reverse` to localhost):**
1. Settings and Data. Expected: an **Install App** button.
   - If Chrome has not offered install yet, the button opens "Installing Equanim" guidance, not nothing.
2. Tap Install App. Expected: Chrome's own install sheet appears once.
3. Tap **Cancel**. Expected: the message "Not installed. You can install later…". There is no repeated prompt and no banner on the next screen.
4. Reload and tap Install App again, then **Install**. Expected: "Equanim is installed…", and the Install App button disappears.
5. Open Equanim from the home-screen icon. Expected:
   - It opens without the browser address bar (standalone).
   - Settings shows "You are using the installed app" and no Install App button.
   - The icon is not cropped badly (maskable icon).
6. Uninstall from the launcher, reopen in Chrome, and repeat step 1.

**iPhone/iPad (Safari, then Chrome for iOS):**
1. Settings and Data › Install App. Expected: the "Add Equanim to your Home Screen" guide.
2. Follow the guide: Share › Add to Home Screen › Add. Report whether the wording matches what you see, including the "Open as Web App" toggle and where Share is on your iOS version.
3. Open from the Home Screen. Expected: standalone, and no Install App button in Settings.
4. Note: on iOS, the Home Screen app has **separate storage** from Safari. Export from Safari and import into the installed app to carry entries across. Check that this works.

**Desktop Chrome/Edge:** the sidebar Install App button should open the browser's install dialog. Firefox should show the guidance explaining that installing is not offered.

## 3 Updates

1. With the installed app open, merge and deploy any later change (or, locally, rebuild and serve).
2. Return to the app after more than 30 minutes, or reload. Expected: a calm "A new version of Equanim is ready" notice with **Update now**. Nothing reloads by itself.
3. Tap Update now. Expected: one reload, and all entries are intact.

## 3b Several tabs (desktop or phone browser)
1. Open Equanim in two tabs. Add a journal entry in tab 1, then in tab 2 without reloading. Expected: both entries appear in both tabs, and in a new third tab.
2. Edit the same journal entry in both tabs: open Edit in both, save tab 1, then save tab 2. Expected:
   - tab 2's text is kept;
   - a notice says the other version was saved;
   - Settings and Data › Recovery copies lists "Edits set aside" containing tab 1's text.
3. Put tab 2 in the background for a minute, add an entry in tab 1, then return to tab 2. Expected: the entry appears without reloading.
4. If a 1.0 tab can still be produced (an old installed copy that has not updated yet), add an entry there. Expected: it appears in 1.1 after switching to it, and nothing in 1.1 disappears.

## 4 Screen reader: TalkBack on Android (exact steps)

Turn TalkBack on: Settings › Accessibility › TalkBack › On. You can also hold both volume keys for 3 seconds if the shortcut is enabled.

The gestures: swipe right or left to move to the next or previous item, double-tap to activate, and swipe up then down to change the reading control (Headings, Links, Controls).

1. **Landmarks and headings.** On Today, set the reading control to Headings and swipe down through them. Expected order:
   1. "[orientation question]" (heading 1)
   2. "Morning intention"
   3. "Daily practice · N min"
   4. "Scenario of the day"
   5. "Evening reflection"
2. **Bottom navigation.** Swipe to the bottom bar. Expected: "Today, link, selected"; TalkBack may say "current page" instead of "selected". Each tab announces its name.
3. **Intention choices.** Expected: the intention cards are announced as radio buttons with "1 of 6" and "checked" or "not checked". Double-tap selects.
4. **Set intention.** Expected: after double-tapping Set intention, TalkBack announces "Intention saved" and focus lands on the saved intention, not the top of the page.
5. **Scenario.** Double-tap a response. Expected: the feedback card is read, starting with the pattern name, and the response is announced as "pressed". Mark scenario complete then moves focus to "Scenario completed".
6. **Forms and errors.** Journal › New entry › Incident reflection › Save entry with everything empty. Expected: the error is announced immediately (alert), and every field is announced with its question as its label.
7. **Dialogs.** Settings › Erase all data. Expected:
   - Focus moves into the dialog, and TalkBack reads its title and text.
   - Swiping does not leave the dialog.
   - Cancel returns focus to "Erase all data".
   - Repeat with Install App guidance and Import.
8. **Status messages.** Mark as read on a reading, and Mark practice complete. Expected: each confirmation is spoken.
9. **Switch.** Settings › "Show practice streaks". Expected: "switch, off" and then "on" after a double-tap.
10. **Images and icons.** Expected: decorative icons are silent, and no "unlabelled button" is reported anywhere.

Also repeat steps 1–7 with **VoiceOver** on an iPhone (Settings › Accessibility › VoiceOver; use the rotor for Headings) if one is available.

## What was automated instead (simulated or emulated, not real devices)

| Area | What ran | Label |
|---|---|---|
| Phone journey (all 12 steps except real touch and keyboard) | Playwright with a Pixel 7 profile in Chromium, 390×844 and 360×740 | Emulated |
| Offline reopen and reconnect | Playwright `context.setOffline`, new tab while offline | Real Chromium, emulated network |
| Install prompt accept and cancel | Unit tests, and one Playwright test with a synthetic `beforeinstallprompt` | **Simulated** |
| Installability | Chromium DevTools Protocol `Page.getInstallabilityErrors` (no errors) and `Page.getAppManifest` (no errors) | Real headless Chromium check |
| iOS guide | Unit tests plus Playwright with an iPhone user agent | **Emulated**, not Safari |
| Update flow | Playwright: changed service worker → "Update now" → takeover | Real Chromium |
| Keyboard, focus visibility, focus management, touch-target size, nothing hidden behind the bottom bar, layout shift | Playwright and RTL | Real Chromium, not a screen reader |
| Several tabs, 1.0 tab writing after the upgrade | Unit tests (deterministic, jsdom) and Playwright with several real Chromium tabs; the 1.0 writer is **simulated** | Real Chromium, simulated 1.0 |
| Contrast, names, landmarks | axe-core on every screen in light and dark | Automated |

# Full language translation

## Goal
Make the signed-in Smart Ledger experience consistently use the language selected in Profile or Settings. Telugu and Hindi should replace English labels, guidance, empty states, buttons, chart legends, and feedback messages.

## Changes
- Expand the shared translation dictionary for all visible signed-in text.
- Use the selected profile language throughout the dashboard, navigation, transaction forms and lists, Bank SMS, budgets, analytics, insights, reports, notifications, profile, and settings.
- Format dates and month names in the selected language.
- Keep user-entered data, bank names, transaction descriptions, currency values, and category data unchanged.
- Fix the existing page-error type issue found during the review.

## Verification
- Check Telugu, Hindi, and English views in the running app.
- Confirm language changes appear consistently on desktop and phone layouts.
- Confirm the app builds without errors.

## Technical details
Use the existing profile language value and shared `t()` helper rather than adding a second language system. Shared chart components will receive translated legend labels from their parent pages.

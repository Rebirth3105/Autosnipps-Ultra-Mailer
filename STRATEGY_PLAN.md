# Data Pipeline Strategy Plan

## Verified dataset status
- Source file: combined.csv
- Rows processed: 3100
- Unique emails: 3100
- Unique mobiles: 3100
- Duplicate emails: 0
- Duplicate mobiles: 0
- Invalid phone validation: no invalid phones found

## Recommended next actions
1. Use cleaned_combined.csv as the primary list for outreach.
2. Use recipients_pilot.csv as the first app-ready import batch for the recipients workflow.
3. Split the dataset into small test batches by country and domain before scaling.
4. Run a pilot campaign with a limited subset to measure deliverability and response quality.
5. Keep the same validation checks in place before each future import.

## Suggested rollout order
- Phase 1: pilot with 100-200 contacts
- Phase 2: expand to 500-1000 contacts after safe performance is confirmed
- Phase 3: run broader campaigns with segmentation and monitoring

## Notes
- The dataset is already clean enough for immediate use.
- The most common domains are gmail.com, yahoo.com, outlook.com, hotmail.com, and protonmail.com.
- The country-code distribution is broad and balanced, which supports a segmented rollout.

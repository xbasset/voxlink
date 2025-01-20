# Conversation flow

```mermaid
graph TD
    A1["1. Greeting"] -->|"After greeting is complete"| A2["2. Get reason for call"]
    A2 -->|"Once reason for calling is confirmed"| A3["3. Get preferred contact information"]
    A3 -->|"Once contact information is confirmed"| A4["4. Completion"]
``` 

## Details

1. **Greeting**
   - Greet the caller warmly
   - Explain that the user is unavailable
   - Introduce self as executive assistant

2. **Get reason for call**
   - Ask for reason for calling
   - Use `show_details_reason` function to confirm

3. **Get preferred contact information**
   - Request phone number or email
   - Use `show_details_email` or `show_details_phone` function to confirm

4. **Completion**
   - Thank the caller
   - Inform that the user will be notified
   - Close the call

See `lib/config.ts` for more details.
# Schedama.com #
## Create and share your important events ##

### Functionalities ###
With Schedama you can create an event, save it and share it with others so they can indicate their participation.

After **event creation**, two distinct links are generated:
1. **Participant link**     -> Anyone with this link can see the event and register availability and participation
2. **Administration link**  -> Anyone with this link can fully administrate the event. That includes modify dates and location, add/remove participants and even delete the event.
Links are saved in the history page for later use.


#### Participant page ####
**Users can see relevant event information such as**
- Title of the event
- Description
- Date(s) and Time(s) (you can insert multiple dates and times in order to let people indicate preference)
- Event's duration
- Location
- Participants

A countdown is also available showing remaining time until event starts (or ends if event is already started).

**Users can also**
- Indicate preferences and availability for the event
- See other participants and their preferences
- See participation on different proposed dates
- Share event by: displaying QR Code, send link via telegram, whatsapp or email, copy link to clipboard
- Add event to Google Calendar


#### History page #### 📖
Here you can find all the events created and/or opened from the current device.
**For each event in history are available**
- Title
- Date and time when you last opened the event
- Link for participant page
- Link for administration page (if you visited this page at least once)

**IMPORTANT!** History data makes use of local storage of the browser, so:
- Data are saved **locally** and it refers only to activities on the current device
- Data live on the browser so if you use more than one browser you won't see the same history
- If you delete your browser's data you'll lose event history (you can still clean your browsing history though...pheeww!)

#### Installation ####
Whait, whaaat??!?
Yes, you heard it right! You can install Schedama on your device.
Schedama.com is a PWA (Progressive Web App), that means you should see the option to install it on you device (Android, iOS, Windows, MacOS). Installation is lightweight, quick and convenient making Schedama appearance resemble a real application.
Search for "How to install a PWA" to see instruction and procedure (ehm, not here...just Google it!).

#### Administration page #### 🔑
**From administration page a user can manage all the relevant information and settings of the event, such as**
- Title
- Description
- Location
- Date and time
- Duration
- Theme (a different background image is applied to the participant page according to the theme)
- Participants
- Modify settings (basically what participants can and cannot do: edit/add/remove other participants)
- Cancel the event (even if it's sad)

Administration page can be reached via a special link containing a very extra super top-secret(ish) key, that is unique for the event.
Without the key (don't worry, it's saved in the link so you don't have to memorize it!) it is not possible to reach this page and to manage the event.

### Event administration ### 🔑
Newly created events will contain an "admin_key" field.
This key will be generated during event creation and it needs to be added as a parameter to the url in order to be able to open the event in edit mode.
An user trying to access the administration link without this key, would be redirected to event viewer (same as the participant link).


### Costs ### 💰
By using Schedama you agree on paying...ehm nothing 😝

### User's data ###
Schedama is a free-to-use, web app that doesn't collect data.
There is **no registration form** and **no login page** so only data you insert inside a created event are saved and only for the purpose of...well, letting you organise and share your event.
**What if I want all data of an event deleted?**
Well in that case, simply: 
1. Go to administration page of the event
2. Scroll to the bottom of the page and find the Danger zone
3. Don't worry it's not actually dangerous, it's just a cool name
4. Click "I understand" and cancel the event
5. After 2 days all event data will be permanently deleted in an automated way and won't be recoverable

In any case, don't write personal, secret or sensitive information inside the event...you never know.

**Enjoy!** 😎
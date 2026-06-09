# Anime Site JavaScript — How It Works

This is the client-side JS bundle for an anime streaming site. It's built on jQuery with a custom FW module system and uses module bundling via Browserify-style dependency management.

---

## Architecture

### Module System (`FW.define`)
A custom framework defines reusable UI modules:

```js
FW.define("ModuleName", { u: function(el) { ... } })
```

- `FW.define("Name", proto)` — creates a module class
- `FW.bind("selector")` — auto-instantiates modules on matching elements
- `FW.activate(els)` — triggers module initialization
- Modules use `u` (constructor) called with the jQuery element

All modules are wired in a central init function (e.g., `9.js`) that calls `.bind()` with CSS selectors.

### Dependency Graph
Files are organized as CommonJS modules (Browserify):
- `1` → Cookie abstraction
- `2` → Form serialization (multipart support)
- `3` → Core FW, AutoComplete, jQuery extensions
- `4` → Anti-devtool detection
- `5` → localStorage wrapper (with polyfill)
- `6` → Utilities (RC4 encryption, time formatting, UUID, AJAX wrapper)
- `7` → Main entry point — imports all modules
- `8` → AjaxForm, form handling with Turnstile
- `9` → UI components (FixedHeader, Shorting, Switch, Tabs, TopSearch, Tooltip, TimerCountDown, etc.)
- `10` → Homepage widgets (Hotest slider, Schedule, Continue Watching, Recent Updates)
- `11` → Broadcast event system & Toast notifications
- `12` → List filter (genre include/exclude)
- `13` → User system (panel, favorites, folders, notifications, avatar, watch status)
- `14` → Watch2gether (WebSocket rooms, sync playback, chat)
- `15` → Watch page (player, episodes, servers, skip time, rating, auto-play/next, keyboard shortcuts)

---

## Key Features

### 1. Recommendations (Infinite Scroll)
```
rec_page_num, rec_is_loading, rec_has_more_pages
```
- Loads recommendations from `/ajax/v2/recommendations?page=N&mov_id=X`
- Falls back to `/ajax/v2/trending` on failure
- Scroll-based loading at bottom of container

### 2. Auto-Next Episode
```js
localStorage.getItem("auto_next") → "1" = enabled
```
- `nextEpisodeOnComplete(epNum)` triggers when video hits 99.8% or `complete` event fires
- Uses `autoNextLock` to prevent double-trigger (10s debounce)
- `watchlog()` binds a `message` listener on the window to intercept player events

### 3. Video Player & Episode Switching
- `WatchManager` manages the entire watch page
- `WatchView` handles episode list, server list, player iframe
- Player is an iframe; communication via `postMessage` JSON protocol
- Events: `PLAYER_READY`, `META_LOADED`, `SEEK`, `PLAY_TIMING`, `PLAY_COMPLETED`, `EVENT_KEYBOARD`

### 4. Server & Episode Lists
- `/ajax/server/list?servers=ids` → returns server tabs (sub/dub/softsub)
- `/ajax/episode/list/{anime_id}` → returns episode list grouped by range
- Cookie `prefered_server_id` remembers last server choice
- Episode list supports filtering by type (sub/dub) and range

### 5. Auto Skip Intro/Outro
- `skip_data` from the source response contains `[intro_start, intro_end]` and `[outro_start, outro_end]`
- When `auto_skip_intro` is enabled, player seeks past intro/outro automatically
- Users can submit skip times via the SkipTime form (`/ajax/episode/skiptime/save`)

### 6. Rating System
- 10-point scale with half-star support
- Stored in localStorage as `rated.{anime_id}`
- Saved via `/ajax/anime/rate`
- Labels: 10=Masterpiece → 1=Appalling

### 7. Watch Progress Tracking
- `user.playing` in localStorage: `{ showId: [epId, position, duration] }`
- Synced to server via `/ajax/user/playing/save` every 5s when logged in
- `playing.{anime_id}` remembers last position for resume
- `user.lastwatched` tracks last 3 shows

### 8. Turnstile (Cloudflare Captcha)
- Two modes:
  - **Action buttons** (`.js-turnstile-action`): renders inline, stores token, sends with AJAX
  - **Form widgets** (`.turnstile-recaptcha`): renders in forms, auto-submits with hidden input
- Callbacks: `callback`, `expired-callback`, `error-callback`
- Validates before form submission via `validateTurnstileForm()`

### 9. User System
- **Panel** (`#user`): Loaded via `/ajax/user/panel`, cached in `__user_panel` localStorage
- **Favorites** (`.favourite[data-id]`): Add/remove to folders
- **Folders** (`manage-folders`): Sortable (SortableJS), CRUD via AJAX
- **Watch Status**: Toggle watched/unwatched
- **Avatar**: Browser via `/ajax/member/users/avatar`
- **Notifications**: Polled via `/ajax/notification/panel`

### 10. Watch2gether
- WebSocket to `wss://anikoto.to/wsanime`
- Protocol: JSON with `cmd` (1=chat, 2=start, 3=end, 4=user join, 5=user leave, 6=seek, 7=pause, 8=play, 9=ping, 10=episode change)
- JW Player for synced playback
- Chat with rate limiting (1s) and character limit (1000)

### 11. Anti-Devtool
```js
// Detects:
// 1. DevTools open (via DisDevTool library)
// 2. Selenium/webdriver
// 3. Custom browser automation flags
// 4. Source mapping URL injection
```
On detection: clears body and redirects to `/` with optional `?type=N`

### 12. Search (TopSearch)
- Live autocomplete via `/ajax/anime/search?keyword=X`
- Results shown in popup with "More" link
- Keyboard navigation (up/down/enter), S key to focus, Escape to close
- Search bar toggles on `#search-toggler` click

### 13. Homepage Widgets
- **Hotest**: Swiper.js carousel with autoplay
- **Schedule**: Daily schedule with timezone offset, day tabs, live clock
- **Continue Watching**: From `/ajax/user/playing/widget/home`
- **Recent Updates**: Paginated tabs (sub/dub), remembers tab in localStorage

### 14. Dropdown System (Custom)
- Custom dropdown menus with:
  - Genre filtering: **include** (checked), **exclude** (checked + dash prefix), **neutral** (unchecked)
  - Radio/checkbox handling
  - Slide animation
  - Click-away close
  - URL parameter auto-selection

### 15. Keyboard Shortcuts (Watch Page)
| Key | Action |
|-----|--------|
| `B` | Previous episode |
| `N` | Next episode |
| `J` | Rewind (skip_seconds) |
| `L` | Forward (skip_seconds) |
| `Space` | Play/Pause |
| `M` | Mute |
| `S` | Focus search |

### 16. Toast Notifications
System-wide toast system (`#toast`):
- Types: `alert-info` (default), `alert-success`, `alert-danger`
- Auto-dismiss after 3s (configurable)
- Stacking multiple messages
- Optional page reload (`.rld = 1`)

---

## Data Flow

### Episode Playback
```
User clicks episode →
  1. Gn() — show loading overlay
  2. yr() — highlight episode, update URL
  3. Er() → /ajax/server/list?servers=ids → returns server tabs
  4. qr() — render server tabs, activate
  5. Pr() — auto-select server (preference or first)
  6. Mr(server) → /ajax/sources?id=X&asi=Y&autoPlay=Z → returns video URL
  7. Br(url) — load iframe with URL, trigger comments
```

### User Login Flow
```
Login form submit →
  → AjaxForm.B() → validate → POST form →
  → ht() → hide modal → trigger "user:updated" →
  → UserPanel.Me() → /ajax/user/panel →
  → Visitor.le(userData) → populate settings, folders
```

---

## Security

- **CSRF**: `meta[name="csrf-token"]` sent with all state-changing requests
- **Turnstile**: Cloudflare captcha on actions and forms
- **Request verification**: Some endpoints use `vrf` parameter with RC4-hashed payload
- **Anti-devtool**: Blocks inspection, redirects to homepage
- **API protection**: Server validates tokens, hashes, and session cookies

---

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `auto_next` | Auto-next episode toggle |
| `user.settings` | User preferences synced with server |
| `user.playing` | Watched episodes (temp, before sync) |
| `user.folders` | Favorite folder list |
| `playing.{id}` | Resume position for anime |
| `rated.{id}` | User's rating for anime |
| `user.lastwatched` | Recent 3 anime IDs |
| `__user_panel` | Cached user panel HTML |
| `home_recent_update_tab` | Last active tab |

---

## AJAX Endpoints

### Watch Page
| Endpoint | Method | Params |
|----------|--------|--------|
| `/ajax/sources?id=X` | GET | `id`, `asi`, `autoPlay` |
| `/ajax/server/list?servers=X` | GET | `servers` (comma-separated IDs) |
| `/ajax/episode/list/{id}` | GET | `style`, `vrf` |
| `/ajax/episode/skiptime/save` | POST | field names, `id`, `vrf` |
| `/ajax/anime/rate` | POST | `id`, `score`, `req_id`, `vrf` |

### User
| Endpoint | Method | Params |
|----------|--------|--------|
| `/ajax/user/panel` | GET | — |
| `/ajax/user/playing/save` | POST | `playing`, `_csrfToken` |
| `/ajax/user/playing/get/{id}` | GET | — |
| `/ajax/user/playing/delete` | POST | `id`, `_csrfToken` |
| `/ajax/user/playing/clear` | POST | `req_id`, `vrf`, `_csrfToken` |
| `/ajax/user/favourite/get/{id}` | GET | — |
| `/ajax/user/favourite/save` | POST | `id`, `folder`, `_csrfToken` |
| `/ajax/user/favourite/status` | POST | `id`, `unwatched`, `_csrfToken` |
| `/ajax/user/folder/list` | GET | — |
| `/ajax/user/folder/save` | POST | `id`, `name` |
| `/ajax/user/folder/sort` | POST | `orders` |
| `/ajax/user/folder/delete` | POST | `id` |
| `/ajax/member/users/avatar` | POST | `avatar_id`, `_csrfToken` |
| `/ajax/member/users/update-profile` | POST | `settings` |

### Homepage
| Endpoint | Method | Params |
|----------|--------|--------|
| `/ajax/v2/recommendations` | GET | `page`, `mov_id` |
| `/ajax/v2/trending` | GET | `mov_id` |
| `/ajax/home/widget/{tab}` | GET | `page` |
| `/ajax/schedule` | GET | `tz` |
| `/ajax/schedule/date` | GET | `tz`, `time` |
| `/ajax/user/playing/widget/home` | GET | — |

### Other
| Endpoint | Method | Params |
|----------|--------|--------|
| `/ajax/anime/search` | GET | `keyword` |
| `/ajax/anime/tooltip/{id}` | GET | — |
| `/ajax/notification/panel` | GET | — |
| `/ajax/notification/update` | POST | `action`, `ids`, `_csrfToken` |

---

## Module List

| Module | Selector | Purpose |
|--------|----------|---------|
| `FixedHeader` | `header` | Sticky header on scroll |
| `Hotest` | `#hotest` | Hero carousel |
| `Schedule` | `#schedule-block` | Weekly airing schedule |
| `HomeContinueWatching` | `#continue-watching` | Resume watching widget |
| `RecentUpdate` | `#recent-update` | Latest episodes tabbed |
| `TopSearch` | `#search` | Live search with popup |
| `WatchSeasons` | — | Season carousel |
| `Rating` | `#w-rating` | Star rating |
| `SkipTime` | `.ctrl.skiptime` | Intro/outro skip editor |
| `WatchManager` | `.layout-page-watchtv` | Full watch page controller |
| `UserPanel` | `#user` | User dropdown panel |
| `UserFavourite` | `.favourite[data-id]` | Favorite button |
| `UserWatchStatus` | `.watch-status` | Watched toggle |
| `UserMangeFolders` | `.manage-folders` | Folder CRUD |
| `UserEditAvatar` | `#avatar-browser` | Avatar picker |
| `UserNotification` | `.user-notification` | Notification bell |
| `AjaxForm` | `form.ajax` | AJAX form handler |
| `NormalForm` | `form.normal` | Turnstile-only forms |
| `LightControl` | `.ctrl.light` | Lights-off mode |
| `ExpandControl` | `.ctrl.expand` | Expand player |
| `ForwardEpisodeControl` | `.ctrl.prev/.next` | Episode navigation |
| `RoomManager` | `.w2g-watch` | Watch2gether room |
| `RoomCreate` | `.w2g-create-container` | Create room form |
| `ListFilter` | `form.filters` | Search/filter page |
| `SignForm` | `form.ajax-login, form.ajax-register` | Auth forms |
| `Switch` | `[data-switch]` | Toggle switches |
| `DynamticTitle` | `.d-title` | Dynamic title translation |
| `DisplayModes` | `.display-modes` | Grid/list toggle |
| `Tabs` | `.tabs, [data-tabs]` | Tab panels |
| `ContentSwitch` | `[data-content-switch]` | Content toggler |
| `TimerCountDown` | `.count-down` | Countdown timer |
| `AdsClose` | `section.adx` | Closable ad banners |
| `ClickCopy` | `.clickcopy` | Copy to clipboard |
| `BsTooltip` | `[data-toggle="tooltip"]` | Bootstrap tooltips |
| `Tooltip` | `[data-tip]` | AniList-style anime tooltip |
| `Menu` | `#menu` | Mobile hamburger menu |
| `Shorting` | `.shorting` | Expand/collapse text |
| `LiveText` | `[data-live-text]` | Live preview text |

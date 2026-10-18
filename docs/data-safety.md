# Data safety across tabs and versions

Equanim keeps everything in this browser's `localStorage`. Several tabs can be open at once, and a tab can still run Equanim 1.0 after 1.1 is deployed (for example, a tab left open, or an old cached copy). The deployed 1.0 code cannot be changed, so 1.1 is designed around it.

## Where data lives

| Key | Written by | Contents |
|---|---|---|
| `equanim:data` | **1.0 only** | 1.0's whole document. 1.1 reads it and never writes it. |
| `equanim:store` | 1.1 | `{ format, schemaVersion, revision, nonce, ancestors, legacy, data }` |
| `equanim:pre-migration:v1:*` | 1.1 | Exact copy of the 1.0 document taken before the first upgrade. It is never overwritten. |
| `equanim:recovered-original:*`, `equanim:unreadable:*` | 1.1 | Exact originals kept before damaged values were set aside. |
| `equanim:set-aside:*` | 1.1 | Versions that lost a conflict (the same item changed in two places). |
| `equanim:unsaved:*` | 1.1 | A change that could not be saved (when storage allows a copy). |
| `equanim:store:pre-import-backup` | 1.1 | Restore point taken before an import. 1.0's `equanim:pre-import-backup` is still read if 1.1 has none. |

All copies are listed under **Settings and Data › Recovery copies** and can be downloaded. They are removed only by **Erase all data**.

## Migration coordination
- **The upgrade runs under the lock.** It runs inside a Web Lock (`navigator.locks`, lock `equanim:store`) when the browser has one. It happens once: a tab that gets the lock after another tab upgraded finds the store already there and writes nothing.
- **The original is kept first.** The exact 1.0 document is copied and read back before anything else is written. If that copy cannot be written (storage full), the upgrade stops, nothing is replaced, and saving is paused; the app says so.
- **Check-and-set.** Immediately before writing, the store and the 1.0 key are read again. If either changed since they were read, the whole step is recomputed, up to 5 times.
- **Deterministic and idempotent.** The upgrade is a pure function of the 1.0 document, with ids kept or derived. Running it twice gives the same result and no new copy.

## Concurrent writes and stale-write detection
- **Changes are applied to the latest data.** Every change in 1.1 is a function applied inside the lock to the latest stored data, read again at that moment. The screen updates at once; the stored result then replaces it. No tab ever writes its own, possibly older, copy of the whole store.
- **Revisions.** Every write increases `revision` and records the previous write ids (`ancestors`).
- **Overwritten writes are repaired.** If a tab finds its last write is no longer in that history, it was overwritten. That can only happen without Web Locks. The tab then merges its change back, record by record.
- **Newer versions block writes.** If the store was written by a newer schema (another tab already updated), this tab refuses to write. It keeps the change on screen and as an "Unsaved change" copy, and asks the user to reload. It never reloads by itself.
- **The 1.0 key is merged, not trusted.** The 1.0 key is compared with the copy of it stored in `legacy`. When a 1.0 tab has written, its document is upgraded in memory and merged record by record (`src/storage/reconcile.ts`), using the previous 1.0 document as the common base. A 1.0 tab can therefore never overwrite 1.1 data, and nothing it adds is lost.
- **Notifications.** `storage` events and BroadcastChannel tell other tabs to re-read, and so does a tab returning to the foreground. Missing a message is safe, because every write re-reads storage first. Re-reading never reloads the page, and writes only once if a merge must be stored, so there is no loop.

## When two changes cannot both be kept
These are the merge rules.
- **Changed on one side only:** that change is taken.
- **The same item changed differently on both sides:** the more recently updated version is kept. The other is saved under **Edits set aside**, and the app shows a notice.
- **Deleted on one side, edited on the other:** the edit is kept.
- **Deleted on one side, unchanged on the other:** the deletion stands, and a copy is set aside.
- **One intention and one evening reflection per day:** an extra one is set aside. A 1.0 check-in answer is carried onto the kept reflection.
- **Settings and the in-progress draft:** they have no timestamps, so this tab's value is kept when both changed.
- **A change that cannot be saved at all** (storage full, saving paused, or a newer version elsewhere) stays on screen and is retried with the next change. It is never silently dropped.

## Honest limits
- **localStorage has no transactions.** When a browser lacks Web Locks (Chrome < 69, Safari < 15.4, Firefox < 96), another 1.1 tab's write can land in the microseconds between the check and the write. That write is detected and restored by its tab on its next read or write, but **if that tab is closed first, its last change can be lost.** With Web Locks, 1.1 tabs are fully serialised.
- **1.0 tabs don't take the lock.** Their writes go only to their own key and are merged, so they cannot overwrite 1.1 data. A 1.0 tab does not see 1.1's new entries. If someone uses both side by side, the 1.0 tab shows an older picture until it is closed.
- **Erase all data with a 1.0 tab still open:** that tab can write its copy again, and 1.1 will then treat it as data to upgrade. Close old tabs before erasing.
- **Storage use:** the store keeps one copy of the last 1.0 document as the merge base. Browsers allow roughly 5 MB per site for `localStorage`. When storage is full, saving pauses and the app says so.
- **Not tested on real devices:** multi-tab behaviour was tested in jsdom (deterministic unit tests) and in real desktop Chromium (Playwright). It was not tested on a real phone. See `docs/manual-testing.md`.

## Backup and recovery
- **Export** (Settings and Data › Export backup) writes the current data as JSON. **Import** (merge or replace) is applied to the latest stored data, and the restore point is taken from that same data. **Undo last import** restores it.
- **Recovery copies** can be downloaded. An "Original before upgrade" copy can be imported like a backup.

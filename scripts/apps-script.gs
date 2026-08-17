/**
 * ═══════════════════════════════════════════════════════════════════════
 * RSVP receiver — Google Apps Script
 *
 * Appends each RSVP to a Google Sheet. The website never talks to this
 * directly; its /api/rsvp route forwards to it server-side, so this URL
 * stays out of guests' browsers.
 *
 * ── SETUP (about five minutes) ─────────────────────────────────────────
 *
 *  1. Go to https://sheets.new and name the spreadsheet
 *     something like "Wedding RSVPs".
 *
 *  2. In that sheet: Extensions ▸ Apps Script.
 *
 *  3. Delete whatever is in Code.gs and paste this entire file in.
 *
 *  4. Replace CHANGE_ME below with a long random string. Generate one:
 *        node -e "console.log(crypto.randomUUID())"
 *     Put the SAME string in .env.local as RSVP_SHARED_SECRET.
 *
 *  5. Click Save (the disk icon).
 *
 *  6. Click Deploy ▸ New deployment.
 *       • Select type  →  Web app
 *       • Description  →  RSVP receiver
 *       • Execute as   →  Me
 *       • Who has access → Anyone            ← must be "Anyone"
 *     Click Deploy, then Authorize access and accept the prompts.
 *     ("Anyone" is safe here: the shared secret above is what actually
 *      guards the sheet, and this script only ever appends rows.)
 *
 *  7. Copy the Web app URL. It ends in /exec — not /dev.
 *     Put it in .env.local as RSVP_WEBHOOK_URL.
 *
 *  8. Test it: open that /exec URL in a browser. You should see
 *     {"ok":true,"status":"RSVP receiver is running"}
 *
 * ── IF YOU EDIT THIS FILE LATER ────────────────────────────────────────
 *  Deploy ▸ Manage deployments ▸ pencil icon ▸ Version: New version ▸
 *  Deploy. Editing alone changes nothing — the old version stays live
 *  until you redeploy. This trips up nearly everyone once.
 * ═══════════════════════════════════════════════════════════════════════
 */

var SHARED_SECRET = 'CHANGE_ME';
var SHEET_NAME = 'RSVPs';

var HEADERS = [
  'Submitted at',
  'Full name',
  'Mobile',
  'Email',
  'Attending',
  'Guests',
  'Message',
];

function doPost(e) {
  // Serialise writes. Two guests replying in the same second could
  // otherwise land on the same row and one would be lost.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return jsonOut({ ok: false, error: 'busy' });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: 'empty request' });
    }

    var data = JSON.parse(e.postData.contents);

    if (SHARED_SECRET && SHARED_SECRET !== 'CHANGE_ME') {
      if (data.secret !== SHARED_SECRET) {
        return jsonOut({ ok: false, error: 'unauthorized' });
      }
    }

    if (!data.fullName) {
      return jsonOut({ ok: false, error: 'missing name' });
    }

    var sheet = getSheet();
    sheet.appendRow([
      data.submittedAt ? new Date(data.submittedAt) : new Date(),
      String(data.fullName || ''),
      // Leading apostrophe keeps "0917..." from losing its zero and
      // being reformatted as a number by Sheets.
      "'" + String(data.mobile || ''),
      String(data.email || ''),
      data.attending === 'yes' ? 'Attending' : 'Not attending',
      Number(data.guests) || 0,
      String(data.message || ''),
    ]);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Lets you confirm the deployment is live by opening the URL. */
function doGet() {
  return jsonOut({ ok: true, status: 'RSVP receiver is running' });
}

function getSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
  }

  // Write the header row once, the first time anything arrives.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(7, 380);
  }

  return sheet;
}

function jsonOut(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Optional: a live headcount. In the Apps Script editor pick this function
 * from the dropdown and press Run, then read the Execution log.
 */
function countAttending() {
  var sheet = getSheet();
  var rows = sheet.getDataRange().getValues().slice(1);
  var replies = 0;
  var heads = 0;

  rows.forEach(function (row) {
    if (row[4] === 'Attending') {
      replies++;
      heads += Number(row[5]) || 0;
    }
  });

  Logger.log(replies + ' replies accepted — ' + heads + ' people expected.');
}

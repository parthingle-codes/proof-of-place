/**
 * Campus Maintenance Desk - DEMONSTRATION QUEUE.
 *
 * This is a clearly-labelled local demo queue so the workflow can be shown
 * end-to-end without an authorized college system. It is NOT a college
 * system, NOT a ticketing backend, and never notifies any person.
 *
 * In-memory only: no database, no persistence, cleared on restart. Capped so
 * a demo cannot grow without bound.
 */

const CAPACITY = 50;
let seq = 0;
const entries = [];

export const DEMO_NOTICE =
  "Demonstration queue only - local in-memory list for this demo. Not a college system; no staff member is notified and nothing is forwarded anywhere.";

/**
 * @param {object} ticket the composed ticket (already validated by schema.js)
 * @returns {{entry: object, queue_size: number}}
 */
export function addTicket(ticket) {
  if (seq >= CAPACITY) {
    entries.shift();
  }
  seq += 1;
  const entry = {
    queue_id: seq,
    added_at: new Date().toISOString(),
    demo: true,
    real_system: false,
    received_by_college_staff: false,
    status: "demonstration-entry",
    issue_title: String(ticket.issue_title || "Untitled request").slice(0, 120),
    category: String(ticket.category || "Other or uncertain"),
    location: String(ticket.location || "Not provided"),
    ticket,
  };
  entries.push(entry);
  return { entry, queue_size: entries.length };
}

export function listEntries() {
  return {
    demo: true,
    real_system: false,
    notice: DEMO_NOTICE,
    queue_size: entries.length,
    entries,
  };
}

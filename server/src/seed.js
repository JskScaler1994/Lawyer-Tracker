import "dotenv/config";
import { pool, initDb } from "./db.js";
import { todayISO, addDaysISO } from "./dates.js";

await initDb();

const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM cases");
if (rows[0].n > 0) {
  console.log(`Seed skipped — ${rows[0].n} case(s) already in the database.`);
  await pool.end();
  process.exit(0);
}

const today = todayISO();

const seedData = [
  {
    case: {
      case_number: "O.S. 412 / 2025",
      cnr: "DLCT01-001234-2025",
      status: "Pending",
      court_establishment: "Tis Hazari District Court",
      place: "Delhi",
      coram: "Sh. R. K. Nagpal, ADJ-04",
      filed_date: "2025-03-03",
      next_hearing_date: addDaysISO(today, 16),
      next_hearing_time: "10:00 am",
      next_hearing_note: "Cross-examination of PW-2",
      reminder_enabled: 1,
      client_name: "Rakesh Malhotra",
      client_phone: "+91 98110 22334",
      appearing_for: "Plaintiff",
    },
    hearings: [
      ["2026-08-14", "Adjourned for evidence", "PW-2 not present. Court granted last opportunity."],
      ["2026-06-26", "Evidence of PW-1 recorded", "Examination-in-chief completed; cross deferred."],
      ["2026-04-18", "Issues framed", "Five issues framed. Matter listed for plaintiff evidence."],
      ["2026-02-07", "Written statement filed", "Defendant filed WS, delay condoned on cost of Rs 2,000."],
      ["2025-03-03", "Suit filed", "Plaint registered and summons issued to defendants."],
    ],
  },
  {
    case: {
      case_number: "CS 1187 / 2025",
      cnr: "DLSR01-004521-2025",
      status: "Pending",
      court_establishment: "Rohini Court",
      place: "Delhi",
      coram: "Sh. A. Verma, CJ-07",
      filed_date: "2025-06-10",
      next_hearing_date: null,
      next_hearing_time: null,
      next_hearing_note: null,
      reminder_enabled: 1,
      client_name: "Sunita Kapoor",
      client_phone: "+91 98730 44556",
      appearing_for: "Defendant",
    },
    hearings: [
      ["2026-07-30", "Adjourned", "Listed for framing of issues."],
    ],
  },
  {
    case: {
      case_number: "Crl.M.C. 78 / 2026",
      cnr: "DLSK02-000078-2026",
      status: "Pending",
      court_establishment: "Saket Court",
      place: "Delhi",
      coram: "Room 214",
      filed_date: "2026-01-12",
      next_hearing_date: addDaysISO(today, 2),
      next_hearing_time: "11:00 am",
      next_hearing_note: "Arguments on bail",
      reminder_enabled: 1,
      client_name: "Vikram Singh",
      client_phone: "+91 99100 77889",
      appearing_for: "Accused",
    },
    hearings: [
      ["2026-08-20", "Bail application filed", "Notice issued to State, reply sought."],
    ],
  },
  {
    case: {
      case_number: "W.P.(C) 3402 / 2024",
      cnr: "DLHC01-003402-2024",
      status: "Disposed",
      court_establishment: "Delhi High Court",
      place: "Delhi",
      coram: "Hon'ble Ms. Justice S. Malhotra",
      filed_date: "2024-11-05",
      next_hearing_date: null,
      next_hearing_time: null,
      next_hearing_note: null,
      reminder_enabled: 0,
      client_name: "Anita Desai",
      client_phone: "+91 98200 33221",
      appearing_for: "Petitioner",
    },
    hearings: [
      ["2026-08-02", "Disposed", "Petition disposed of with directions to respondent."],
    ],
  },
  {
    case: {
      case_number: "W.P.(C) 88 / 2026",
      cnr: "DLHC01-000088-2026",
      status: "Reserved for orders",
      court_establishment: "Delhi High Court",
      place: "Delhi",
      coram: "Hon'ble Mr. Justice K. Bansal",
      filed_date: "2026-05-18",
      next_hearing_date: null,
      next_hearing_time: null,
      next_hearing_note: null,
      reminder_enabled: 1,
      client_name: "Rakesh Malhotra",
      client_phone: "+91 98110 22334",
      appearing_for: "Petitioner",
    },
    hearings: [
      ["2026-08-25", "Admission hearing held", "Arguments heard; order reserved."],
    ],
  },
];

const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const { case: c, hearings } of seedData) {
    const insertResult = await client.query(
      `INSERT INTO cases (case_number, cnr, status, court_establishment, place, coram, filed_date,
        next_hearing_date, next_hearing_time, next_hearing_note, reminder_enabled,
        client_name, client_phone, appearing_for)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        c.case_number, c.cnr, c.status, c.court_establishment, c.place, c.coram, c.filed_date,
        c.next_hearing_date, c.next_hearing_time, c.next_hearing_note, c.reminder_enabled,
        c.client_name, c.client_phone, c.appearing_for,
      ]
    );
    const caseId = insertResult.rows[0].id;
    for (const [hearing_date, title, note] of hearings) {
      await client.query(
        "INSERT INTO hearings (case_id, hearing_date, title, note) VALUES ($1, $2, $3, $4)",
        [caseId, hearing_date, title, note]
      );
    }
  }
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}

console.log(`Seeded ${seedData.length} cases.`);
await pool.end();

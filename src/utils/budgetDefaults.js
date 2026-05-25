// Budget Tracker defaults — GENERIC placeholders only (no personal data in source).
// Real per-user values live in localStorage (qt_budget_config) / Supabase, like the
// owner's daily_habits. New users start from these neutral round numbers and rename
// categories to taste.

export const BUDGET_DEFAULTS = {
  income: 3000,
  rent: 1000,
  savingsTarget: 500,

  variable: {
    Groceries: 300,
    Dining: 100,
    Transport: 50,
    Medical: 30,
    Household: 50,
    Buffer: 50,
    Fun: 30,
  },

  subs: {
    "Subscription 1": 10,
    "Subscription 2": 10,
  },
};

// Transfer status state machine:
// 1. all null        -> blue info  "waiting, no action needed"
// 2. sevis released  -> blue info  "SEVIS released, waiting new I-20"
// 3. i20 received    -> yellow     "I-20 received, next steps"
// 4. all filled      -> green      "Transfer complete"
export const TRANSFER_STAGES = ["waiting", "sevisReleased", "i20Received", "complete"];

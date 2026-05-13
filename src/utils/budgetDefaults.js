// Budget Tracker defaults — placeholder values for source code.
// Real values are stored per-user in localStorage / Supabase.

export const BUDGET_DEFAULTS = {
  income: 3500,
  rent: 1230,
  savingsTarget: 1000,

  variable: {
    Grocery: 405,
    "Delivery A": 80,
    "Delivery B": 50,
    Uber: 30,
    Medical: 30,
    "Household / Amazon": 50,
    Buffer: 50,
    "Social Fund": 30,
  },

  subs: {
    "Claude Pro": 200,
    "Anthropic API": 80,
    "Apple One": 1,
  },
};

// Transfer status state machine:
// 1. all null        -> blue info  "waiting, no action needed"
// 2. sevis released  -> blue info  "SEVIS released, waiting new I-20"
// 3. i20 received    -> yellow     "I-20 received, next steps"
// 4. all filled      -> green      "Transfer complete"
export const TRANSFER_STAGES = ["waiting", "sevisReleased", "i20Received", "complete"];

# Household Cashflow: template

A scrubbed copy of the household cash-flow dashboard. No real names, accounts, balances or history.

- Open `index.html` in a browser to run it locally (data stays in that browser), or publish `index.publish.html` as a Claude artifact with the `db` and `user` capabilities for shared use.
- Start by replacing the placeholder plan: Budgets tab (income, bills, debts, savings), Debts tab (balances), Settings (joint Amex cardholder first name, buffer).
- The Today tab asks for a bank balance. Upload bank and Amex statements (CSV or PDF) on Today; the app learns your merchants as you approve categories.
- Placeholder ids (`i_pa`, `t_pa`, `v_acash` ...) are internal. Partner A / Partner B are just labels: rename them in Budgets and Net worth.

Built from the live app at `app/`, which is untouched. Nothing from the live database was copied.

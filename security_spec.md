# Security Specification

## 1. Data Invariants
- Each flea market item in `/items/{itemId}` must have valid required fields: `name`, `category`, `price`, `stock`, `imageUrl`, and `condition`.
- `name` must be a string between 1 and 100 characters.
- `category` must be one of `['living', 'appliances', 'furniture']`.
- `price` must be a non-negative number and at most 10,000,000.
- `stock` must be a non-negative integer and at most 1,000.
- `imageUrl` must be a valid URL string under 1,000 characters.
- All documents must be readable by all users (public flea market inventory live lookup).
- Writes (create, update, delete) must validate data schema and boundary integrity.

## 2. The Dirty Dozen Payloads (Rejection Targets)
1. **Empty Name Injection**: `{ "name": "", "category": "living", "price": 5000, "stock": 1 }` -> REJECT (name length < 1)
2. **Gigantic Name Poisoning**: `{ "name": "A".repeat(500), "category": "living", ... }` -> REJECT (name length > 100)
3. **Invalid Category**: `{ "category": "weapons", ... }` -> REJECT (category not in allowlist)
4. **Negative Price**: `{ "price": -5000, ... }` -> REJECT (price < 0)
5. **Absurd Price**: `{ "price": 999999999999, ... }` -> REJECT (price > 10,000,000)
6. **Negative Stock**: `{ "stock": -1, ... }` -> REJECT (stock < 0)
7. **Gigantic Stock Overflow**: `{ "stock": 1000000, ... }` -> REJECT (stock > 1000)
8. **Malicious Image URL Payload**: 100KB base64 script string -> REJECT (imageUrl.size() > 1000)
9. **Ghost / Shadow Field Injection**: `{ "isSecretAdmin": true, ... }` -> REJECT (strict keys check)
10. **Document ID Injection**: Document ID containing illegal symbols `/items/../../etc/passwd` -> REJECT (isValidId check)
11. **Type Confusion Attack**: Price as string `"5000"` -> REJECT (price is number)
12. **Non-existent Collection / Document Write**: `/admins/hacker` -> REJECT (catch-all default deny)

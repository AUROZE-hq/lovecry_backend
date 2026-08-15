# Consent e-signature workflow

1. Active consent template version is shown on-site (`ConsentDocumentViewer`).
2. Client may drawn-sign and/or type legal name + three intent checkboxes.
3. Server stores audit evidence: hashes, session id, IP, UA, timestamps (UTC).
4. Certificate page text is appended; SHA-256 of final document stored.
5. Drive upload when Google is configured; otherwise local stub file id.
6. Signing tokens are hashed; manage token also opens `/consent/sign/[token]`.

Policy A vs B is toggleable in **Admin → Counselling → Settings**.

# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# Communication
- Communicate in Indonesian for this project. Confidence: 0.75

# Supabase
- Always run supabase db push --dry-run before supabase db push --yes when deploying migrations. Confidence: 0.75
- In Supabase PostgreSQL RPCs with RETURNS TABLE, fully qualify column references with table aliases to avoid ambiguity errors, and use ON CONFLICT ON CONSTRAINT constraint_name instead of ON CONFLICT (column). Confidence: 0.65

# CSS / Design
- Avoid using Playfair Display as the primary/heading font family for this project as it feels unprofessional. Confidence: 0.75
- Use Plus Jakarta Sans for heading/display fonts instead of Playfair Display, with Inter for body text. Confidence: 0.50

# UX / Forms
- For long admin forms, use multi-step/wizard pattern instead of displaying all sections at once in a scrollable modal. Each section should be completed before moving to the next. Confidence: 0.65


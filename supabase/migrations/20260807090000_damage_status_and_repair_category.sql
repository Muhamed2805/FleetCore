-- Phase 10 follow-up: a "scheduled" step in the damage report workflow
-- (reported -> scheduled -> in repair -> resolved) for when a repair
-- appointment is booked but the vehicle isn't at the shop yet, and a
-- dedicated "repair" expense category so costs linked from a damage
-- report aren't lumped under "Other".
--
-- ALTER TYPE ... ADD VALUE can't be used in the same transaction as the
-- new value itself, so this migration only adds the values — nothing
-- here references them.

alter type public.damage_report_status add value 'scheduled' before 'in_repair';
alter type public.expense_category add value 'repair';

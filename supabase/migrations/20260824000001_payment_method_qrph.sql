-- Allow qrph in payment.method for QR Ph tests (Irene's Housing)
alter table public.payment drop constraint if exists payment_method_check;
alter table public.payment add constraint payment_method_check check (method in ('gcash', 'maya', 'card', 'cash', 'qrph'));

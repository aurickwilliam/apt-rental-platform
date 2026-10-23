begin;
select plan(16);

select ok((select not public and file_size_limit = 26214400
  and allowed_mime_types @> array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  from storage.buckets where id = 'chat-images'), 'documents stay private with a 25 MB bucket cap');

-- Copy checks, not FKs/RLS/triggers: no real messages, users or notifications.
create temporary table chat_document_contract (like public.chat including defaults including constraints);
insert into chat_document_contract (sender_id, receiver_id, message_type, attachment_path, attachment_mime_type, attachment_name, attachment_size)
values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'file',
  '10000000-0000-0000-0000-000000000001/lease.pdf', 'application/pdf', 'Lease.pdf', 26214400);
select is((select count(*)::integer from chat_document_contract), 1, 'a PDF at exactly 25 MB is accepted');
select lives_ok($$update chat_document_contract set attachment_mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', attachment_name = 'Lease.docx'$$, 'DOCX is accepted');
select throws_ok($$update chat_document_contract set attachment_size = 26214401$$, '23514', null, 'oversized metadata is rejected');
select throws_ok($$update chat_document_contract set attachment_size = 0$$, '23514', null, 'empty documents are rejected');
select throws_ok($$update chat_document_contract set attachment_name = null$$, '23514', null, 'document name is required');
select throws_ok($$update chat_document_contract set attachment_mime_type = 'text/html'$$, '23514', null, 'unsupported document types are rejected');
select throws_ok($$update chat_document_contract set attachment_path = '20000000-0000-0000-0000-000000000002/lease.pdf'$$, '23514', null, 'documents must use the sender folder');
select throws_ok($$update chat_document_contract set attachment_url = 'https://example.com/file.pdf'$$, '23514', null, 'external document URLs are rejected');
select ok((select qual like '%attachment_path = objects.name%' and qual like '%attachment_thumbnail_path = objects.name%'
  from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Chat participants can view chat images'), 'recipient storage reads require an exact message attachment reference');

-- External media: the CDN URL is the whole attachment, like mobile's externalUrl.
select lives_ok($$insert into chat_document_contract (sender_id, receiver_id, message_type, attachment_url, attachment_mime_type)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'gif',
    'https://media.giphy.com/media/abc/giphy.gif', 'image/gif')$$,
  'an external GIF URL is accepted');
select throws_ok($$insert into chat_document_contract (sender_id, receiver_id, message_type, attachment_url)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'gif',
    'http://media.giphy.com/media/abc/giphy.gif')$$,
  '23514', null, 'external media URLs must be https');
select throws_ok($$insert into chat_document_contract (sender_id, receiver_id, message_type, attachment_path, attachment_url)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'gif',
    '10000000-0000-0000-0000-000000000001/a.gif', 'https://media.giphy.com/media/abc/giphy.gif')$$,
  '23514', null, 'a media message carries one source');
select throws_ok($$insert into chat_document_contract (sender_id, receiver_id, message_type)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'gif')$$,
  '23514', null, 'media requires a source');
select throws_ok($$insert into chat_document_contract (sender_id, receiver_id, message_type, attachment_path)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'image',
    '20000000-0000-0000-0000-000000000002/photo.png')$$,
  '23514', null, 'media paths stay in the sender folder');
select throws_ok($$insert into chat_document_contract (sender_id, receiver_id, message_type, message, attachment_url)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'text', 'hello',
    'https://media.giphy.com/media/abc/giphy.gif')$$,
  '23514', null, 'text messages carry no attachment URL');

select * from finish();
rollback;

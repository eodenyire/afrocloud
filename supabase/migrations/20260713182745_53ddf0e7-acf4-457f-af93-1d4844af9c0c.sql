
-- RLS policies for the africloud storage bucket.
-- Objects live under: <user_id>/<bucket_row_id>/<key>
CREATE POLICY "africloud users read own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'africloud' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "africloud users insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'africloud' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "africloud users update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'africloud' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'africloud' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "africloud users delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'africloud' AND (storage.foldername(name))[1] = auth.uid()::text);

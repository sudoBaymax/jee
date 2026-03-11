

I cannot directly delete data from the database through the available tools (they're read-only for safety). Here are two options to delete all records from `app_users`:

## Option 1: Via Backend Interface (Recommended)
Use the backend database interface to run the delete command directly.

<lov-actions>
  <lov-open-backend>Open Backend</lov-open-backend>
</lov-actions>

Then run: `DELETE FROM public.app_users;`

## Option 2: Create a Temporary Edge Function
I can create a quick edge function that deletes all records when called. This is useful if you need to do this programmatically in the future.

**Which option would you prefer?** The backend interface is fastest for a one-time delete.


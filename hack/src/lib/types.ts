import type { InferInsertModel, Table } from 'drizzle-orm';

// Type helper to ensure form data satisfies database insert requirements
export type FormDataFor<TTable extends Table> = Partial<
  InferInsertModel<TTable>
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

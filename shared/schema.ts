import { z } from "zod";

export const insertSavedLookSchema = z.object({
  imageUrl: z.string().min(1),
});

export const insertProductSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  imageUrl: z.string().min(1),
});

export type SavedLook = {
  id: number;
  imageUrl: string;
  createdAt: Date;
};
export type InsertSavedLook = z.infer<typeof insertSavedLookSchema>;

export type Product = {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
};
export type InsertProduct = z.infer<typeof insertProductSchema>;

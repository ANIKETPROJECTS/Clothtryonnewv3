import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  type InsertProduct,
  type InsertSavedLook,
  type Product,
  type SavedLook,
} from "@shared/schema";

export interface IStorage {
  getLooks(): Promise<SavedLook[]>;
  createLook(look: InsertSavedLook): Promise<SavedLook>;
  deleteLook(id: number): Promise<void>;
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
}

type StoreData = {
  nextLookId: number;
  nextProductId: number;
  looks: SavedLook[];
  products: Product[];
};

const storedStoreSchema = z.object({
  nextLookId: z.number().int().positive(),
  nextProductId: z.number().int().positive(),
  looks: z.array(
    z.object({
      id: z.number().int().positive(),
      imageUrl: z.string(),
      createdAt: z.string().datetime(),
    }),
  ),
  products: z.array(
    z.object({
      id: z.number().int().positive(),
      name: z.string(),
      category: z.string(),
      imageUrl: z.string(),
    }),
  ),
});

const dataPath = path.resolve(process.cwd(), "data", "app-data.json");
const emptyStore: StoreData = {
  nextLookId: 1,
  nextProductId: 1,
  looks: [],
  products: [],
};

let writeQueue: Promise<void> = Promise.resolve();

async function readStore(): Promise<StoreData> {
  try {
    const file = await readFile(dataPath, "utf8");
    const result = storedStoreSchema.safeParse(JSON.parse(file));
    if (!result.success) {
      throw new Error(
        `Invalid data format in ${dataPath}: ${result.error.message}`,
      );
    }
    const parsed = result.data;
    return {
      ...parsed,
      looks: parsed.looks.map((look) => ({
        ...look,
        createdAt: new Date(look.createdAt),
      })),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await mkdir(path.dirname(dataPath), { recursive: true });
    try {
      await writeFile(dataPath, `${JSON.stringify(emptyStore, null, 2)}\n`, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      });
    } catch (createError) {
      if ((createError as NodeJS.ErrnoException).code !== "EEXIST") {
        throw createError;
      }
    }
    return readStore();
  }
}

async function writeStore(data: StoreData): Promise<void> {
  await mkdir(path.dirname(dataPath), { recursive: true });
  const temporaryPath = `${dataPath}.tmp`;
  await writeFile(
    temporaryPath,
    `${JSON.stringify(data, null, 2)}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  await rename(temporaryPath, dataPath);
}

function updateStore<T>(update: (data: StoreData) => T): Promise<T> {
  const operation = writeQueue.then(async () => {
    const data = await readStore();
    const result = update(data);
    await writeStore(data);
    return result;
  });
  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

export class FileStorage implements IStorage {
  async getLooks(): Promise<SavedLook[]> {
    const data = await readStore();
    return data.looks.sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
    );
  }

  async createLook(look: InsertSavedLook): Promise<SavedLook> {
    return updateStore((data) => {
      const newLook: SavedLook = {
        id: data.nextLookId++,
        imageUrl: look.imageUrl,
        createdAt: new Date(),
      };
      data.looks.push(newLook);
      return newLook;
    });
  }

  async deleteLook(id: number): Promise<void> {
    await updateStore((data) => {
      data.looks = data.looks.filter((look) => look.id !== id);
    });
  }

  async getProducts(): Promise<Product[]> {
    return (await readStore()).products;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return updateStore((data) => {
      const newProduct: Product = {
        id: data.nextProductId++,
        ...product,
      };
      data.products.push(newProduct);
      return newProduct;
    });
  }
}

export const storage = new FileStorage();

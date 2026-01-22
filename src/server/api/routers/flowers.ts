import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const flowersRouter = createTRPCRouter({
  // Get all categories
  getCategories: publicProcedure.query(async () => {
    return await db.category.findMany({
      orderBy: { name: "asc" },
    });
  }),

  // Create initial categories (for seeding)
  createInitialCategories: publicProcedure.mutation(async () => {
    const categories = [
      { name: "Все", type: "MAIN" },
      { name: "Экзотика", type: "MAIN" },
      { name: "Хвоя", type: "MAIN" },
      { name: "Гвоздики", type: "MAIN" },
      { name: "Хризантемы", type: "MAIN" },
      { name: "Кустовые розы", type: "MAIN" },
      { name: "Белые", type: "ATTRIBUTE" },
      { name: "Зеленые", type: "ATTRIBUTE" },
      { name: "Красные", type: "ATTRIBUTE" },
      { name: "Розовые", type: "ATTRIBUTE" },
      { name: "Желтые", type: "ATTRIBUTE" },
      { name: "Пионовидные", type: "ATTRIBUTE" },
      { name: "Высокие", type: "ATTRIBUTE" },
      { name: "Ароматные", type: "ATTRIBUTE" },
      { name: "Стойкие", type: "ATTRIBUTE" },
    ];

    await db.category.deleteMany(); // Clear existing categories

    const createdCategories = await Promise.all(
      categories.map((category) =>
        db.category.create({
          data: category,
        }),
      ),
    );

    return createdCategories;
  }),

  // Get all flowers with optional filtering
  getFlowers: publicProcedure
    .input(
      z
        .object({
          categoryId: z.string().optional(),
          attributes: z.array(z.string()).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const where: any = {};

      if (input?.categoryId && input.categoryId !== "all") {
        where.categoryId = input.categoryId;
      }

      const flowers = await db.flower.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { name: "asc" },
      });

      // Filter by attributes if provided
      if (input?.attributes && input.attributes.length > 0) {
        return flowers.filter((flower) => {
          const flowerAttributes = JSON.parse(
            flower.attributesJson || "[]",
          ) as string[];
          return input.attributes!.some((attr) =>
            flowerAttributes.includes(attr),
          );
        });
      }

      return flowers;
    }),

  // Create initial flowers (for seeding)
  createInitialFlowers: publicProcedure.mutation(async () => {
    // First get categories to map them
    const categories = await db.category.findMany();
    const categoryMap = new Map(categories.map((cat) => [cat.name, cat.id]));

    const flowers = [
      {
        name: "Снежные ветки (Береза)",
        price: 1000,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Хвоя",
        attributes: ["Белые", "Зеленые", "Высокие"],
        inStock: true,
        deliveryNextDay: true,
      },
      {
        name: "Туя",
        price: 1500,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Хвоя",
        attributes: ["Зеленые", "Стойкие", "Ароматные"],
        inStock: true,
        deliveryNextDay: true,
      },
      {
        name: "Роза красная",
        price: 1200,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Гвоздики",
        attributes: ["Красные", "Ароматные", "Пионовидные"],
        inStock: true,
        deliveryNextDay: true,
      },
      {
        name: "Хризантема белая",
        price: 800,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Хризантемы",
        attributes: ["Белые", "Стойкие"],
        inStock: true,
        deliveryNextDay: false,
      },
      {
        name: "Гвоздика розовая",
        price: 600,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Гвоздики",
        attributes: ["Розовые", "Ароматные"],
        inStock: true,
        deliveryNextDay: true,
      },
      {
        name: "Орхидея экзотическая",
        price: 2500,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Экзотика",
        attributes: ["Белые", "Ароматные"],
        inStock: true,
        deliveryNextDay: false,
      },
      {
        name: "Роза белая",
        price: 1100,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Кустовые розы",
        attributes: ["Белые", "Ароматные", "Пионовидные"],
        inStock: true,
        deliveryNextDay: true,
      },
      {
        name: "Хризантема желтая",
        price: 900,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Хризантемы",
        attributes: ["Желтые", "Стойкие"],
        inStock: true,
        deliveryNextDay: true,
      },
      {
        name: "Гвоздика красная",
        price: 700,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Гвоздики",
        attributes: ["Красные", "Ароматные"],
        inStock: true,
        deliveryNextDay: true,
      },
      {
        name: "Пион розовый",
        price: 1800,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Кустовые розы",
        attributes: ["Розовые", "Ароматные", "Пионовидные"],
        inStock: true,
        deliveryNextDay: false,
      },
      {
        name: "Эустома",
        price: 2200,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Экзотика",
        attributes: ["Белые", "Ароматные"],
        inStock: true,
        deliveryNextDay: false,
      },
      {
        name: "Хризантема розовая",
        price: 850,
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxACsdXMcyyFHoBjbsJmO7MXih1o1Z-SRCnA&s",
        categoryName: "Хризантемы",
        attributes: ["Розовые", "Стойкие"],
        inStock: true,
        deliveryNextDay: true,
      },
    ];

    await db.flower.deleteMany(); // Clear existing flowers

    const createdFlowers = await Promise.all(
      flowers.map((flower) => {
        const categoryId = categoryMap.get(flower.categoryName);
        if (!categoryId) {
          throw new Error(`Category not found: ${flower.categoryName}`);
        }

        return db.flower.create({
          data: {
            name: flower.name,
            price: flower.price,
            image: flower.image,
            categoryId,
            attributesJson: JSON.stringify(flower.attributes),
            inStock: flower.inStock,
            deliveryNextDay: flower.deliveryNextDay,
          },
        });
      }),
    );

    return createdFlowers;
  }),

  // Cart operations
  addToCart: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        flowerId: z.string(),
        quantity: z.number().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const existingCartItem = await db.cartItem.findUnique({
        where: {
          userId_flowerId: {
            userId: input.userId,
            flowerId: input.flowerId,
          },
        },
      });

      if (existingCartItem) {
        return await db.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + input.quantity },
          include: { flower: true },
        });
      } else {
        return await db.cartItem.create({
          data: {
            userId: input.userId,
            flowerId: input.flowerId,
            quantity: input.quantity,
          },
          include: { flower: true },
        });
      }
    }),

  updateCartItem: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        flowerId: z.string(),
        quantity: z.number().min(0),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.quantity === 0) {
        return await db.cartItem.delete({
          where: {
            userId_flowerId: {
              userId: input.userId,
              flowerId: input.flowerId,
            },
          },
        });
      } else {
        return await db.cartItem.update({
          where: {
            userId_flowerId: {
              userId: input.userId,
              flowerId: input.flowerId,
            },
          },
          data: { quantity: input.quantity },
          include: { flower: true },
        });
      }
    }),

  getCart: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return await db.cartItem.findMany({
        where: { userId: input.userId },
        include: { flower: true },
      });
    }),
});

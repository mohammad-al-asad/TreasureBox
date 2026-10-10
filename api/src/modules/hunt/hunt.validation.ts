import { z } from 'zod';

const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90).optional().default(25.2644),
  longitude: z.number().min(-180).max(180).optional().default(55.2982),
});

const StageLocationSchema = z.object({
  coordinates: CoordinatesSchema.optional().default({ latitude: 25.2644, longitude: 55.2982 }),
  locationNameEn: z.string().optional().default(''),
  locationNameAr: z.string().optional().default(''),
  instructionsEn: z.string().optional().default(''),
  instructionsAr: z.string().optional().default(''),
});

const CipherConfigSchema = z.object({
  barrelCount: z.number().int().min(1).max(20).optional().default(5),
  targetSequence: z.string().optional().default('AAAAA'),
  initialState: z.array(z.string()).optional().default([]),
  cipherHintEn: z.string().optional().default(''),
  cipherHintAr: z.string().optional().default(''),
  cipherHintImage: z.string().optional().default(''),
});

const HintItemSchema = z.object({
  titleEn: z.string().optional().default(''),
  titleAr: z.string().optional().default(''),
  bodyEn: z.string().optional().default(''),
  bodyAr: z.string().optional().default(''),
  description: z.string().optional().default(''),
  imageUrl: z.string().optional().default(''),
  mediaUrl: z.string().optional().default(''),
  mediaType: z.enum(['image', 'video']).optional().default('video'),
  order: z.number().int().optional().default(1),
});

const HuntVideoSchema = z.object({
  url: z.string().optional().default(''),
  description: z.string().optional().default(''),
});

export const createHuntSchema = z.object({
  titleEn: z.string().optional().default('Untitled Expedition'),
  titleAr: z.string().optional().default(''),
  descriptionEn: z.string().optional().default(''),
  descriptionAr: z.string().optional().default(''),
  loreEn: z.string().optional().default(''),
  loreAr: z.string().optional().default(''),
  price: z.number().min(0).optional().default(0),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional().default('MEDIUM'),
  status: z.enum(['DRAFT', 'LIVE', 'IN_PROGRESS', 'FOUND', 'ARCHIVED']).optional().default('DRAFT'),
  badgeTextEn: z.string().optional().default(''),
  badgeTextAr: z.string().optional().default(''),
  spotImage: z.string().optional().default(''),
  images: z.array(z.string()).optional().default([]),
  videos: z.array(HuntVideoSchema).optional().default([]),
  category: z.string().optional(),
  categoryName: z.string().optional(),
  capitalWorth: z.string().optional(),
  cipher: CipherConfigSchema.optional().default({
    barrelCount: 5,
    targetSequence: 'AAAAA',
    initialState: ['A', 'A', 'A', 'A', 'A'],
    cipherHintEn: '',
    cipherHintAr: '',
    cipherHintImage: '',
  }),
  stageOne: StageLocationSchema.optional().default({
    coordinates: { latitude: 25.2644, longitude: 55.2982 },
    locationNameEn: '',
    locationNameAr: '',
    instructionsEn: '',
    instructionsAr: '',
  }),
  stageTwo: StageLocationSchema.optional(),
  hints: z.array(HintItemSchema).optional().default([]),
});


export const updateHuntSchema = createHuntSchema.partial();

export const verifyCipherSolutionSchema = z.object({
  huntId: z.string().min(24, 'Valid Hunt ID is required'),
  sequence: z.string().min(3, 'Cipher sequence must be at least 3 characters').toUpperCase(),
  hunterEmail: z.string().email().optional(),
});

export const getHuntByIdSchema = z.object({
  id: z.string().min(24, 'Valid Hunt ID is required'),
});

import { z } from 'zod';
import { Availability } from './availability.model';
import { upsertAvailabilitySchema } from './availability.validation';

type AvailabilityInput = z.infer<typeof upsertAvailabilitySchema>;

export const listProviderAvailability = async (providerId: string) => {
  return Availability.find({ provider: providerId, isActive: true }).sort({ weekday: 1, startTime: 1 }).lean();
};

export const createAvailability = async (providerId: string, input: AvailabilityInput) => {
  return Availability.create({ ...input, provider: providerId });
};

import { z } from 'zod';
import { Service } from './service.model';
import { AppError } from '../../utils/response';
import { createServiceSchema, updateServiceSchema } from './service.validation';

type CreateServiceInput = z.infer<typeof createServiceSchema>;
type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export const createProviderService = async (providerId: string, input: CreateServiceInput) => {
  return Service.create({ ...input, provider: providerId });
};

export const listActiveServices = async () => {
  return Service.find({ isActive: true })
    .populate('provider', 'name businessName ratingAverage ratingCount')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
};

export const updateProviderService = async (providerId: string, serviceId: string, input: UpdateServiceInput) => {
  const service = await Service.findOneAndUpdate({ _id: serviceId, provider: providerId }, input, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!service) {
    throw new AppError(404, 'Service was not found for this provider', 'SERVICE_NOT_FOUND');
  }

  return service;
};

import { z } from 'zod';
import { Provider } from './provider.model';
import { updateProviderSchema } from './provider.validation';
import { AppError } from '../../utils/response';
import { geoSearchQuerySchema } from '../common.validation';
import { Service } from '../service/service.model';
import { ServiceRequest } from '../request/request.model';
import { Payment } from '../payment/payment.model';

type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
type ProviderSearchInput = z.infer<typeof geoSearchQuerySchema>;

export const listVerifiedProviders = async (input?: ProviderSearchInput) => {
  const filter: Record<string, unknown> = { status: 'ACTIVE', verificationStatus: 'VERIFIED' };

  if (input?.city) {
    filter.city = new RegExp(`^${input.city}$`, 'i');
  }

  if (input?.availableNow) {
    filter.availabilityStatus = 'ONLINE';
  }

  if (input?.category || input?.service) {
    const serviceFilter: Record<string, unknown> = { isActive: true };
    if (input.category) {
      serviceFilter.category = input.category;
    }
    if (input.service) {
      serviceFilter._id = input.service;
    }

    const providerIds = await Service.distinct('provider', serviceFilter);
    filter._id = { $in: providerIds };
  }

  if (input?.latitude !== undefined && input.longitude !== undefined) {
    filter.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [input.longitude, input.latitude],
        },
        $maxDistance: input.radiusKm * 1000,
      },
    };
  }

  return Provider.find(filter)
    .select('-password')
    .sort({ ratingAverage: -1, createdAt: -1 })
    .skip(input ? (input.page - 1) * input.limit : 0)
    .limit(input?.limit ?? 50)
    .lean();
};

export const getProviderById = async (providerId: string) => {
  const provider = await Provider.findById(providerId).select('-password').lean();
  if (!provider) {
    throw new AppError(404, 'Provider profile was not found', 'PROVIDER_NOT_FOUND');
  }
  return provider;
};

export const updateProvider = async (providerId: string, input: UpdateProviderInput) => {
  const provider = await Provider.findByIdAndUpdate(providerId, input, {
    returnDocument: 'after',
    runValidators: true,
  }).select('-password');

  if (!provider) {
    throw new AppError(404, 'Provider profile was not found for update', 'PROVIDER_NOT_FOUND');
  }

  return provider;
};

export const getProviderDashboard = async (providerId: string) => {
  const [services, pendingRequests, activeRequests, payments] = await Promise.all([
    Service.countDocuments({ provider: providerId, isActive: true }),
    ServiceRequest.countDocuments({ provider: providerId, status: 'PENDING' }),
    ServiceRequest.countDocuments({ provider: providerId, status: { $in: ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_SERVICE'] } }),
    Payment.find({ provider: providerId }).select('amount status providerPayoutStatus createdAt').sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const paidTotal = payments
    .filter((payment) => (payment.status as string) === 'COMPLETED' || (payment.status as string) === 'SUCCEEDED')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return {
    services,
    pendingRequests,
    activeRequests,
    recentPayments: payments,
    paidTotal,
  };
};

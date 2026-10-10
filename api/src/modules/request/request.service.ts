import { z } from 'zod';
import { ServiceRequest } from './request.model';
import { createRequestSchema, updateRequestStatusSchema } from './request.validation';
import { AppError } from '../../utils/response';
import { Provider } from '../provider/provider.model';
import { AuthRole } from '../../middlewares/auth.middleware';

type CreateRequestInput = z.infer<typeof createRequestSchema>;
type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;

export const createCustomerRequest = async (customerId: string, input: CreateRequestInput) => {
  const provider = await Provider.findOne({
    _id: input.provider,
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED',
  }).select('_id availabilityStatus').lean();

  if (!provider) {
    throw new AppError(404, 'Selected verified provider was not found', 'PROVIDER_NOT_FOUND');
  }

  if (provider.availabilityStatus !== 'ONLINE') {
    throw new AppError(409, 'Selected provider is not available now', 'PROVIDER_NOT_AVAILABLE');
  }

  return ServiceRequest.create({
    ...input,
    customer: customerId,
    status: 'PENDING',
    statusHistory: [
      {
        status: 'PENDING',
        changedBy: customerId,
        changedByRole: 'CUSTOMER',
        note: 'Customer submitted walk-in request',
        changedAt: new Date(),
      },
    ],
  });
};

export const listRequestsForAccount = async (accountId: string, role: AuthRole) => {
  const filter =
    role === 'CUSTOMER'
      ? { customer: accountId }
      : role === 'PROVIDER'
        ? { provider: accountId }
        : {};

  return ServiceRequest.find(filter)
    .populate('category', 'name slug')
    .populate('customer', 'name phone email')
    .populate('provider', 'name businessName phone city address location')
    .populate('service', 'title basePrice priceUnit')
    .sort({ createdAt: -1 })
    .lean();
};

const providerAllowedStatuses = ['ACCEPTED', 'DECLINED', 'EN_ROUTE', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'NO_SHOW'] as const;
const customerAllowedStatuses = ['CANCELED'] as const;

export const updateRequestLifecycleStatus = async (
  accountId: string,
  role: AuthRole,
  requestId: string,
  input: UpdateRequestStatusInput
) => {
  if (role === 'CUSTOMER' && !customerAllowedStatuses.includes(input.status as never)) {
    throw new AppError(403, 'Customers can only cancel their own walk-in requests', 'REQUEST_STATUS_NOT_ALLOWED');
  }

  if (role === 'PROVIDER' && !providerAllowedStatuses.includes(input.status as never)) {
    throw new AppError(403, 'Providers cannot apply the requested walk-in status', 'REQUEST_STATUS_NOT_ALLOWED');
  }

  const filter =
    role === 'CUSTOMER'
      ? { _id: requestId, customer: accountId }
      : role === 'PROVIDER'
        ? { _id: requestId, provider: accountId }
        : { _id: requestId };

  const request = await ServiceRequest.findOneAndUpdate(filter, {
    $set: {
      status: input.status,
      ...(input.status === 'ACCEPTED' || input.status === 'DECLINED' ? { providerRespondedAt: new Date() } : {}),
    },
    $push: {
      statusHistory: {
        status: input.status,
        changedBy: accountId,
        changedByRole: role,
        note: input.note,
        changedAt: new Date(),
      },
    },
  }, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!request) {
    throw new AppError(404, 'Walk-in request was not found for this account', 'REQUEST_NOT_FOUND');
  }

  return request;
};

export const confirmAcceptedRequest = async (customerId: string, requestId: string) => {
  const request = await ServiceRequest.findOneAndUpdate(
    { _id: requestId, customer: customerId, status: 'ACCEPTED' },
    {
      customerConfirmedAt: new Date(),
      $push: {
        statusHistory: {
          status: 'ACCEPTED',
          changedBy: customerId,
          changedByRole: 'CUSTOMER',
          note: 'Customer confirmed proceeding with accepted service',
          changedAt: new Date(),
        },
      },
    },
    { returnDocument: 'after', runValidators: true }
  );

  if (!request) {
    throw new AppError(404, 'Accepted walk-in request was not found for confirmation', 'REQUEST_NOT_FOUND');
  }

  return request;
};

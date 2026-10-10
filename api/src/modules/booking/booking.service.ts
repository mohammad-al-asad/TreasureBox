import { z } from 'zod';
import { Booking } from './booking.model';
import { Service } from '../service/service.model';
import { createBookingSchema, updateBookingStatusSchema } from './booking.validation';
import { AppError } from '../../utils/response';

type CreateBookingInput = z.infer<typeof createBookingSchema>;
type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

export const createCustomerBooking = async (customerId: string, input: CreateBookingInput) => {
  const service = await Service.findOne({ _id: input.service, provider: input.provider, isActive: true }).select('basePrice').lean();
  if (!service) {
    throw new AppError(404, 'Requested active service was not found for this provider', 'SERVICE_NOT_FOUND');
  }

  return Booking.create({
    customer: customerId,
    provider: input.provider,
    service: input.service,
    scheduledAt: input.scheduledAt,
    address: input.address,
    amount: service.basePrice,
  });
};

export const listMyBookings = async (accountId: string, role: 'CUSTOMER' | 'PROVIDER') => {
  const filter = role === 'CUSTOMER' ? { customer: accountId } : { provider: accountId };
  return Booking.find(filter)
    .populate('customer', 'name email phone')
    .populate('provider', 'name businessName phone')
    .populate('service', 'title basePrice priceUnit')
    .sort({ scheduledAt: -1 })
    .lean();
};

export const updateBookingStatus = async (bookingId: string, input: UpdateBookingStatusInput) => {
  const booking = await Booking.findByIdAndUpdate(bookingId, input, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!booking) {
    throw new AppError(404, 'Booking was not found for status update', 'BOOKING_NOT_FOUND');
  }

  return booking;
};

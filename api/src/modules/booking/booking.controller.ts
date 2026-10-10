import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { createCustomerBooking, listMyBookings, updateBookingStatus } from './booking.service';

export const createBookingController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const booking = await createCustomerBooking(req.auth!.accountId, req.body);
  res.status(201).json(sendSuccess('Booking created successfully', booking));
});

export const listMyBookingsController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const bookings = await listMyBookings(req.auth!.accountId, req.auth!.role as 'CUSTOMER' | 'PROVIDER');
  res.status(200).json(sendSuccess('Bookings fetched successfully', bookings));
});

export const updateBookingStatusController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const booking = await updateBookingStatus(req.params.bookingId, req.body);
  res.status(200).json(sendSuccess('Booking status updated successfully', booking));
});

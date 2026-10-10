import { z } from 'zod';
import { Review } from './review.model';
import { Booking } from '../booking/booking.model';
import { Provider } from '../provider/provider.model';
import { createReviewSchema } from './review.validation';
import { AppError } from '../../utils/response';

type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const createReview = async (customerId: string, input: CreateReviewInput) => {
  const booking = await Booking.findOne({ _id: input.booking, customer: customerId, status: 'COMPLETED' }).lean();
  if (!booking) {
    throw new AppError(404, 'Completed booking was not found for this customer', 'COMPLETED_BOOKING_NOT_FOUND');
  }

  const review = await Review.create({
    booking: booking._id,
    customer: customerId,
    provider: booking.provider,
    rating: input.rating,
    comment: input.comment,
  });

  const stats = await Review.aggregate<{ _id: string; average: number; count: number }>([
    { $match: { provider: booking.provider } },
    { $group: { _id: '$provider', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (stats[0]) {
    await Provider.findByIdAndUpdate(booking.provider, {
      ratingAverage: Number(stats[0].average.toFixed(2)),
      ratingCount: stats[0].count,
    });
  }

  return review;
};

export const listProviderReviews = async (providerId: string) => {
  return Review.find({ provider: providerId, moderationStatus: 'VISIBLE' }).populate('customer', 'name avatar').sort({ createdAt: -1 }).lean();
};

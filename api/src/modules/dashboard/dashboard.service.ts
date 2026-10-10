import { Hunt } from '../hunt/hunt.model';
import { Payment } from '../payment/payment.model';
import { Claim } from '../claim/claim.model';

export interface IDashboardMetrics {
  totalRevenue: number;
  activeHuntsCount: number;
  inProgressHuntsCount: number;
  pendingClaimsCount: number;
  foundHuntsCount: number;
  totalHuntsCount: number;
  recentClaims: unknown[];
  recentPayments: unknown[];
}

export class DashboardService {
  public async getOverviewMetrics(): Promise<IDashboardMetrics> {
    const [
      activeHuntsCount,
      inProgressHuntsCount,
      foundHuntsCount,
      totalHuntsCount,
      pendingClaimsCount,
      recentClaims,
      recentPayments,
      revenueResult,
    ] = await Promise.all([
      Hunt.countDocuments({ status: 'LIVE' }),
      Hunt.countDocuments({ status: 'IN_PROGRESS' }),
      Hunt.countDocuments({ status: 'FOUND' }),
      Hunt.countDocuments(),
      Claim.countDocuments({ status: 'PENDING_REVIEW' }),
      Claim.find().sort({ createdAt: -1 }).limit(5).populate('huntId', 'titleEn price').lean(),
      Payment.find().sort({ createdAt: -1 }).limit(5).populate('huntId', 'titleEn price').lean(),
      Payment.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return {
      totalRevenue,
      activeHuntsCount,
      inProgressHuntsCount,
      pendingClaimsCount,
      foundHuntsCount,
      totalHuntsCount,
      recentClaims,
      recentPayments,
    };
  }
}

export const dashboardService = new DashboardService();

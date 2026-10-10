import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError, sendSuccess } from '../../utils/response';
import { Provider } from '../provider/provider.model';
import { buildProviderDirections, getNavigationForRole } from './navigation.service';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const navigation = getNavigationForRole(role === 'CUSTOMER' || role === 'PROVIDER' || role === 'ADMIN' ? role : undefined);
    res.status(200).json(sendSuccess('Navigation items fetched successfully', navigation));
  })
);

router.get(
  '/providers/:providerId/directions',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const provider = await Provider.findById(req.params.providerId).select('businessName address location').lean();
    if (!provider) {
      throw new AppError(404, 'Provider was not found for navigation directions', 'PROVIDER_NOT_FOUND');
    }

    res.status(200).json(sendSuccess('Provider navigation directions fetched successfully', buildProviderDirections(provider)));
  })
);

export default router;

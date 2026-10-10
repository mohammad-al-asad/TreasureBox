import { NextFunction, Request, Response } from 'express';

export const asyncHandler = <
  Req extends Request = Request,
  Res extends Response = Response
>(
  handler: (req: Req, res: Res, next: NextFunction) => Promise<void>
) => {
  return (req: Req, res: Res, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
};

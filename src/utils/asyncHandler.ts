import { NextFunction } from "express";

export const asycHandler =
  (requestHandler: Function) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };

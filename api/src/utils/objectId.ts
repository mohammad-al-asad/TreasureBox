import { Types } from 'mongoose';

export const isValidObjectId = (value: string): boolean => Types.ObjectId.isValid(value);

export const toObjectId = (value: string): Types.ObjectId => new Types.ObjectId(value);

import { z } from 'zod';
import { Customer } from './customer.model';
import { AppError } from '../../utils/response';
import { updateCustomerSchema } from './customer.validation';

type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const getCustomerById = async (customerId: string) => {
  const customer = await Customer.findById(customerId).select('-password').lean();
  if (!customer) {
    throw new AppError(404, 'Customer profile was not found', 'CUSTOMER_NOT_FOUND');
  }
  return customer;
};

export const updateCustomer = async (customerId: string, input: UpdateCustomerInput) => {
  const customer = await Customer.findByIdAndUpdate(customerId, input, {
    returnDocument: 'after',
    runValidators: true,
  }).select('-password');

  if (!customer) {
    throw new AppError(404, 'Customer profile was not found for update', 'CUSTOMER_NOT_FOUND');
  }

  return customer;
};

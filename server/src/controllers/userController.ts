import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as userSvc from '../services/userService';
import { listQuerySchema } from '../validators/structureSchemas';

function id(req: Request): string {
  return req.params['id'] ?? '';
}

function parseListQuery(req: Request) {
  return listQuerySchema.parse({ ...req.query });
}

export const getUsers = catchAsync(async (req, res) => {
  const result = await userSvc.listUsers(parseListQuery(req));
  res.status(200).json({ status: 'success', data: result });
});

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await userSvc.getUser(id(req));
  res.status(200).json({ status: 'success', data: { user } });
});

export const postUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userSvc.createUser(req.body as Parameters<typeof userSvc.createUser>[0]);
  res.status(201).json({ status: 'success', data: { user } });
});

export const putUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userSvc.updateUser(id(req), req.body as Parameters<typeof userSvc.updateUser>[1]);
  res.status(200).json({ status: 'success', data: { user } });
});

export const removeUser = catchAsync(async (req: Request, res: Response) => {
  await userSvc.deleteUser(id(req));
  res.status(204).send();
});

export const bulkImport = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ status: 'error', statusCode: 400, message: 'No CSV file uploaded. Use field name "file".' });
    return;
  }
  const result = await userSvc.bulkImportUsers(req.file.buffer);
  res.status(200).json({ status: 'success', data: result });
});

export const putFacultyProfile = catchAsync(async (req: Request, res: Response) => {
  const { subjectsAssigned, preferredSlots } = req.body as { subjectsAssigned: string[]; preferredSlots: string[] };
  const user = await userSvc.assignFacultyProfile(id(req), subjectsAssigned ?? [], preferredSlots ?? []);
  res.status(200).json({ status: 'success', data: { user } });
});

import { Request, Response } from 'express';
import User from '../models/User';

export const index = (req: Request, res: Response) => {
  res.send('User Controller is working!');
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, age } = req.body;
  try {
    const newUser = new User({ name, email, age });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: 'Error creating user' });
  }
};

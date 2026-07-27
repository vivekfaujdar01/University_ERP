import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';

// Typed wrappers to avoid importing AppDispatch/RootState everywhere
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);

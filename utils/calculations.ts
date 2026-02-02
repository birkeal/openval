
import { Round, InitialData } from '../types';

/**
 * Parses a string input with shortcuts like 'k' or 'm' into a full numerical string.
 * Example: '3m' -> '3000000', '10k' -> '10000'
 */
export const parseCurrencyShortcut = (input: string): string => {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return '';

  let multiplier = 1;
  let numericPart = trimmed;

  if (trimmed.endsWith('k')) {
    multiplier = 1000;
    numericPart = trimmed.slice(0, -1);
  } else if (trimmed.endsWith('m')) {
    multiplier = 1000000;
    numericPart = trimmed.slice(0, -1);
  } else if (trimmed.endsWith('b')) {
    multiplier = 1000000000;
    numericPart = trimmed.slice(0, -1);
  }

  const value = parseFloat(numericPart);
  if (isNaN(value)) return input; // Return original if not a number

  return (value * multiplier).toString();
};

export const calculateInitialRound = (data: InitialData): Round => {
  const userValue = (data.userOwnershipPercentage / 100) * data.companyValuation;

  return {
    id: 'initial',
    name: 'Initial State',
    date: new Date().toISOString().split('T')[0],
    investmentAmount: 0,
    preMoneyValuation: data.companyValuation,
    postMoneyValuation: data.companyValuation,
    userOwnershipPercentage: data.userOwnershipPercentage,
    userValue: userValue,
    isInitial: true
  };
};

export const calculateNextRound = (
  prevRound: Round,
  investment: number,
  preMoneyValuation: number,
  roundName: string
): Round => {
  const postMoneyValuation = preMoneyValuation + investment;
  
  // The fraction of the company that existing shareholders retain
  const dilutionFactor = preMoneyValuation / postMoneyValuation;
  
  // User's new ownership after dilution
  const userOwnershipPercentage = prevRound.userOwnershipPercentage * dilutionFactor;
  const userValue = (userOwnershipPercentage / 100) * postMoneyValuation;

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: roundName,
    date: new Date().toISOString().split('T')[0],
    investmentAmount: investment,
    preMoneyValuation: preMoneyValuation,
    postMoneyValuation: postMoneyValuation,
    userOwnershipPercentage: userOwnershipPercentage,
    userValue: userValue
  };
};

// for the simplicity, I hardcoded the domain value here. Will need to tune this part for production
const DEV_DOMAIN = 'http://localhost:8000';
const PROD_DOMAIN = 'https://wise-craft-server.onrender.com';

export const DOMAIN_URL = DEV_DOMAIN;

type CreditPackage = {
	credits: number;
	price: number;
};

export const CREDIT_PACKAGES: Record<string, CreditPackage> = {
	'25': { credits: 25, price: 3.99 },
	'65': { credits: 65, price: 7.99 },
};

export const FREE_TIER_USER_CREDIT_COUNT = 10;

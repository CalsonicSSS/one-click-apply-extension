// for the simplicity, I hardcoded the domain value here. Will need to tune this part for production
const DEV_DOMAIN = 'http://localhost:8000';
const PROD_DOMAIN = 'https://one-click-apply-server.onrender.com';

export const DOMAIN_URL = PROD_DOMAIN;

type CreditPackage = {
	credits: number;
	price: number;
};

export const CREDIT_PACKAGES: Record<string, CreditPackage> = {
	'15': { credits: 15, price: 3.99 },
	'40': { credits: 40, price: 8.99 },
};

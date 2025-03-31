import { DOMAIN_URL } from '@/constants/environments';
import type { CreditPaymentRequestInputs } from '@/types/payment';

export const createCheckoutSession = async ({ browserId, packageId }: { browserId: string; packageId: string }) => {
	const requestPayload: CreditPaymentRequestInputs = {
		browser_id: browserId,
		package: packageId,
	};

	const response = await fetch(`${DOMAIN_URL}/api/v1/payments/create-session`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestPayload),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail);
	}

	const data = await response.json();
	return data.url as string;
};

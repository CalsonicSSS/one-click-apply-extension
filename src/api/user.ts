import { DOMAIN_URL } from '@/constants/environments';

export const getUserCredits = async (browserId: string) => {
	const response = await fetch(`${DOMAIN_URL}/api/v1/users/get-or-create?browser_id=${browserId}`, {
		headers: {
			'Content-Type': 'application/json',
		},
	});

	// Handle non-2xx responses
	if (!response.ok) {
		// fastapi will return a error json object with a "detail" key
		const error = await response.json();
		// directly throw the error, which will be caught later by the tanstack query process later
		throw new Error(error.detail);
	}
	const data = await response.json();
	return data.credits as number;
};

import { createCheckoutSession } from '@/api/payment';
import { getUserCredits } from '@/api/user';
import { Card } from '@/components/ui/card';
import { CREDIT_PACKAGES } from '@/constants/environments';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

export function CreditManager({ browserId }: { browserId: string }) {
	const [credits, setCredits] = useState<number>(0);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchUserCredits = async () => {
			try {
				const credits = await getUserCredits(browserId);
				setCredits(credits);
			} catch (error) {
				console.error('Error fetching credits:', error);
			}
		};
		fetchUserCredits();
	}, [browserId]);

	const handlePurchase = async (packageId: string) => {
		try {
			setLoading(true);
			const url = await createCheckoutSession({ browserId, packageId });

			// Open Stripe checkout in a new window
			window.open(url, '_blank');
		} catch (error) {
			console.error('Error creating checkout session:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className='mb-4 p-4'>
			<div className='flex flex-col space-y-4'>
				<div className='flex items-center justify-between'>
					<h3 className='text-sm font-semibold'>Purchase Credits</h3>
					<span className='text-sm font-bold'>{credits}</span>
				</div>

				<div className='grid grid-cols-2 gap-4'>
					{Object.entries(CREDIT_PACKAGES).map(([id, pkg]) => (
						<Button
							key={id}
							variant='outline'
							onClick={() => handlePurchase(id)}
							disabled={loading}
							className='flex flex-col p-4'
						>
							<span className='text-md font-semibold'>{pkg.credits} Credits</span>
						</Button>
					))}
				</div>
			</div>
		</Card>
	);
}

import { createCheckoutSession } from '@/api/payment';
import { Card } from '@/components/ui/card';
import { CREDIT_PACKAGES } from '@/constants/environments';
import { useState } from 'react';
import { Button } from './ui/button';

export function CreditManager({ browserId, credits }: { browserId: string | null; credits: number | null }) {
	const [loading, setLoading] = useState(false);

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

	if (!browserId || !credits) {
		return <></>;
	}
	return (
		<Card className='mb-4 p-4'>
			<div className='flex flex-col space-y-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center'>
						<h3 className='mr-2 text-sm font-semibold'>Credits Left:</h3>
						<span className='text-sm font-bold text-emerald-600'>{credits}</span>
					</div>
					<span className='ml-2 text-xs font-medium'>Purchase more below 🚀</span>
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

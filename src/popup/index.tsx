import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import '../globals.css';

function IndexPopup() {
	const [count, setCount] = useState<number>(1);

	return (
		<div className='min-w-max space-y-4 p-4'>
			<h1>Welcome</h1>
			<div className='flex items-center gap-3'>
				<Button
					onClick={() =>
						setCount((pre: number) => {
							return pre + 1;
						})
					}
				>
					Increase +
				</Button>
				<Badge>count: {count}</Badge>
			</div>
		</div>
	);
}

export default IndexPopup;

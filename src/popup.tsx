import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import './globals.css';

const Popup = () => {
	const openSidePanel = async () => {
		try {
			// Get the current tab
			const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

			if (tab?.id) {
				// Try to open side panel
				await chrome.sidePanel.open({ tabId: tab.id });

				// Set options for the side panel
				await chrome.sidePanel.setOptions({
					tabId: tab.id,
					path: 'sidepanel.html',
					enabled: true,
				});

				// Close the popup after opening the side panel
				window.close();
			}
		} catch (error) {
			console.error('Error opening side panel:', error);
		}
	};

	// Auto-open the side panel when popup opens
	useEffect(() => {
		openSidePanel();
	}, []);

	return (
		<div className='flex w-64 flex-col items-center p-4'>
			<h2 className='mb-4 text-lg font-medium'>Wise Craft</h2>
			<p className='mb-4 text-center text-sm text-gray-500'>Click below to open the full Wise Craft experience</p>
			<Button onClick={openSidePanel} className='w-full'>
				Open Side Panel
			</Button>
		</div>
	);
};

export default Popup;

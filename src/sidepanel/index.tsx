import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../globals.css';
import SidePanelMain from './SidePanelMain';

export const queryClient = new QueryClient();

const SidePanel = () => (
	<QueryClientProvider client={queryClient}>
		<SidePanelMain />
	</QueryClientProvider>
);

export default SidePanel;

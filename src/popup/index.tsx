import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PopupMain from './PopupMain';

export const queryClient = new QueryClient();

const Index = () => (
	<QueryClientProvider client={queryClient}>
		<PopupMain />
	</QueryClientProvider>
);

export default Index;

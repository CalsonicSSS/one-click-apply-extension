export const formatDate = (date: Date): string => {
	return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD portion only (e.g., "2021-08-01") without time
};
